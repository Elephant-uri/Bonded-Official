/**
 * React Query hooks for messaging
 * 
 * These hooks provide a React Query interface for the MessagesContext,
 * offering better caching and state management.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { isNetworkError } from '../utils/rlsHelpers'

const MESSAGES_PER_PAGE = 50

const isPolicyRecursionError = (error) => {
  return error?.code === '42P17' || error?.message?.includes('infinite recursion')
}

/**
 * Hook to fetch user's conversations
 */
export function useConversations() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      console.log('📬 Fetching conversations for user:', user.id)

      // Fetch conversations where user is a participant
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          last_read_at,
          conversation:conversations (
            id,
            name,
            type,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)

      if (partError) {
        if (isNetworkError(partError)) {
          console.warn('⚠️ Network error fetching conversations, returning empty array:', partError.message || 'Connection timeout')
          return [] // Return empty array instead of throwing to prevent UI crashes
        }
        if (isPolicyRecursionError(partError)) {
          return []
        }
        console.error('❌ Error fetching conversations:', partError)
        throw partError
      }

      // Get details for each conversation
      const conversationsWithDetails = await Promise.all(
        (participations || []).map(async (item) => {
          const conv = item.conversation
          if (!conv) return null

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          // Get other participants using RPC function (avoids RLS recursion)
          let participants = []
          try {
            const { data: rpcData, error: rpcError } = await supabase
              .rpc('get_conversation_participants', { conv_id: conv.id })

            if (rpcError) {
              console.warn('RPC get_conversation_participants error:', rpcError)
            } else {
              participants = (rpcData || []).map(p => ({
                id: p.user_id,
                full_name: p.full_name,
                username: p.username,
                avatar_url: p.avatar_url,
              }))
            }
          } catch (err) {
            console.warn('Failed to get participants via RPC:', err)
          }

          const lastReadAt = item.last_read_at || '1970-01-01'
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .gt('created_at', lastReadAt)

          return {
            ...conv,
            lastMessage: lastMsg?.content || null,
            lastMessageAt: lastMsg?.created_at || conv.created_at,
            lastMessageSenderId: lastMsg?.sender_id || null,
            participants,
            unreadCount: unreadCount || 0,
            isMuted: false,
          }
        })
      )

      // Filter out nulls and empty conversations (unless user created it)
      // Industry standard: only show conversation to recipient after first message
      const sorted = conversationsWithDetails
        .filter(Boolean)
        .filter(conv => {
          // Always show conversations the user created
          if (conv.created_by === user.id) return true
          // Only show to others if there's at least one message
          return conv.lastMessage !== null
        })
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))

      console.log(`✅ Fetched ${sorted.length} conversations`)
      return sorted
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    retry: (failureCount, error) => {
      // Don't retry on network errors - they'll resolve when connection is restored
      if (isNetworkError(error)) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

/**
 * Hook to fetch messages for a conversation with pagination
 */
export function useMessages(conversationId) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!conversationId) return { messages: [], hasMore: false }

      console.log(`📨 Fetching messages for conversation: ${conversationId}, page: ${pageParam}`)

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          metadata,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + MESSAGES_PER_PAGE - 1)

      if (error) {
        if (isNetworkError(error)) {
          console.warn('⚠️ Network error fetching messages, returning empty:', error.message || 'Connection timeout')
          return { messages: [], hasMore: false } // Return empty instead of throwing
        }
        console.error('❌ Error fetching messages:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} messages`)

      const orderedMessages = (data || []).slice().reverse() // Avoid mutating Supabase data
      return {
        messages: orderedMessages,
        hasMore: data?.length === MESSAGES_PER_PAGE,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.reduce((total, page) => total + page.messages.length, 0)
    },
    enabled: !!conversationId && !!user?.id,
    staleTime: 0, // Always refetch for real-time feel
    refetchInterval: 2500, // Poll every 2.5 seconds as fallback (industry standard)
    refetchIntervalInBackground: true, // Continue polling when app is in background
    retry: (failureCount, error) => {
      // Don't retry on network errors - they'll resolve when connection is restored
      if (isNetworkError(error)) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return

    let channel = null

    const setupSubscription = () => {
      // Clean up existing subscription if any
      if (channel) {
        channel.unsubscribe()
        channel = null
      }

      channel = supabase
        .channel(`messages:${conversationId}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            console.log('📬 Real-time message received via useMessages:', payload.new.id)

            // Fetch sender details
            const { data: sender, error: senderError } = await supabase
              .from('profiles')
              .select('id, full_name, username, avatar_url')
              .eq('id', payload.new.sender_id)
              .single()

            if (senderError) {
              console.error('Error fetching sender in useMessages:', senderError)
            }

            // Parse metadata if it's a string (JSONB from database)
            let parsedMetadata = payload.new.metadata
            if (typeof payload.new.metadata === 'string') {
              try {
                parsedMetadata = JSON.parse(payload.new.metadata)
              } catch (e) {
                console.warn('Failed to parse message metadata in useMessages:', e)
                parsedMetadata = {}
              }
            }

            const newMessage = {
              ...payload.new,
              metadata: parsedMetadata || {},
              sender: sender || {
                id: payload.new.sender_id,
                full_name: 'Unknown',
                username: 'unknown',
                avatar_url: null,
              },
            }
            
            console.log('📬 useMessages: New message with metadata:', {
              id: newMessage.id,
              hasImage: parsedMetadata?.type === 'image',
              imageUrl: parsedMetadata?.imageUrl,
              imagePath: parsedMetadata?.imagePath,
            })

            // Add to cache
            queryClient.setQueryData(['messages', conversationId], (old) => {
              if (!old) {
                console.log('✅ Creating new messages cache')
                return { pages: [{ messages: [newMessage], hasMore: false }], pageParams: [0] }
              }

              const firstPage = old.pages[0]
              const existingIds = firstPage.messages.map(m => m.id)

              // Avoid duplicates
              if (existingIds.includes(newMessage.id)) {
                console.log('⚠️ Duplicate message ignored in useMessages:', newMessage.id)
                return old
              }

              console.log('✅ Adding message to cache:', newMessage.id)
              return {
                ...old,
                pages: [
                  {
                    ...firstPage,
                    messages: [...firstPage.messages, newMessage],
                  },
                  ...old.pages.slice(1),
                ],
              }
            })

            // Also update conversations list
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
          }
        )
        .subscribe((status) => {
          console.log('📡 useMessages subscription status:', status, 'for conversation:', conversationId)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to messages via useMessages for:', conversationId)
          } else if (status === 'CLOSED') {
            console.log('🔒 useMessages subscription closed for:', conversationId)
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Channel subscription error in useMessages for:', conversationId)
          } else if (status === 'TIMED_OUT') {
            console.warn('⏱️ Channel subscription timed out in useMessages for:', conversationId)
          }
        })
    }

    setupSubscription()

    return () => {
      console.log('🧹 Unsubscribing from messages channel:', conversationId)
      if (channel) {
        channel.unsubscribe()
        channel = null
      }
    }
  }, [conversationId]) // Removed queryClient from dependencies to prevent re-subscriptions

  return query
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, content, metadata = null }) => {
      if (!user?.id) throw new Error('User must be authenticated')
      if (!conversationId) throw new Error('Conversation ID is required')
      if (!content?.trim()) throw new Error('Message content is required')

      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      }

      // Add metadata if provided (for shared posts, images, etc.)
      if (metadata) {
        messageData.metadata = metadata
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      console.log('✅ Message sent:', data.id)
      return data
    },
    onSuccess: (data) => {
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook to create or get a direct conversation
 */
export function useCreateConversation() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ otherUserId, groupName, participantIds }) => {
      if (!user?.id) throw new Error('User must be authenticated')

      // If it's a direct conversation
      if (otherUserId && !participantIds) {
        try {
          // Check for existing conversation
          const { data: existing, error: existingError } = await supabase
            .rpc('find_direct_conversation', {
              user1: user.id,
              user2: otherUserId,
            })

          if (existingError) {
            if (isPolicyRecursionError(existingError)) {
              return `local-conv-${user.id}-${otherUserId}`
            }
            throw existingError
          }

          if (existing) {
            console.log('📬 Found existing conversation:', existing)
            return existing
          }
        } catch (error) {
          if (isPolicyRecursionError(error)) {
            return `local-conv-${user.id}-${otherUserId}`
          }
          throw error
        }

        // Create new direct conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            type: 'direct',
            created_by: user.id,
          })
          .select()
          .single()

        if (convError) {
          if (isPolicyRecursionError(convError)) {
            return `local-conv-${user.id}-${otherUserId}`
          }
          throw convError
        }

        // Add participants
        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: newConv.id, user_id: user.id },
            { conversation_id: newConv.id, user_id: otherUserId },
          ])

        if (partError) {
          if (isPolicyRecursionError(partError)) {
            return `local-conv-${user.id}-${otherUserId}`
          }
          throw partError
        }

        console.log('✅ Created direct conversation:', newConv.id)
        return newConv.id
      }

      // If it's a group conversation
      if (participantIds?.length) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            type: 'group',
            name: groupName || 'Group Chat',
            created_by: user.id,
          })
          .select()
          .single()

        if (convError) {
          if (isPolicyRecursionError(convError)) {
            return `local-group-${user.id}-${Date.now()}`
          }
          throw convError
        }

        // Add all participants
        const allParticipants = [...new Set([user.id, ...participantIds])]
        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert(
            allParticipants.map(userId => ({
              conversation_id: newConv.id,
              user_id: userId,
            }))
          )

        if (partError) {
          if (isPolicyRecursionError(partError)) {
            return `local-group-${user.id}-${Date.now()}`
          }
          throw partError
        }

        console.log('✅ Created group conversation:', newConv.id)
        return newConv.id
      }

      throw new Error('Must provide otherUserId or participantIds')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook to mark conversation as read
 */
export function useMarkAsRead() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId) => {
      if (!user?.id || !conversationId) return

      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate and refetch conversations immediately to update unread counts
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.refetchQueries({ queryKey: ['conversations'] })
      // Also invalidate notification count in case it includes message notifications
      queryClient.invalidateQueries({ queryKey: ['notificationCount', user?.id] })
    },
  })
}
