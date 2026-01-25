import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ChatHeader from '../components/Chat/ChatHeader'
import ChatInputBar from '../components/Chat/ChatInputBar'
import MessageList from '../components/Chat/MessageList'
import { useMarkAsRead, useMessages, useSendMessage } from '../hooks/useMessages'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useAppTheme } from './theme'

export default function Chat() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const params = useLocalSearchParams()
  const router = useRouter()
  const { user } = useAuthStore()

  // Params
  const {
    userId,           // For direct messages
    userName,
    conversationId: paramConvId,
    classId,          // For class chats (class_section_id)
    orgId,            // For org chats
    isGroupChat
  } = params

  const [conversationId, setConversationId] = useState(paramConvId)
  const [isInitializing, setIsInitializing] = useState(!paramConvId)
  const [initError, setInitError] = useState(null)
  const [conversationInfo, setConversationInfo] = useState({
    name: userName || 'Loading...',
    type: 'direct',
    participants: []
  })

  // Data Hooks
  const {
    data: messagesPage,
    isLoading: isMessagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: messagesError
  } = useMessages(conversationId)

  // Memoize messages list from infinite query
  const messages = React.useMemo(() => {
    if (!messagesPage?.pages) return []
    return messagesPage.pages.flatMap(page => page.messages || [])
  }, [messagesPage])

  const sendMessageMutation = useSendMessage()
  const markAsRead = useMarkAsRead()

  // Initialize Chat Logic - Combined to prevent race conditions
  useEffect(() => {
    const initChat = async () => {
      if (!user?.id) {
        setInitError('User not authenticated')
        setIsInitializing(false)
        return
      }

      setIsInitializing(true)
      setInitError(null)

      try {
        let targetId = paramConvId

        // Only find/create conversation if we don't have one from params
        if (!targetId) {
          // 1. Handle Direct Message (userId provided)
          if (userId) {
            console.log('🔵 Creating/finding direct chat with user:', userId)

            const { data, error } = await supabase.rpc('find_or_create_direct_chat', {
              p_user1_id: user.id,
              p_user2_id: userId
            })

            if (error) {
              console.error('❌ Error creating direct chat:', error)
              throw error
            }

            targetId = data
          }

          // 2. Handle Class Chat (classId is class_section_id)
          else if (classId) {
            console.log('🔵 Finding class chat for section:', classId)

            const { data: existingClassChat, error } = await supabase
              .from('conversations')
              .select('id')
              .eq('type', 'class')
              .eq('class_section_id', classId)
              .maybeSingle()

            if (error) {
              console.error('❌ Error finding class chat:', error)
              throw error
            }

            if (existingClassChat) {
              targetId = existingClassChat.id
            } else {
              throw new Error('Class chat not found. Make sure you are enrolled in this class.')
            }
          }

          // 3. Handle Org Chat
          else if (orgId) {
            console.log('🔵 Finding org chat for org:', orgId)

            const { data: existingOrgChat, error } = await supabase
              .from('conversations')
              .select('id')
              .eq('type', 'org')
              .eq('org_id', orgId)
              .maybeSingle()

            if (error) {
              console.error('❌ Error finding org chat:', error)
              throw error
            }

            if (existingOrgChat) {
              targetId = existingOrgChat.id
            } else {
              throw new Error('Organization chat not found. Make sure you are a member of this organization.')
            }
          }
        }

        if (!targetId) {
          throw new Error('Unable to create or find conversation')
        }

        // Set the conversation ID
        setConversationId(targetId)

        // Immediately fetch the full conversation info
        await fetchConversationInfo(targetId)

      } catch (error) {
        console.error('❌ Failed to initialize conversation:', error)
        setInitError(error.message)
      } finally {
        setIsInitializing(false)
      }
    }

    initChat()
  }, [userId, classId, orgId, paramConvId, user?.id])

  // Fetch conversation info when conversationId is set
  const fetchConversationInfo = async (convId) => {
    try {
      console.log('🔍 Fetching conversation info for:', convId)
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          name,
          class_section_id,
          org_id,
          conversation_participants(
            user_id,
            profiles(
              id,
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', convId)
        .single()

      if (error) {
        console.error('❌ Error fetching conversation:', error)
        throw error
      }

      console.log('📦 Raw conversation data:', JSON.stringify(data, null, 2))

      if (data) {
        const participants = data.conversation_participants.map(p => ({
          id: p.user_id,
          ...p.profiles
        }))

        console.log('👥 Conversation participants:', JSON.stringify(participants, null, 2))

        // For direct chats, set name to other user's name
        let displayName = data.name
        if (data.type === 'direct') {
          const otherUser = participants.find(p => p.id !== user.id)
          console.log('👤 Other user found:', otherUser)
          displayName = otherUser?.full_name || otherUser?.username || 'Chat'
        }

        console.log('✅ Setting conversationInfo state:', {
          type: data.type,
          name: displayName,
          participantCount: participants.length,
          participants: JSON.stringify(participants)
        })

        setConversationInfo({
          type: data.type,
          name: displayName,
          participants
        })
      }
    } catch (error) {
      console.error('❌ Error fetching conversation info:', error)
    }
  }

  // Mark as read when messages load
  useEffect(() => {
    if (conversationId && messages.length > 0 && !isMessagesLoading) {
      markAsRead.mutate(conversationId)
    }
  }, [conversationId, messages.length, isMessagesLoading])

  // Handlers
  const handleSendMessage = (text) => {
    if (!conversationId || !text.trim() || !user?.id) return

    sendMessageMutation.mutate({
      conversationId,
      content: text.trim(),
      senderId: user.id
    })
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Loading State
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Starting conversation...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Error State
  if (initError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ {initError}</Text>
          <Text
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            Go Back
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Messages Error State
  if (messagesError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ChatHeader
          userName={conversationInfo.name}
          userId={userId}
          isGroup={conversationInfo.type !== 'direct'}
          conversationType={conversationInfo.type}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Failed to load messages: {messagesError.message}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Get other user's avatar for direct chats
  const otherUser = conversationInfo.type === 'direct'
    ? conversationInfo.participants.find(p => p.id !== user.id)
    : null

  const otherUserAvatar = otherUser?.avatar_url

  console.log('🔎 Other user lookup:', {
    currentUserId: user?.id,
    allParticipants: conversationInfo.participants.map(p => ({ id: p.id, avatar: p.avatar_url })),
    otherUser: otherUser,
    otherUserAvatar: otherUserAvatar
  })

  console.log('🎨 Rendering header with:', {
    name: conversationInfo.name,
    avatar: otherUserAvatar,
    type: conversationInfo.type,
    participantCount: conversationInfo.participants.length,
    rawParticipants: JSON.stringify(conversationInfo.participants),
    userId: userId,
    currentUserId: user?.id
  })

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ChatHeader
        userName={conversationInfo.name}
        userAvatar={otherUserAvatar}
        userId={userId}
        isGroup={conversationInfo.type !== 'direct'}
        conversationType={conversationInfo.type}
        participants={conversationInfo.participants}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <MessageList
          messages={messages}
          currentUserId={user?.id}
          conversationId={conversationId}
          isLoading={isMessagesLoading}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={handleLoadMore}
          hasMore={hasNextPage}
        />

        <ChatInputBar
          onSend={handleSendMessage}
          isSending={sendMessageMutation.isPending}
          disabled={!conversationId}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textPrimary || '#000',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error || '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    fontSize: 16,
    color: theme.colors.bondedPurple || '#6B4EFF',
    fontWeight: '600',
    padding: 12,
  }
})
