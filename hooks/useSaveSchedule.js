/**
 * Hook to save schedule data and create section chats
 * Handles course/section/component creation and chat setup
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useSaveSchedule() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ courses, selectedSections, universityId }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to save schedule')
      }

      if (!universityId) {
        throw new Error('University ID is required')
      }

      const sectionKeys = new Set(selectedSections)
      console.log(`📋 Saving schedule: ${courses.length} courses, ${selectedSections.length} selected sections`)
      console.log(`📋 Selected sections:`, Array.from(sectionKeys))

      // Process each course
      for (const course of courses) {
        console.log(`📚 Processing course: ${course.courseCode}, sectionId: ${course.sectionId}`)
        // 1. Find or create class
        // Using classes table (not courses) with class_code and class_name
        let { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id')
          .eq('class_code', course.courseCode.trim())
          .maybeSingle()

        if (classError && classError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is fine
          console.error('Error finding class:', classError)
          throw classError
        }

        let courseId
        if (!classData) {
          // Create class with class_code and class_name
          const { data: newClass, error: createError } = await supabase
            .from('classes')
            .insert({
              class_code: course.courseCode.trim(),
              class_name: course.courseName || course.courseCode.trim(),
            })
            .select('id')
            .single()

          if (createError) {
            console.error('Error creating class:', createError)
            throw createError
          }
          courseId = newClass.id
        } else {
          courseId = classData.id
        }

        // 2. Find or create section
        // Note: Using class_sections table (not sections) and class_id (not course_id)
        // The section_code is stored in the section data, but class_sections uses different structure
        // We'll match by class_id and create if needed
        let { data: sectionData, error: sectionError } = await supabase
          .from('class_sections')
          .select('id')
          .eq('class_id', courseId)
          .maybeSingle()

        if (sectionError && sectionError.code !== 'PGRST116') {
          console.error('Error finding section:', sectionError)
          throw sectionError
        }

        let sectionId
        if (!sectionData) {
          // Create section - class_sections table structure from useClassMatching.js
          // Get the first lecture component for section details
          const lectureComponent = course.components.find((c) => c.type === 'Lecture') || course.components[0]
          const { data: newSection, error: createError } = await supabase
            .from('class_sections')
            .insert({
              class_id: courseId,
              professor_name: course.professor || null,
              semester: null, // Could be extracted from course data if available
              days_of_week: lectureComponent?.days || [],
              start_time: lectureComponent?.startTime || null,
              end_time: lectureComponent?.endTime || null,
              location: lectureComponent?.location || null,
            })
            .select('id')
            .single()

          if (createError) {
            console.error('Error creating section:', createError)
            throw createError
          }
          sectionId = newSection.id
        } else {
          sectionId = sectionData.id
        }

        // 3. Update section with component details if needed
        // Note: class_sections table stores days_of_week, start_time, end_time, location directly
        // If we have multiple components, we'll use the lecture component or first component
        // The section was already created with component data in step 2, so this is mainly for updates
        const lectureComponent = course.components.find((c) => c.type === 'Lecture') || course.components[0]
        if (lectureComponent) {
          // Update section with latest component data if it changed
          const { error: updateError } = await supabase
            .from('class_sections')
            .update({
              days_of_week: lectureComponent.days || [],
              start_time: lectureComponent.startTime || null,
              end_time: lectureComponent.endTime || null,
              location: lectureComponent.location || null,
            })
            .eq('id', sectionId)

          if (updateError) {
            console.error('Error updating section component data:', updateError)
            // Don't throw - section exists, this is just metadata update
          }
        }

        // 4. Add user to section enrollment (if not already enrolled)
        // Using user_class_enrollments table (not section_members)
        const { error: memberError } = await supabase
          .from('user_class_enrollments')
          .insert({
            user_id: user.id,
            class_id: courseId,
            section_id: sectionId,
            semester: null, // Could be extracted if available
            is_active: true,
          })
          .select()
          .single()

        // Ignore duplicate key errors (user already enrolled)
        if (memberError && memberError.code !== '23505') {
          console.error('Error adding user to class enrollment:', memberError)
          throw memberError
        }

        // 5. Ensure class forum exists for this course at user's university
        // This is what makes the class appear in the sidebar
        // IMPORTANT: Create forum for ALL courses, not just selected sections
        try {
          const { data: existingForum } = await supabase
            .from('forums')
            .select('id')
            .eq('university_id', universityId)
            .eq('name', course.courseCode.trim())
            .eq('type', 'class')
            .maybeSingle()

          if (!existingForum) {
            // Create class forum
            const { data: newForum, error: forumError } = await supabase
              .from('forums')
              .insert({
                name: course.courseCode.trim(),
                type: 'class',
                university_id: universityId,
                description: `Forum for ${course.courseCode.trim()}`,
                is_public: false,
              })
              .select('id')
              .single()

            if (forumError && forumError.code !== '23505') {
              // Ignore duplicate errors (race condition)
              console.error('Error creating class forum:', forumError)
              // Don't throw - forum creation is non-critical, enrollment is more important
            } else if (newForum) {
              console.log(`✅ Created class forum for ${course.courseCode.trim()} (ID: ${newForum.id})`)
            }
          } else {
            console.log(`✅ Class forum already exists for ${course.courseCode.trim()}`)
          }
        } catch (forumErr) {
          console.error('Exception creating forum:', forumErr)
          // Continue - don't block enrollment
        }

        // 6. If section is selected and has a Lecture component, ensure group chat exists and user is added
        const sectionKey = `${course.courseCode}-${course.sectionId}`
        const hasLecture = course.components.some((c) => c.type === 'Lecture')
        
        // Debug logging
        console.log(`🔍 Checking section: ${sectionKey}, hasLecture: ${hasLecture}, in selectedSections: ${sectionKeys.has(sectionKey)}`)

        if (sectionKeys.has(sectionKey) && hasLecture) {
          try {
            // Create or find group conversation for this section
            // Use naming convention: "{CourseCode} Section {SectionId}"
            const chatName = `${course.courseCode.trim()} Section ${course.sectionId}`
            
            // Check if conversation already exists
            const { data: existingConv, error: checkError } = await supabase
              .from('conversations')
              .select('id')
              .eq('type', 'group')
              .eq('name', chatName)
              .maybeSingle()

            if (checkError && checkError.code !== 'PGRST116') {
              console.error('Error checking for existing conversation:', checkError)
            }

            let conversationId
            if (existingConv) {
              conversationId = existingConv.id
              console.log(`✅ Found existing chat for ${chatName} (ID: ${conversationId})`)
              // Ensure user is a participant
              const { error: participantError } = await supabase
                .from('conversation_participants')
                .insert({
                  conversation_id: conversationId,
                  user_id: user.id,
                })
                .select()
                .single()
              
              if (participantError && participantError.code !== '23505') {
                console.error('Error adding user to existing chat:', participantError)
              } else if (!participantError) {
                console.log(`✅ Added user to existing chat ${chatName}`)
              }
            } else {
              // Create new group conversation for this section
              const { data: newConv, error: convError } = await supabase
                .from('conversations')
                .insert({
                  name: chatName,
                  type: 'group',
                  created_by: user.id,
                })
                .select('id')
                .single()

              if (convError) {
                console.error('Error creating section chat:', convError)
              } else if (newConv) {
                conversationId = newConv.id
                // Add user as participant
                const { error: participantError } = await supabase
                  .from('conversation_participants')
                  .insert({
                    conversation_id: conversationId,
                    user_id: user.id,
                  })
                
                if (participantError && participantError.code !== '23505') {
                  console.error('Error adding user to new chat:', participantError)
                } else {
                  console.log(`✅ Created section chat for ${chatName} (ID: ${conversationId})`)
                }
              }
            }
          } catch (chatErr) {
            console.error('Exception creating chat:', chatErr)
            // Continue - don't block enrollment
          }
        } else {
          console.log(`⏭️ Skipping chat creation for ${sectionKey} - not selected or no lecture`)
        }
      }

      return { success: true }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.invalidateQueries({ queryKey: ['forums'] }) // Refresh sidebar
      console.log('✅ Schedule saved successfully')
    },
    retry: 1,
  })
}


