import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import YearbookProfileModalContent from '../components/YearbookProfileModalContent'
import { useMessagesContext } from '../contexts/MessagesContext'
import { hp, wp } from '../helpers/common'
import { analyzeConversationQuality, getConversationSuggestions } from '../services/linkAIConversation'
import { isFeatureEnabled } from '../utils/featureGates'
import { moderateMessage } from '../services/messageModeration'
import { useAppTheme } from './theme'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { uploadImageToBondedMedia, createSignedUrlForPath } from '../helpers/mediaStorage'
import { useFriendshipStatus } from '../hooks/useFriends'
import { useProfilePhotos } from '../hooks/useProfiles'
import { formatTimestamp } from '../utils/dateFormatters'
import { useMarkAsRead } from '../hooks/useMessages'
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile'

export default function Chat() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const params = useLocalSearchParams()
  const { user } = useAuthStore()
  const markAsRead = useMarkAsRead()
  const {
    sendMessage: sendMessageToContext,
    loadMessages,
    getOrCreateConversation,
    messages: contextMessages,
    isLoading,
    unsendMessage,
    unsubscribeFromMessages,
    realtimeDisabled,
  } = useMessagesContext()

  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showLinkAI, setShowLinkAI] = useState(false)
  const [linkAISuggestions, setLinkAISuggestions] = useState([])
  const [conversationQuality, setConversationQuality] = useState(null)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [typingUserName, setTypingUserName] = useState('')
  const [typingUserAvatar, setTypingUserAvatar] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [recipientProfile, setRecipientProfile] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showUnsendModal, setShowUnsendModal] = useState(false)
  const [sharedProfile, setSharedProfile] = useState(null)
  const [reactionSummaries, setReactionSummaries] = useState({}) // { messageId: { userIds: [] } }
  const [reactionProfiles, setReactionProfiles] = useState({}) // { userId: { id, full_name, username, avatar_url } }
  const [showReactionModal, setShowReactionModal] = useState(false)
  const [reactionModalMessageId, setReactionModalMessageId] = useState(null)
  const [lastTapMessageId, setLastTapMessageId] = useState(null)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [senderProfiles, setSenderProfiles] = useState({})
  const [activeGroupProfile, setActiveGroupProfile] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [groupMembers, setGroupMembers] = useState([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [editingGroupName, setEditingGroupName] = useState(false)
  const [groupNameDraft, setGroupNameDraft] = useState('')
  const doubleTapTimeoutRef = useRef(null)
  const flatListRef = useRef(null)
  const messageIdsRef = useRef(new Set())
  const reactionProfilesRef = useRef({})
  const conversationIdRef = useRef(null)
  const prevConversationIdRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const typingIndicatorTimeoutRef = useRef(null)
  const channelRef = useRef(null)
  const messagePollIntervalRef = useRef(null)
  const dot1Anim = useRef(new Animated.Value(0.4)).current
  const dot2Anim = useRef(new Animated.Value(0.4)).current
  const dot3Anim = useRef(new Animated.Value(0.4)).current

  const userName = params.userName || params.forumName || 'User'
  const recipientId = params.userId
  const paramConversationId = params.conversationId
  const isGroupChat = params.isGroupChat === 'true'
  const forumName = params.forumName
  const forumId = params.forumId

  // Fetch recipient profile
  useEffect(() => {
    const fetchRecipientProfile = async () => {
      if (!recipientId || !user?.id || isGroupChat) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio, major, graduation_year, grade')
          .eq('id', recipientId)
          .single()
        
        if (error) {
          console.error('Error fetching recipient profile:', error)
          return
        }
        
        if (data) {
          setRecipientProfile(data)
        }
      } catch (error) {
        console.error('Error fetching recipient profile:', error)
      }
    }

    fetchRecipientProfile()
  }, [recipientId, user?.id])

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!isGroupChat || !conversationId) return
      setIsLoadingMembers(true)
      try {
        const { data: participants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)

        if (participantsError) {
          console.error('Error fetching group participants:', participantsError)
          setGroupMembers([])
          return
        }

        const participantIds = (participants || []).map((row) => row.user_id)
        if (participantIds.length === 0) {
          setGroupMembers([])
          return
        }

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio, major, graduation_year, grade')
          .in('id', participantIds)

        if (profilesError) {
          console.error('Error fetching group member profiles:', profilesError)
          setGroupMembers([])
          return
        }

        setGroupMembers(profiles || [])
      } catch (error) {
        console.error('Error fetching group members:', error)
      } finally {
        setIsLoadingMembers(false)
      }
    }

    fetchGroupMembers()
  }, [conversationId, isGroupChat])

  useEffect(() => {
    const fetchSenderProfiles = async () => {
      if (!isGroupChat || !conversationId) return
      const convMessages = contextMessages[conversationId]
      if (!convMessages || convMessages.length === 0) return

      const senderIds = Array.from(
        new Set(
          convMessages
            .map((msg) => msg.sender_id)
            .filter((id) => id && id !== user?.id)
        )
      )

      const missingIds = senderIds.filter((id) => !senderProfiles[id])
      if (missingIds.length === 0) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio, major, graduation_year, grade')
          .in('id', missingIds)

        if (error) {
          console.error('Error fetching sender profiles:', error)
          return
        }

        const profileMap = (data || []).reduce((acc, profile) => {
          acc[profile.id] = profile
          return acc
        }, {})
        setSenderProfiles((prev) => ({ ...prev, ...profileMap }))
      } catch (error) {
        console.error('Error fetching sender profiles:', error)
      }
    }

    fetchSenderProfiles()
  }, [contextMessages, conversationId, isGroupChat, senderProfiles, user?.id])

  // Check if string is a valid UUID (for filtering temporary message IDs)
  const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  useEffect(() => {
    reactionProfilesRef.current = reactionProfiles
  }, [reactionProfiles])

  // Get current user's profile for reaction display
  const { data: currentUserProfile } = useCurrentUserProfile()

  useEffect(() => {
    if (!user?.id || !currentUserProfile) return
    setReactionProfiles(prev => ({
      ...prev,
      [user.id]: {
        id: user.id,
        full_name: currentUserProfile.full_name || currentUserProfile.name || null,
        username: currentUserProfile.username || null,
        avatar_url: currentUserProfile.avatar_url || currentUserProfile.avatarUrl || null,
      },
    }))
  }, [user?.id, currentUserProfile])

  useEffect(() => {
    const messageIds = new Set(
      messages
        .map(m => m.id)
        .filter(Boolean)
        .filter(id => isValidUUID(id))
    )
    messageIdsRef.current = messageIds
  }, [messages])

  const ensureReactionProfiles = useCallback(async (userIds) => {
    if (!userIds?.length) return
    const existing = reactionProfilesRef.current
    const missingIds = userIds.filter(id => !existing[id])
    if (!missingIds.length) return

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', missingIds)

    if (error) {
      console.error('Error fetching reaction profiles:', error)
      return
    }

    if (data?.length) {
      const profileMap = data.reduce((acc, profile) => {
        acc[profile.id] = profile
        return acc
      }, {})
      setReactionProfiles(prev => ({ ...prev, ...profileMap }))
    }
  }, [])

  const addReactionToState = useCallback((messageId, userId) => {
    if (!messageId || !userId) return
    setReactionSummaries(prev => {
      const existing = prev[messageId]?.userIds || []
      if (existing.includes(userId)) return prev
      return {
        ...prev,
        [messageId]: { userIds: [...existing, userId] },
      }
    })
  }, [])

  const removeReactionFromState = useCallback((messageId, userId) => {
    if (!messageId || !userId) return
    setReactionSummaries(prev => {
      const existing = prev[messageId]?.userIds || []
      if (!existing.includes(userId)) return prev
      const nextIds = existing.filter(id => id !== userId)
      const next = { ...prev }
      if (nextIds.length) {
        next[messageId] = { userIds: nextIds }
      } else {
        delete next[messageId]
      }
      return next
    })
  }, [])

  // Fetch heart reactions and keep them in sync
  useEffect(() => {
    if (realtimeDisabled) return
    if (!conversationId || !user?.id || !isValidUUID(conversationId)) return

    let isActive = true
    const fetchReactions = async () => {
      const messageIds = Array.from(messageIdsRef.current)
      if (!messageIds.length) {
        if (isActive) setReactionSummaries({})
        return
      }

      try {
        const { data: reactions, error } = await supabase
          .from('message_reactions')
          .select('message_id, reaction_type, user_id')
          .in('message_id', messageIds)
          .eq('reaction_type', 'heart')

        if (error) {
          console.error('Error fetching reactions:', error)
          return
        }

        const summary = {}
        const userIds = new Set()
        reactions?.forEach(reaction => {
          if (!summary[reaction.message_id]) {
            summary[reaction.message_id] = { userIds: [] }
          }
          if (!summary[reaction.message_id].userIds.includes(reaction.user_id)) {
            summary[reaction.message_id].userIds.push(reaction.user_id)
          }
          userIds.add(reaction.user_id)
        })

        if (isActive) {
          setReactionSummaries(summary)
          await ensureReactionProfiles(Array.from(userIds))
        }
      } catch (error) {
        console.error('Error fetching reactions:', error)
      }
    }

    fetchReactions()
    const intervalId = setInterval(fetchReactions, 10000)

    return () => {
      isActive = false
      clearInterval(intervalId)
    }
  }, [conversationId, messages, user?.id])

  useEffect(() => {
    if (!conversationId || !user?.id || !isValidUUID(conversationId)) return

    const channel = supabase
      .channel(`reactions:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `reaction_type=eq.heart`,
        },
        (payload) => {
          const messageIds = messageIdsRef.current
          const reaction = payload.new || payload.old

          if (!reaction?.message_id || !messageIds.has(reaction.message_id)) {
            return
          }

          if (payload.eventType === 'INSERT' && payload.new) {
            addReactionToState(reaction.message_id, reaction.user_id)
            ensureReactionProfiles([reaction.user_id])
          } else if (payload.eventType === 'DELETE' && payload.old) {
            removeReactionFromState(reaction.message_id, reaction.user_id)
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Reaction subscription status:', status, 'for conversation:', conversationId)
      })

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, realtimeDisabled, user?.id])

  // Toggle heart reaction on a message (Instagram-style)
  const toggleHeartReaction = async (messageId) => {
    if (!user?.id || !messageId) return
    
    // Don't try to react to temporary/optimistic messages
    if (!isValidUUID(messageId)) {
      console.warn('⚠️ Cannot react to temporary message:', messageId)
      return
    }

    const hasHeart = reactionSummaries[messageId]?.userIds?.includes(user.id)

    try {
      if (hasHeart) {
        // Remove heart reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('reaction_type', 'heart')

        if (error) throw error

        removeReactionFromState(messageId, user.id)
      } else {
        // Add heart reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction_type: 'heart',
          })

        if (error) {
          if (error.code === '23505') {
            addReactionToState(messageId, user.id)
            ensureReactionProfiles([user.id])
            return
          }
          throw error
        }

        addReactionToState(messageId, user.id)
        ensureReactionProfiles([user.id])
      }
    } catch (error) {
      console.error('Error toggling heart reaction:', error)
      // Silent fail - don't show alert for reactions
    }
  }

  // Handle double tap for heart reaction (Instagram-style)
  const handleMessagePress = useCallback((item) => {
    if (!item?.id) return // Guard against invalid items
    // Don't allow reactions on unsent messages
    if (item?.metadata?.unsent) return
    
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 400 // Increased delay for better detection

    // Clear any existing timeout
    if (doubleTapTimeoutRef.current) {
      clearTimeout(doubleTapTimeoutRef.current)
      doubleTapTimeoutRef.current = null
    }

    // Check if this is a double tap on the same message
    const isDoubleTap = item.id === lastTapMessageId && lastTapTime > 0 && (now - lastTapTime) < DOUBLE_TAP_DELAY
    
    if (isDoubleTap) {
      // Double tap detected - toggle heart reaction
      console.log('❤️ Double tap detected on message:', item.id, 'Time diff:', now - lastTapTime)
      toggleHeartReaction(item.id)
      setLastTapMessageId(null)
      setLastTapTime(0)
    } else {
      // Single tap - set up for potential double tap
      console.log('👆 Single tap on message:', item.id, 'Setting up for double tap')
      setLastTapMessageId(item.id)
      setLastTapTime(now)
      doubleTapTimeoutRef.current = setTimeout(() => {
        console.log('⏱️ Double tap timeout expired for message:', item.id)
        setLastTapMessageId(null)
        setLastTapTime(0)
        doubleTapTimeoutRef.current = null
      }, DOUBLE_TAP_DELAY)
    }
  }, [lastTapMessageId, lastTapTime, toggleHeartReaction])

  // Initialize conversation and load messages
  useEffect(() => {
    const initializeChat = async () => {
      if (!user?.id) return
      try {
        let convId = null

        if (paramConversationId) {
          // Use existing conversation ID
          convId = String(paramConversationId)
        } else if (isGroupChat && forumId) {
          // Create or find group conversation for forum/class
          convId = await getOrCreateForumGroupChat(forumId, forumName || 'Class Chat')
        } else if (recipientId) {
          // Direct message - get or create 1:1 conversation
          convId = await getOrCreateConversation(recipientId)
        }

        if (convId) {
          conversationIdRef.current = convId
          setConversationId(convId)
          await loadMessages(convId)
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
      }
    }

    initializeChat()
  }, [paramConversationId, recipientId, user?.id, isGroupChat, forumId])

  // Helper: Get or create a group conversation for a forum/class
  const getOrCreateForumGroupChat = async (forumId, chatName) => {
    if (!user?.id || !forumId) return null

    try {
      // First, check if a group conversation already exists for this forum
      // We'll use a naming convention: forum group chats are named after the forum
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('type', 'group')
        .ilike('name', chatName)
        .single()

      if (existingConv?.id) {
        // Check if current user is a participant
        const { data: participant } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', existingConv.id)
          .eq('user_id', user.id)
          .single()

        if (!participant) {
          // Add user to conversation
          await supabase
            .from('conversation_participants')
            .insert({ conversation_id: existingConv.id, user_id: user.id })
        }

        return existingConv.id
      }

      let orgId = null
      try {
        const { data: forumInfo, error: forumInfoError } = await supabase
          .from('forums')
          .select('id, org_id, type')
          .eq('id', forumId)
          .maybeSingle()

        if (!forumInfoError) {
          orgId = forumInfo?.org_id || null
        }
      } catch (error) {
        // Ignore forum lookup errors; we'll still try to fetch members.
      }

      let memberIds = []
      if (orgId) {
        const { data: orgMembers, error: orgMembersError } = await supabase
          .from('org_members')
          .select('user_id, role')
          .eq('organization_id', orgId)
          .in('role', ['member', 'admin'])

        if (orgMembersError) {
          console.error('Error fetching org members:', orgMembersError)
        } else {
          memberIds = orgMembers?.map(m => m.user_id) || []
        }
      } else {
        const { data: members, error: membersError } = await supabase
          .from('forum_members')
          .select('user_id')
          .eq('forum_id', forumId)

        if (membersError?.code === 'PGRST205') {
          console.error('forum_members table missing:', membersError)
        } else if (membersError) {
          console.error('Error fetching forum members:', membersError)
        } else {
          memberIds = members?.map(m => m.user_id) || []
        }
      }

      if (!memberIds.includes(user.id)) {
        memberIds.push(user.id)
      }

      // Create new group conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          name: chatName,
          type: 'group',
          created_by: user.id,
        })
        .select()
        .single()

      if (convError) {
        console.error('Error creating group conversation:', convError)
        return null
      }

      // Add all members as participants
      const participants = memberIds.map(userId => ({
        conversation_id: newConv.id,
        user_id: userId,
      }))

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants)

      if (participantsError) {
        console.error('Error adding participants:', participantsError)
      }

      return newConv.id
    } catch (error) {
      console.error('Error in getOrCreateForumGroupChat:', error)
      return null
    }
  }

  useEffect(() => {
    if (!conversationId || !isValidUUID(conversationId)) return
    if (prevConversationIdRef.current && prevConversationIdRef.current !== conversationId) {
      unsubscribeFromMessages(prevConversationIdRef.current)
    }
    prevConversationIdRef.current = conversationId

    return () => {
      if (conversationId) {
        unsubscribeFromMessages(conversationId)
      }
    }
  }, [conversationId, unsubscribeFromMessages])

  useEffect(() => {
    if (!conversationId || !isValidUUID(conversationId)) return
    if (!messages.length) {
      markAsRead.mutate(conversationId)
      return
    }
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.senderId && lastMessage.senderId !== 'me') {
      markAsRead.mutate(conversationId)
    }
  }, [conversationId, messages, markAsRead])

  // Animate typing dots
  useEffect(() => {
    if (!isOtherTyping) {
      // Reset animations when not typing
      dot1Anim.setValue(0.4)
      dot2Anim.setValue(0.4)
      dot3Anim.setValue(0.4)
      return
    }

    // Create staggered animation loop
    const createAnimation = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      )
    }

    const anim1 = createAnimation(dot1Anim, 0)
    const anim2 = createAnimation(dot2Anim, 150)
    const anim3 = createAnimation(dot3Anim, 300)

    anim1.start()
    anim2.start()
    anim3.start()

    return () => {
      anim1.stop()
      anim2.stop()
      anim3.stop()
    }
  }, [isOtherTyping, dot1Anim, dot2Anim, dot3Anim])

  // Set up broadcast channel for typing indicators
  useEffect(() => {
    if (realtimeDisabled) {
      setIsOtherTyping(false)
      return
    }
    if (!conversationId || !user?.id || !isValidUUID(conversationId)) {
      console.log('⏭️ Skipping typing channel setup - invalid conversationId or user')
      return
    }

    const channelName = `chat:${conversationId}`
    console.log('🔧 Setting up typing channel:', channelName)
    
    // Clean up any existing channel first
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing typing channel')
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    
    // Add a small delay to ensure conversation is fully initialized
    const setupChannel = setTimeout(() => {
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false }, // Don't receive own broadcasts (industry standard)
        },
      })

    // Set up event listeners before subscribing
    channel
      .on('broadcast', { event: 'typing' }, async (payload) => {
        console.log('📝 Typing indicator received:', payload.payload)
        // Only show typing if it's from someone else
        if (payload.payload.userId !== user.id) {
          // Use provided name/avatar or fetch from recipient profile
          const displayName = payload.payload.userName || recipientProfile?.full_name || recipientProfile?.username || 'Someone'
          const displayAvatar = payload.payload.userAvatar || recipientProfile?.avatar_url || null
          
          console.log('✅ Showing typing indicator for:', displayName)
          setIsOtherTyping(true)
          setTypingUserName(displayName)
          setTypingUserAvatar(displayAvatar)
          
          // Clear typing indicator after 3 seconds
          if (typingIndicatorTimeoutRef.current) {
            clearTimeout(typingIndicatorTimeoutRef.current)
          }
          typingIndicatorTimeoutRef.current = setTimeout(() => {
            console.log('⏱️ Typing indicator timeout, hiding')
            setIsOtherTyping(false)
            setTypingUserName('')
            setTypingUserAvatar(null)
          }, 3000)
        } else {
          console.log('⏭️ Ignoring own typing indicator')
        }
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        console.log('🛑 Stop typing received:', payload.payload)
        if (payload.payload.userId !== user.id) {
          console.log('✅ Hiding typing indicator')
          setIsOtherTyping(false)
          setTypingUserName('')
          setTypingUserAvatar(null)
          if (typingIndicatorTimeoutRef.current) {
            clearTimeout(typingIndicatorTimeoutRef.current)
          }
        }
      })

      // Subscribe to the channel with error handling
      channel.subscribe((status) => {
        console.log('📡 Broadcast channel status:', status, 'for channel:', channelName)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to typing channel:', channelName)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel subscription error for:', channelName)
          console.log('💡 This is usually harmless - typing indicators may not work, but messages will still work')
          // Don't throw - just log the error, typing indicators are optional
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Channel subscription timed out for:', channelName)
        } else if (status === 'CLOSED') {
          console.log('🔒 Channel closed for:', channelName)
        }
      })

      channelRef.current = channel
    }, 500) // Delay to ensure conversation is ready

    return () => {
      clearTimeout(setupChannel)
      console.log('🧹 Cleaning up typing channel:', channelName)
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [conversationId, realtimeDisabled, user?.id]) // Re-subscribe when conversation changes

  // Send typing indicator (debounced)
  const sendTypingIndicator = useCallback(() => {
    if (realtimeDisabled) return
    if (!channelRef.current || !user?.id || !conversationId) return

    // Get user's display name from profile or email
    const displayName = user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'User'

    // Ensure channel is subscribed before sending
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { 
        userId: user.id, 
        userName: displayName,
        userAvatar: user.user_metadata?.avatar_url || null,
        conversationId: conversationId,
      },
    }).then(() => {
      console.log('✅ Typing indicator sent')
    }).catch((error) => {
      console.error('❌ Error sending typing indicator:', error)
    })

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { 
          userId: user.id,
          conversationId: conversationId,
        },
      }).catch((error) => {
        console.error('❌ Error sending stop typing:', error)
      })
    }, 2000)
  }, [conversationId, realtimeDisabled, user?.id, user?.email, user?.user_metadata])

  // Note: Real-time updates are handled by useMessages hook
  // No need for periodic polling as useMessages already has refetchInterval

  // Update messages when context messages change (with proper deduplication)
  useEffect(() => {
    if (conversationId && contextMessages[conversationId]) {
      const convMessages = contextMessages[conversationId]
      
      // Convert to display format, preserving existing optimistic messages
      setMessages(prev => {
        // Convert all context messages to display format
        const allDisplayMessages = convMessages.map((msg) => {
          // Parse metadata if it's a string (JSONB from database)
          let parsedMetadata = msg.metadata
          if (typeof msg.metadata === 'string') {
            try {
              parsedMetadata = JSON.parse(msg.metadata)
            } catch (e) {
              console.warn('Failed to parse message metadata:', e)
              parsedMetadata = {}
            }
          }
          
          // Check if message has image metadata
          const hasImage = parsedMetadata?.type === 'image' || parsedMetadata?.imageUrl || parsedMetadata?.imagePath
          
          return {
            id: msg.id,
            text: msg.content,
            senderId: msg.sender_id === user?.id ? 'me' : 'other',
            senderUserId: msg.sender_id,
            timestamp: formatTimestamp(msg.created_at),
            type: hasImage ? 'image' : (msg.message_type || 'text'),
            metadata: parsedMetadata || {},
            imageUrl: parsedMetadata?.imageUrl,
            status: msg.sender_id === user?.id ? 'sent' : undefined, // Instagram-style status
          }
        })
        
        // Use Map to ensure unique IDs - this prevents duplicates
        const merged = new Map()
        
        // First, add all existing optimistic messages (temp-*)
        prev.forEach(msg => {
          if (msg.id && msg.id.startsWith('temp-')) {
            merged.set(msg.id, msg)
          }
        })
        
        // Then, add all real messages (Map.set will overwrite if ID already exists)
        allDisplayMessages.forEach(msg => {
          if (!msg.id) {
            console.warn('⚠️ Message without ID found, skipping:', msg)
            return
          }
          
          // Check if this replaces an optimistic message
          // Match by content and sender for text messages, or by imagePath for images
          // For rapid sends, match the oldest "sending" optimistic message with matching content
          const optimisticKey = Array.from(merged.keys())
            .filter(key => key.startsWith('temp-'))
            .map(key => ({ key, msg: merged.get(key) }))
            .filter(({ msg: optimisticMsg }) => {
              // For text messages: match by content and sender
              if (msg.type === 'text' && optimisticMsg.type === 'text') {
                return optimisticMsg.text === msg.text && 
                       optimisticMsg.senderId === msg.senderId &&
                       optimisticMsg.status === 'sending'
              }
              
              // For images: match by type
              if (msg.metadata?.type === 'image' && optimisticMsg.metadata?.type === 'image') {
                return true
              }
              
              return false
            })
            .sort((a, b) => {
              // Sort by timestamp (oldest first) to match in order
              const aTime = parseInt(a.key.split('-').pop()) || 0
              const bTime = parseInt(b.key.split('-').pop()) || 0
              return aTime - bTime
            })[0]?.key
          
          if (optimisticKey) {
            // Replace optimistic message with real one
            merged.delete(optimisticKey)
            console.log('🔄 Replacing optimistic message', optimisticKey, 'with real message', msg.id)
          }
          
          // Add/update the real message (Map ensures uniqueness by ID)
          merged.set(msg.id, msg)
        })
        
        // Convert map to array and sort
        const sorted = Array.from(merged.values()).sort((a, b) => {
          // Optimistic messages (temp-*) go first if they're newer
          if (a.id.startsWith('temp-') && b.id.startsWith('temp-')) {
            const aTime = parseInt(a.id.split('-').pop()) || 0
            const bTime = parseInt(b.id.split('-').pop()) || 0
            return aTime - bTime
          }
          if (a.id.startsWith('temp-')) return 1
          if (b.id.startsWith('temp-')) return -1
          // Otherwise sort by timestamp
          const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return aTime - bTime
        })
        
        // Final check: log if duplicates found
        const ids = sorted.map(m => m.id)
        const uniqueIds = new Set(ids)
        if (ids.length !== uniqueIds.size) {
          console.warn('⚠️ Duplicate message IDs detected:', ids.filter((id, index) => ids.indexOf(id) !== index))
        }
        
        return sorted
      })

      // Analyze conversation quality
      analyzeConversationQuality(convMessages).then(setConversationQuality)

      // Get Link AI suggestions (only if feature is enabled)
      if (isFeatureEnabled('LINK_AI')) {
        getConversationSuggestions({
          messages: convMessages,
          recipientInfo: { name: userName },
          conversationStage: convMessages.length < 5 ? 'early' : 'ongoing',
        }).then((suggestions) => {
          setLinkAISuggestions(suggestions.suggestions || [])
        })
      }
    }
  }, [contextMessages, conversationId, userName, user?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (showSearch && searchQuery.trim()) return
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages, showSearch, searchQuery])


  const handleSend = async () => {
    if (!inputText.trim() || isSending || !conversationId) return

    setIsSending(true)
    const text = inputText.trim()
    setInputText('')

    // Stop typing indicator
    if (channelRef.current) {
      channelRef.current.send({
      type: 'broadcast',
      event: 'stop_typing',
        payload: { 
          userId: user.id,
          conversationId: conversationId,
        },
      }).catch((error) => {
        console.error('Error sending stop typing:', error)
      })
    }

    // Optimistic update - add message immediately to local state (Instagram-style)
    const optimisticId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: optimisticId,
      text,
      senderId: 'me',
      senderUserId: user?.id || null,
      timestamp: formatTimestamp(new Date().toISOString()),
      type: 'text',
      metadata: {},
      status: 'sending', // Instagram-style: sending -> sent -> delivered
    }
    setMessages(prev => [...prev, optimisticMessage])

    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)

    try {
      // AI Moderation
      const moderationResult = await moderateMessage(text)
      if (!moderationResult.allowed) {
        // Remove optimistic message
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        Alert.alert('Message Blocked', moderationResult.reason || 'Your message contains inappropriate content.')
        setIsSending(false)
        return
      }

      // Send message
      const message = await sendMessageToContext(
        conversationId,
        text
      )

      if (message) {
        // Replace optimistic message with real one
        // The real-time subscription will add it, but we replace the optimistic one immediately
        // to ensure smooth UI when sending multiple messages quickly
        setMessages(prev => {
          // Find and replace the optimistic message
          const hasOptimistic = prev.find(m => m.id === optimisticId)
          const hasReal = prev.find(m => m.id === message.id)
          
          if (hasReal) {
            // Real message already exists (from real-time), just remove optimistic
            console.log('✅ Real message already exists, removing optimistic:', optimisticId)
            return prev.filter(m => m.id !== optimisticId)
          }
          
          // Replace optimistic with real message
          console.log('🔄 Replacing optimistic message', optimisticId, 'with real', message.id)
          return prev.map(m => 
            m.id === optimisticId
              ? {
                  id: message.id,
                  text: message.content,
                  senderId: 'me',
                  timestamp: formatTimestamp(message.created_at),
                  type: 'text',
                  metadata: message.metadata || {},
                  status: 'sent',
                }
              : m
          )
        })
        setShowLinkAI(false) // Hide Link AI after sending
        
        // Scroll to bottom again after message is confirmed
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 200)
      } else {
        // If message send failed, mark as failed
        setMessages(prev => prev.map(m =>
          m.id === optimisticId
            ? { ...m, status: 'failed' }
            : m
        ))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Mark optimistic message as failed
      setMessages(prev => prev.map(m =>
        m.id === optimisticId
          ? { ...m, status: 'failed' }
          : m
      ))
      Alert.alert('Error', 'Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  // Handle text input change with typing indicator
  const handleTextChange = (text) => {
    setInputText(text)
    if (text.length > 0) {
      sendTypingIndicator()
    }
  }

  // Pick image from library
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to send images.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null)
  }

  // Upload image and send as message (Instagram-style with optimistic update)
  const sendImage = async () => {
    if (!selectedImage || !conversationId || !user?.id || uploadingImage) return

    setUploadingImage(true)
    const imageUri = selectedImage
    const caption = inputText.trim() // Get caption if user typed one
    
    // Optimistic update - add message immediately (Instagram-style)
    const optimisticId = `temp-image-${Date.now()}`
    const optimisticMessage = {
      id: optimisticId,
      text: caption || '📷 Image',
      senderId: 'me',
      senderUserId: user?.id || null,
      timestamp: formatTimestamp(new Date().toISOString()),
      type: 'image',
      metadata: {
        type: 'image',
        imageUrl: imageUri, // Use local URI for immediate display
        imagePath: null, // Will be set after upload
      },
      imageUrl: imageUri,
      status: 'sending',
    }
    setMessages(prev => [...prev, optimisticMessage])
    
    // Clear input immediately for better UX
    setSelectedImage(null)
    setInputText('')
    
    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)

    try {
      // Upload image to Supabase storage
      const uploadResult = await uploadImageToBondedMedia({
        fileUri: imageUri,
        mediaType: 'message_media',
        ownerType: 'user',
        ownerId: user.id,
        userId: user.id,
        mimeType: 'image/jpeg',
      })

      console.log('✅ Image uploaded:', uploadResult.path)

      // Get signed URL for the uploaded image
      const imageUrl = await createSignedUrlForPath(uploadResult.path)

      // Send message with image URL in metadata (and caption if provided)
      const messageContent = caption || '📷 Image'
      const message = await sendMessageToContext(
        conversationId,
        messageContent,
        {
          type: 'image',
          imageUrl: imageUrl,
          imagePath: uploadResult.path,
        }
      )

      if (message) {
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m =>
          m.id === optimisticId
            ? {
                ...m,
                id: message.id,
                metadata: {
                  type: 'image',
                  imageUrl: imageUrl,
                  imagePath: uploadResult.path,
                },
                imageUrl: imageUrl,
                status: 'sent',
                timestamp: formatTimestamp(message.created_at),
              }
            : m
        ))
        
        // Scroll to bottom again
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 200)
      } else {
        // If message send failed, mark as failed
        setMessages(prev => prev.map(m =>
          m.id === optimisticId
            ? { ...m, status: 'failed' }
            : m
        ))
        // Restore image on error
        setSelectedImage(imageUri)
        setInputText(caption)
      }
    } catch (error) {
      console.error('❌ Error sending image:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      Alert.alert('Error', 'Failed to send image. Please try again.')
      // Restore image on error
      setSelectedImage(imageUri)
      setInputText(caption)
    } finally {
      setUploadingImage(false)
    }
  }


  // Component to handle image loading with signed URL regeneration
  const MessageImage = ({ metadata, item }) => {
    const [imageUrl, setImageUrl] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
      let timeoutId
      let isMounted = true
      
      // Always regenerate signed URL from imagePath (signed URLs expire)
      const loadImage = async () => {
        try {
          setIsLoading(true)
          setHasError(false)
          
          // Parse metadata if it's a string (JSONB from database)
          let parsedMetadata = metadata
          if (typeof metadata === 'string') {
            try {
              parsedMetadata = JSON.parse(metadata)
            } catch (e) {
              console.warn('Failed to parse metadata string:', e)
              parsedMetadata = {}
            }
          }
          
          console.log('🖼️ MessageImage loading:', {
            itemId: item.id,
            metadataType: typeof metadata,
            metadata: parsedMetadata,
            itemImageUrl: item.imageUrl,
            hasImagePath: !!parsedMetadata?.imagePath,
            hasImageUrl: !!parsedMetadata?.imageUrl,
          })
          
          // Prefer imagePath over imageUrl (signed URLs expire)
          const path = parsedMetadata?.imagePath || parsedMetadata?.imageUrl || item.imageUrl
          
          if (!path) {
            console.warn('❌ No image path found in metadata:', {
              parsedMetadata,
              itemImageUrl: item.imageUrl,
            })
            if (isMounted) {
              setHasError(true)
              setIsLoading(false)
            }
            return
          }
          
          console.log('🔄 Found image path:', path)

          // Set timeout to prevent infinite loading (10 seconds)
          timeoutId = setTimeout(() => {
            if (isMounted) {
              console.warn('⏱️ Image loading timeout')
              setHasError(true)
              setIsLoading(false)
            }
          }, 10000)

          // Check if it's a local file URI (for optimistic updates - Instagram-style)
          if (path.startsWith('file://') || path.startsWith('content://') || path.startsWith('ph://')) {
            console.log('✅ Using local file URI for immediate display (optimistic update)')
            if (isMounted) {
              setImageUrl(path)
              setIsLoading(false)
            }
            return
          }

          // If it's already a full web URL
          if (path.startsWith('http://') || path.startsWith('https://')) {
            // If we have imagePath, prefer regenerating from it (signed URLs expire)
            if (parsedMetadata?.imagePath && !parsedMetadata.imagePath.startsWith('http') && !parsedMetadata.imagePath.startsWith('file://') && !parsedMetadata.imagePath.startsWith('content://') && !parsedMetadata.imagePath.startsWith('ph://')) {
              console.log('🔄 Regenerating signed URL from imagePath (stored URL might be expired)')
              try {
                const signedUrl = await createSignedUrlForPath(parsedMetadata.imagePath)
                if (isMounted) {
                  if (signedUrl) {
                    console.log('✅ Generated new signed URL from path')
                    setImageUrl(signedUrl)
                  } else {
                    console.warn('⚠️ Failed to generate signed URL, using stored URL')
                    setImageUrl(path)
                  }
                  setIsLoading(false)
                }
              } catch (err) {
                console.error('❌ Error generating signed URL, using stored URL:', err)
                if (isMounted) {
                  setImageUrl(path) // Fallback to stored URL
                  setIsLoading(false)
                }
              }
            } else {
              // No imagePath, use the stored URL
              console.log('✅ Using stored URL directly')
              if (isMounted) {
                setImageUrl(path)
                setIsLoading(false)
              }
            }
            return
          }

          // It's a storage path, generate signed URL
          console.log('🔄 Generating signed URL from storage path:', path)
          try {
            const signedUrl = await createSignedUrlForPath(path)
            if (isMounted) {
              if (signedUrl) {
                console.log('✅ Generated signed URL successfully:', signedUrl.substring(0, 50) + '...')
                setImageUrl(signedUrl)
              } else {
                console.error('❌ Failed to generate signed URL (returned null)')
                setHasError(true)
              }
              setIsLoading(false)
            }
          } catch (err) {
            console.error('❌ Error generating signed URL:', err)
            if (isMounted) {
              setHasError(true)
              setIsLoading(false)
            }
          }
    } catch (error) {
          console.error('❌ Error loading image URL:', error)
          if (isMounted) {
            setHasError(true)
            setIsLoading(false)
          }
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
        }
      }
      
      loadImage()
      
      return () => {
        isMounted = false
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }, [metadata, item.imageUrl, item.id])

    if (isLoading) {
      return (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <Text style={styles.imagePlaceholderText}>Loading image...</Text>
        </View>
      )
    }

    if (hasError || !imageUrl) {
      return (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={hp(3)} color={theme.colors.textSecondary} />
          <Text style={styles.imagePlaceholderText}>Failed to load image</Text>
        </View>
      )
    }

    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.messageImage}
        resizeMode="cover"
        onError={() => {
          // If image fails to load, try regenerating signed URL
          if (metadata?.imagePath) {
            createSignedUrlForPath(metadata.imagePath)
              .then(newUrl => {
                if (newUrl) setImageUrl(newUrl)
                else setHasError(true)
              })
              .catch(() => setHasError(true))
          } else {
            setHasError(true)
          }
        }}
      />
    )
  }

  // Handle long press on message (Instagram-style unsend)
  const handleMessageLongPress = (item) => {
    if (item.senderId === 'me' && item.id && !item.id.toString().startsWith('temp-')) {
      setSelectedMessage(item)
      setShowUnsendModal(true)
    }
  }

  // Handle unsend message
  const handleUnsend = async () => {
    if (!selectedMessage || !conversationId) return

    try {
      await unsendMessage(selectedMessage.id)
      setShowUnsendModal(false)
      setSelectedMessage(null)
    } catch (error) {
      console.error('Error unsending message:', error)
      Alert.alert('Error', 'Failed to unsend message. Please try again.')
    }
  }

  const getReactionDisplayName = (userId) => {
    if (userId === user?.id) return 'You'
    const profile = reactionProfiles[userId]
    return profile?.full_name || profile?.username || 'User'
  }

  const reactionModalUserIds = reactionModalMessageId
    ? reactionSummaries[reactionModalMessageId]?.userIds || []
    : []
  const sortedReactionModalUserIds = user?.id
    ? [
        ...reactionModalUserIds.filter(id => id === user.id),
        ...reactionModalUserIds.filter(id => id !== user.id),
      ]
    : reactionModalUserIds

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === 'me'
    const isVoiceNote = item.type === 'voice'
    const isImage = item.type === 'image' || item.metadata?.type === 'image'
    const status = item.status // 'sending', 'sent', 'delivered', 'read', 'failed'
    const isUnsent = item.metadata?.unsent
    const reactionCount = !isUnsent ? reactionSummaries[item.id]?.userIds?.length || 0 : 0
    const isHeartedByMe = !isUnsent && reactionSummaries[item.id]?.userIds?.includes(user?.id)
    const showGroupHeader = isGroupChat && !isMe
    const senderProfile = item.senderUserId
      ? item.senderUserId === user?.id
        ? currentUserProfile
        : senderProfiles[item.senderUserId]
      : null
    const senderName = item.senderId === 'me'
      ? 'You'
      : senderProfile?.full_name || senderProfile?.username || 'Member'
    
    // Check if message contains a shared post (from metadata or text parsing)
    const sharedPost = item.metadata?.shareType === 'post' 
      ? {
          title: item.metadata?.postTitle || item.metadata?.shareData?.data?.title || 'Forum Post',
          body: item.metadata?.postBody || item.metadata?.shareData?.data?.body || '',
          id: item.metadata?.postId || item.metadata?.shareData?.data?.id || null,
          forumId: item.metadata?.forumId || item.metadata?.shareData?.data?.forumId || null,
        }
      : (() => {
          // Fallback: parse from text if metadata not available
          if (!item.text || !item.text.startsWith('Post:')) return null
          const lines = item.text.split('\n')
          const titleLine = lines[0] // "Post: [title]"
          const title = titleLine.replace('Post:', '').trim()
          const body = lines.slice(1).join('\n').trim()
          return {
            title: title || 'Forum Post',
            body: body,
            id: null,
            forumId: null,
          }
        })()
    const isSharedPost = !!sharedPost
    const sharedMeta = item.metadata?.shareType ? item.metadata : null
    const sharedData = sharedMeta?.shareData?.data || {}
    const parseSharedProfileFromText = (text) => {
      if (!text || !text.startsWith('Profile:')) return null
      const lines = text.split('\n')
      const name = lines[0].replace('Profile:', '').trim()
      const metaLine = lines[1] || ''
      const metaParts = metaLine.split('•').map((part) => part.trim()).filter(Boolean)
      return {
        name: name || 'Profile',
        major: metaParts[0] || 'Student',
        yearLabel: metaParts[1] || null,
      }
    }
    const parseSharedEventFromText = (text) => {
      if (!text || !text.startsWith('Event:')) return null
      const lines = text.split('\n')
      const title = lines[0].replace('Event:', '').trim()
      const metaLine = lines[1] || ''
      const metaParts = metaLine.split('•').map((part) => part.trim()).filter(Boolean)
      return {
        title: title || 'Event',
        location: metaParts[0] || 'Event',
        dateLabel: metaParts[1] || null,
      }
    }
    const fallbackProfile = !sharedMeta && !isSharedPost ? parseSharedProfileFromText(item.text) : null
    const fallbackEvent = !sharedMeta && !isSharedPost ? parseSharedEventFromText(item.text) : null
    const sharedProfileData = sharedMeta?.shareType === 'profile' ? sharedData : fallbackProfile
    const sharedEventData = sharedMeta?.shareType === 'event' ? sharedData : fallbackEvent
    const sharedCommentData = sharedMeta?.shareType === 'comment' ? sharedData : null
    const sharedType = sharedProfileData
      ? 'profile'
      : sharedEventData
        ? 'event'
        : sharedCommentData
          ? 'comment'
          : isSharedPost
            ? 'post'
            : null

    // Render special UI for unsent messages (like Instagram/TikTok)
    if (isUnsent) {
      const unsentByMe = item.senderId === 'me'
      const unsentText = unsentByMe
        ? 'You unsent a message'
        : `${userName || 'Someone'} unsent a message`

      return (
        <View
          style={[
            styles.messageContainer,
            isMe ? styles.messageContainerMe : styles.messageContainerOther,
          ]}
        >
          <View
            style={[
              styles.unsentMessageBubble,
              isMe ? styles.unsentMessageBubbleMe : styles.unsentMessageBubbleOther,
            ]}
          >
            <Text
              style={[
                styles.unsentMessageText,
                isMe ? styles.unsentMessageTextMe : styles.unsentMessageTextOther,
              ]}
            >
              {unsentText}
            </Text>
          </View>
        </View>
      )
    }

    const messageContent = isImage ? (
          <>
            <View
              style={[
                styles.imageMessageBubble,
                isMe ? styles.imageMessageBubbleMe : styles.imageMessageBubbleOther,
              ]}
            >
              <MessageImage
                metadata={item.metadata || {}}
                item={item}
                key={`image-${item.id}-${JSON.stringify(item.metadata)}`}
              />
              {item.text && item.text !== '📷 Image' && (
                <Text
                  style={[
                    styles.imageMessageText,
                    isMe ? styles.imageMessageTextMe : styles.imageMessageTextOther,
                  ]}
                >
                  {item.text}
                </Text>
              )}
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.messageTime,
                    isMe ? styles.messageTimeMe : styles.messageTimeOther,
                  ]}
                >
                  {item.timestamp}
                </Text>
                {isMe && (
                  <View style={styles.messageStatusContainer}>
                    {status === 'sending' && (
                      <ActivityIndicator size="small" color={theme.colors.white} style={{ marginLeft: wp(1), opacity: 0.6 }} />
                    )}
                    {status === 'sent' && (
                      <Ionicons name="checkmark" size={hp(1.4)} color={theme.colors.white} style={{ marginLeft: wp(1), opacity: 0.6 }} />
                    )}
                    {status === 'delivered' && (
                      <Ionicons name="checkmark-done" size={hp(1.4)} color={theme.colors.white} style={{ marginLeft: wp(1), opacity: 0.6 }} />
                    )}
                    {status === 'read' && (
                      <Ionicons name="checkmark-done" size={hp(1.4)} color={theme.colors.accent} style={{ marginLeft: wp(1) }} />
                    )}
                    {status === 'failed' && (
                      <TouchableOpacity onPress={() => handleSend()}>
                        <Ionicons name="refresh" size={hp(1.4)} color="#FF3B30" style={{ marginLeft: wp(1) }} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
            {reactionCount > 0 && (
              <Pressable
                style={[
                  styles.reactionPill,
                  isMe ? styles.reactionPillMe : styles.reactionPillOther,
                ]}
                onPress={(event) => {
                  event.stopPropagation?.()
                  setReactionModalMessageId(item.id)
                  setShowReactionModal(true)
                }}
              >
                <Ionicons
                  name="heart"
                  size={hp(1.4)}
                  color={isHeartedByMe ? '#FF3040' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.reactionCountText,
                    isHeartedByMe && styles.reactionCountTextActive,
                  ]}
                >
                  {reactionCount}
                </Text>
              </Pressable>
            )}
          </>
        ) : sharedType ? (
          // Shared Content Card (Profile, Post, Event)
          <TouchableOpacity
            style={[
              styles.sharedCard,
              isMe ? styles.sharedCardMe : styles.sharedCardOther,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              if (sharedType === 'profile' && sharedProfileData?.id) {
                setSharedProfile({
                  id: sharedProfileData.id,
                  name: sharedProfileData.name,
                  photoUrl: sharedProfileData.avatar,
                  major: sharedProfileData.major || sharedProfileData.majorLabel,
                  year: sharedProfileData.year,
                  grade: sharedProfileData.grade,
                  quote: sharedProfileData.quote,
                })
                return
              }
              if (sharedType === 'event') {
                const eventId = sharedEventData?.id || sharedEventData?.event_id || sharedEventData?.eventId
                if (eventId) {
                  router.push(`/events/${eventId}`)
                }
                return
              }
              if (sharedType === 'comment') {
                const forumId = sharedCommentData?.forumId || sharedCommentData?.forum_id
                const postId = sharedCommentData?.postId
                router.push({
                  pathname: '/forum',
                  params: {
                    forumId: forumId || 'main',
                    postId: postId || undefined,
                    commentId: sharedCommentData?.id || sharedCommentData?.commentId,
                  },
                })
                return
              }
              if (sharedType === 'post') {
                if (sharedPost?.id && sharedPost?.forumId) {
                  router.push({
                    pathname: '/forum',
                    params: {
                      forumId: sharedPost.forumId,
                      postId: sharedPost.id,
                    },
                  })
                } else {
                  router.push({
                    pathname: '/forum',
                    params: {
                      forumId: sharedPost?.forumId || 'main',
                    },
                  })
                }
              }
            }}
          >
            <View style={styles.sharedCardHeader}>
              <Ionicons 
                name={
                  sharedType === 'profile'
                    ? 'person'
                    : sharedType === 'event'
                      ? 'calendar'
                      : 'chatbubble'
                }
                size={hp(2.1)} 
                color={theme.colors.bondedPurple} 
              />
              <View style={styles.sharedCardLabelPill}>
                <Text style={styles.sharedCardLabel}>
                  {sharedType === 'profile'
                    ? 'Profile'
                    : sharedType === 'event'
                      ? 'Event'
                      : sharedType === 'comment'
                        ? 'Comment'
                        : 'Forum Post'}
                </Text>
              </View>
            </View>

            {sharedType === 'profile' && (
              <View>
                <View style={styles.sharedProfileAvatarRow}>
                  {sharedProfileData?.avatar ? (
                    <Image source={{ uri: sharedProfileData.avatar }} style={styles.sharedProfileAvatar} />
                  ) : (
                    <View style={styles.sharedProfileAvatarPlaceholder}>
                      <Ionicons name="person" size={hp(2)} color={theme.colors.textSecondary} />
                    </View>
                  )}
                </View>
                <Text style={styles.sharedCardTitle} numberOfLines={2}>
                  {sharedProfileData?.name || 'Profile'}
                </Text>
                <Text style={styles.sharedCardSubtitle} numberOfLines={3}>
                  {[
                    sharedProfileData?.majorLabel || sharedProfileData?.major || 'Student',
                    sharedProfileData?.year ? `Class of ${sharedProfileData.year}` : sharedProfileData?.yearLabel || null,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              </View>
            )}

            {sharedType === 'event' && (
              <View>
                {sharedEventData?.image_url || sharedEventData?.imageUrl || sharedEventData?.coverImage ? (
                  <Image
                    source={{ uri: sharedEventData.image_url || sharedEventData.imageUrl || sharedEventData.coverImage }}
                    style={styles.sharedEventCover}
                  />
                ) : (
                  <View style={styles.sharedEventCoverPlaceholder}>
                    <Ionicons name="calendar" size={hp(2.4)} color={theme.colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.sharedCardTitle} numberOfLines={2}>
                  {sharedEventData?.title || 'Event'}
                </Text>
                <Text style={styles.sharedCardSubtitle} numberOfLines={3}>
                  {[
                    sharedEventData?.location_name ||
                      sharedEventData?.location_address ||
                      sharedEventData?.location ||
                      'Event',
                    sharedEventData?.start_at
                      ? new Date(sharedEventData.start_at).toLocaleDateString()
                      : sharedEventData?.dateLabel || null,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              </View>
            )}

            {sharedType === 'post' && (
              <>
                {sharedPost?.title && (
                  <Text style={styles.sharedCardTitle} numberOfLines={2}>
                    {sharedPost.title}
                  </Text>
                )}
                {sharedPost?.body && (
                  <Text style={styles.sharedCardSubtitle} numberOfLines={4}>
                    {sharedPost.body}
                  </Text>
                )}
              </>
            )}
            {sharedType === 'comment' && (
              <>
                <Text style={styles.sharedCardTitle} numberOfLines={2}>
                  {sharedCommentData?.postTitle || 'Comment'}
                </Text>
                <Text style={styles.sharedCardSubtitle} numberOfLines={4}>
                  {sharedCommentData?.body || sharedCommentData?.commentBody || ''}
                </Text>
              </>
            )}

            <View style={styles.sharedCardFooter}>
              <Text style={styles.sharedCardTime}>{item.timestamp}</Text>
              {isMe && (
                <View style={styles.messageStatusContainer}>
                  {status === 'sending' && (
                    <ActivityIndicator size="small" color={theme.colors.textSecondary} style={{ marginLeft: wp(1), opacity: 0.6 }} />
                  )}
                  {status === 'sent' && (
                    <Ionicons name="checkmark" size={hp(1.4)} color={theme.colors.textSecondary} style={{ marginLeft: wp(1), opacity: 0.6 }} />
                  )}
                  {status === 'delivered' && (
                    <Ionicons name="checkmark-done" size={hp(1.4)} color={theme.colors.textSecondary} style={{ marginLeft: wp(1), opacity: 0.6 }} />
                  )}
                  {status === 'read' && (
                    <Ionicons name="checkmark-done" size={hp(1.4)} color={theme.colors.accent} style={{ marginLeft: wp(1) }} />
                  )}
                  {status === 'failed' && (
                    <TouchableOpacity onPress={() => handleSend()}>
                      <Ionicons name="refresh" size={hp(1.4)} color="#FF3B30" style={{ marginLeft: wp(1) }} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <>
            <View
              style={[
                styles.messageBubble,
                isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isMe ? styles.messageTextMe : styles.messageTextOther,
                ]}
              >
                {item.text}
              </Text>
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.messageTime,
                    isMe ? styles.messageTimeMe : styles.messageTimeOther,
                  ]}
                >
                  {item.timestamp}
                </Text>
                {/* Instagram-style message status indicators */}
                {isMe && (
                  <View style={styles.messageStatusContainer}>
                    {status === 'sending' && (
                      <ActivityIndicator size="small" color={theme.colors.white} style={{ marginLeft: wp(1), opacity: 0.6 }} />
                    )}
                    {status === 'sent' && (
                      <Ionicons name="checkmark" size={hp(1.4)} color={theme.colors.white} style={{ marginLeft: wp(1), opacity: 0.6 }} />
                    )}
                    {status === 'delivered' && (
                      <Ionicons name="checkmark-done" size={hp(1.4)} color={theme.colors.white} style={{ marginLeft: wp(1), opacity: 0.6 }} />
                    )}
                    {status === 'read' && (
                      <Ionicons name="checkmark-done" size={hp(1.4)} color={theme.colors.accent} style={{ marginLeft: wp(1) }} />
                    )}
                    {status === 'failed' && (
                      <TouchableOpacity onPress={() => handleSend()}>
                        <Ionicons name="refresh" size={hp(1.4)} color="#FF3B30" style={{ marginLeft: wp(1) }} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
            {reactionCount > 0 && (
              <Pressable
                style={[
                  styles.reactionPill,
                  isMe ? styles.reactionPillMe : styles.reactionPillOther,
                ]}
                onPress={(event) => {
                  event.stopPropagation?.()
                  setReactionModalMessageId(item.id)
                  setShowReactionModal(true)
                }}
              >
                <Ionicons
                  name="heart"
                  size={hp(1.4)}
                  color={isHeartedByMe ? '#FF3040' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.reactionCountText,
                    isHeartedByMe && styles.reactionCountTextActive,
                  ]}
                >
                  {reactionCount}
                </Text>
              </Pressable>
            )}
          </>
        )

    return (
      <Pressable
        style={[
          styles.messageContainer,
          isMe ? styles.messageContainerMe : styles.messageContainerOther,
          status === 'sending' && styles.messagePending,
        ]}
        onPress={() => handleMessagePress(item)}
        onLongPress={() => handleMessageLongPress(item)}
        delayLongPress={600} // Increased to avoid conflict with double tap
      >
        {showGroupHeader ? (
          <View style={styles.groupMessageRow}>
            <TouchableOpacity
              style={styles.groupAvatarButton}
              activeOpacity={0.7}
              onPress={() => {
                if (senderProfile) {
                  setActiveGroupProfile(senderProfile)
                }
              }}
            >
              {senderProfile?.avatar_url ? (
                <Image source={{ uri: senderProfile.avatar_url }} style={styles.groupAvatar} />
              ) : (
                <View style={styles.groupAvatarPlaceholder}>
                  <Text style={styles.groupAvatarInitial}>
                    {(senderName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.groupMessageContent}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (senderProfile) {
                    setActiveGroupProfile(senderProfile)
                  }
                }}
              >
                <Text style={styles.groupSenderName}>{senderName}</Text>
              </TouchableOpacity>
              {messageContent}
            </View>
          </View>
        ) : (
          messageContent
        )}
      </Pressable>
    )
  }


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="auto">
        {/* Chat Header - Industry Standard (iMessage/WhatsApp style) */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={hp(2.5)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          
          {/* Clickable Profile Section */}
          <TouchableOpacity
            style={styles.chatHeaderContent}
            activeOpacity={0.7}
            onPress={() => {
              console.log('Profile header clicked, recipientProfile:', recipientProfile)
              if (!isGroupChat && recipientProfile) {
                console.log('Opening profile modal')
                setShowProfileModal(true)
              } else {
                console.log('No recipient profile available')
              }
            }}
          >
            {/* Avatar */}
            {isGroupChat ? (
              <TouchableOpacity
                style={styles.groupHeaderAvatar}
                activeOpacity={0.7}
                onPress={() => setShowGroupInfo(true)}
              >
                <Ionicons name="people" size={hp(2.2)} color={theme.colors.bondedPurple} />
              </TouchableOpacity>
            ) : recipientProfile?.avatar_url ? (
              <Image
                source={{ uri: recipientProfile.avatar_url }}
                style={styles.headerAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Ionicons name="person" size={hp(2.5)} color={theme.colors.textSecondary} />
              </View>
            )}
            
            {/* Name and Status */}
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                {isGroupChat ? (forumName || 'Group chat') : (recipientProfile?.full_name || recipientProfile?.username || userName)}
              </Text>
              {!isGroupChat && (
                <Text style={styles.chatHeaderSubtitle} numberOfLines={1}>
                  {isOtherTyping ? 'typing...' : 'online'}
                </Text>
              )}
              {isGroupChat && (
                <Text style={styles.chatHeaderSubtitle} numberOfLines={1}>
                  Group chat from {forumName}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          
          {/* Right side actions */}
          {isGroupChat && (
            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.7}
              onPress={() => setShowGroupInfo(true)}
            >
              <Ionicons name="information-circle-outline" size={hp(2.4)} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={() => setShowSearch((prev) => !prev)}
          >
            <Ionicons name="search" size={hp(2.3)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          {isFeatureEnabled('LINK_AI') && (
            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.7}
              onPress={() => setShowLinkAI(!showLinkAI)}
            >
              <Ionicons 
                name={showLinkAI ? "sparkles" : "sparkles-outline"} 
                size={hp(2.5)} 
                color={showLinkAI ? theme.colors.accent : theme.colors.textPrimary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {showSearch && (
          <View style={styles.chatSearchContainer}>
            <Ionicons name="search-outline" size={hp(2)} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.chatSearchInput}
              placeholder="Search in conversation"
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={hp(2)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Link AI Suggestions */}
        {showLinkAI && linkAISuggestions.length > 0 && (
          <View style={styles.linkAIContainer}>
            <View style={styles.linkAIHeader}>
              <Ionicons name="sparkles" size={hp(1.8)} color={theme.colors.accent} />
              <Text style={styles.linkAITitle}>Link AI Suggestions</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
              {linkAISuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setInputText(suggestion)
                    setShowLinkAI(false)
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {conversationQuality && (
              <Text style={styles.qualityText}>{conversationQuality.feedback}</Text>
            )}
          </View>
        )}

        {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={
              showSearch && searchQuery.trim()
                ? messages.filter((msg) =>
                    (msg.text || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
                  )
                : messages
            }
            keyExtractor={(item, index) => {
            // Ensure unique keys - use index as fallback for duplicates
            if (!item.id) {
              console.warn('⚠️ Message without ID at index:', index, item)
              return `msg-${index}-${Date.now()}`
            }
            return item.id
          }}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
              </View>
            ) : (
              conversationId ? (
                <View style={styles.emptyMessagesContainer}>
                  <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
                  <Text style={styles.emptyMessagesSubtitle}>Send the first message to start the chat.</Text>
                </View>
              ) : null
            )
          }
        />

        {/* Typing Indicator with animated dots */}
        {isOtherTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingHeader}>
                {typingUserAvatar ? (
                  <Image source={{ uri: typingUserAvatar }} style={styles.typingAvatar} resizeMode="cover" />
                ) : (
                  <View style={styles.typingAvatarPlaceholder}>
                    <Ionicons name="person" size={hp(1.5)} color={theme.colors.textSecondary} />
                  </View>
                )}
                {typingUserName && (
                  <Text style={styles.typingUserName}>{typingUserName} is typing</Text>
                )}
              </View>
              <View style={styles.typingDots}>
                <Animated.View 
                  style={[
                    styles.typingDot, 
                    { 
                      opacity: dot1Anim,
                      transform: [{
                        scale: dot1Anim.interpolate({
                          inputRange: [0.4, 1],
                          outputRange: [1, 1.2],
                        })
                      }]
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.typingDot, 
                    { 
                      opacity: dot2Anim,
                      transform: [{
                        scale: dot2Anim.interpolate({
                          inputRange: [0.4, 1],
                          outputRange: [1, 1.2],
                        })
                      }]
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.typingDot, 
                    { 
                      opacity: dot3Anim,
                      transform: [{
                        scale: dot3Anim.interpolate({
                          inputRange: [0.4, 1],
                          outputRange: [1, 1.2],
                        })
                      }]
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? hp(2) : 0}
        >
          {/* Image Preview (inside input area, Instagram-style) */}
          {selectedImage && (
            <View style={styles.inlineImagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.inlineImagePreviewImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.inlineRemoveImageButton}
                onPress={removeSelectedImage}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={hp(2.5)} color={theme.colors.error || '#FF3B30'} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              activeOpacity={0.7}
              onPress={pickImage}
            >
              <Ionicons name="image-outline" size={hp(2.8)} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={selectedImage ? "Add a caption..." : "Message"}
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={handleTextChange}
              multiline
              maxLength={500}
            />
            {(isSending || uploadingImage) ? (
              <ActivityIndicator size="small" color={theme.colors.accent} style={styles.sendButton} />
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  (!inputText.trim() && !selectedImage) && styles.sendButtonDisabled
                ]}
                activeOpacity={0.7}
                onPress={selectedImage ? sendImage : handleSend}
                disabled={!inputText.trim() && !selectedImage}
              >
                <Ionicons
                  name="send"
                  size={hp(2.5)}
                  color={(inputText.trim() || selectedImage) ? theme.colors.white : theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Profile Modal - Industry Standard (iMessage/WhatsApp style) */}
        {recipientProfile && (
        <Modal
            visible={showProfileModal}
          transparent
          animationType="slide"
            onRequestClose={() => setShowProfileModal(false)}
          >
            <View style={styles.profileModalOverlay}>
              <Pressable
                style={styles.profileModalBackdrop}
                onPress={() => setShowProfileModal(false)}
              >
                <Pressable
                  style={styles.profileModalContent}
                  onPress={(e) => e.stopPropagation()}
                >
                  <YearbookProfileModalContent
                    activeProfile={{
                      id: recipientProfile.id,
                      name: recipientProfile.full_name || recipientProfile.username || userName,
                      photoUrl: recipientProfile.avatar_url,
                      major: recipientProfile.major,
                      graduationYear: recipientProfile.graduation_year,
                      grade: recipientProfile.grade,
                      bio: recipientProfile.bio,
                    }}
                    setActiveProfile={() => setShowProfileModal(false)}
                    theme={theme}
                    router={router}
                    currentUserInterests={[]}
                    onClose={() => setShowProfileModal(false)}
                  />
                </Pressable>
              </Pressable>
            </View>
          </Modal>
        )}

        {sharedProfile && (
          <Modal
            visible={!!sharedProfile}
            transparent
            animationType="slide"
            onRequestClose={() => setSharedProfile(null)}
          >
            <View style={styles.profileModalOverlay}>
              <Pressable
                style={styles.profileModalBackdrop}
                onPress={() => setSharedProfile(null)}
              >
                <Pressable
                  style={styles.profileModalContent}
                  onPress={(e) => e.stopPropagation()}
                >
                  <YearbookProfileModalContent
                    activeProfile={{
                      id: sharedProfile.id,
                      name: sharedProfile.name,
                      photoUrl: sharedProfile.photoUrl,
                      major: sharedProfile.major,
                      year: sharedProfile.year,
                      grade: sharedProfile.grade,
                      quote: sharedProfile.quote,
                    }}
                    setActiveProfile={() => setSharedProfile(null)}
                    theme={theme}
                    router={router}
                    currentUserInterests={[]}
                    onClose={() => setSharedProfile(null)}
                  />
                </Pressable>
              </Pressable>
            </View>
          </Modal>
        )}

        {activeGroupProfile && (
          <Modal
            visible={!!activeGroupProfile}
            transparent
            animationType="slide"
            onRequestClose={() => setActiveGroupProfile(null)}
          >
            <View style={styles.profileModalOverlay}>
              <Pressable
                style={styles.profileModalBackdrop}
                onPress={() => setActiveGroupProfile(null)}
              >
                <Pressable
                  style={styles.profileModalContent}
                  onPress={(e) => e.stopPropagation()}
                >
                  <YearbookProfileModalContent
                    activeProfile={{
                      id: activeGroupProfile.id,
                      name: activeGroupProfile.full_name || activeGroupProfile.username || 'Member',
                      photoUrl: activeGroupProfile.avatar_url,
                      major: activeGroupProfile.major,
                      graduationYear: activeGroupProfile.graduation_year,
                      grade: activeGroupProfile.grade,
                      bio: activeGroupProfile.bio,
                    }}
                    setActiveProfile={() => setActiveGroupProfile(null)}
                    theme={theme}
                    router={router}
                    currentUserInterests={[]}
                    onClose={() => setActiveGroupProfile(null)}
                  />
                </Pressable>
              </Pressable>
            </View>
          </Modal>
        )}

        {isGroupChat && (
          <Modal
            visible={showGroupInfo}
            transparent
            animationType="slide"
            onRequestClose={() => setShowGroupInfo(false)}
          >
            <View style={styles.groupInfoOverlay}>
              <Pressable
                style={styles.groupInfoBackdrop}
                onPress={() => setShowGroupInfo(false)}
              >
                <Pressable
                  style={styles.groupInfoContent}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.groupInfoHeader}>
                    <Text style={styles.groupInfoTitle}>Group info</Text>
                    <TouchableOpacity
                      style={styles.groupInfoClose}
                      onPress={() => setShowGroupInfo(false)}
                    >
                      <Ionicons name="close" size={hp(2.4)} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.groupNameRow}>
                    {editingGroupName ? (
                      <>
                        <TextInput
                          style={styles.groupNameInput}
                          value={groupNameDraft}
                          onChangeText={setGroupNameDraft}
                          placeholder="Group name"
                          placeholderTextColor={theme.colors.textSecondary}
                        />
                        <TouchableOpacity
                          style={styles.groupNameSave}
                          onPress={async () => {
                            const nextName = groupNameDraft.trim()
                            if (!nextName || !conversationId) {
                              setEditingGroupName(false)
                              return
                            }
                            try {
                              const { error } = await supabase
                                .from('conversations')
                                .update({ name: nextName })
                                .eq('id', conversationId)
                              if (!error) {
                                setEditingGroupName(false)
                              }
                            } catch (error) {
                              console.error('Failed to update group name:', error)
                              setEditingGroupName(false)
                            }
                          }}
                        >
                          <Text style={styles.groupNameSaveText}>Save</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <Text style={styles.groupNameText}>
                          {forumName || 'Group chat'}
                        </Text>
                        <TouchableOpacity
                          style={styles.groupNameEdit}
                          onPress={() => {
                            setGroupNameDraft(forumName || '')
                            setEditingGroupName(true)
                          }}
                        >
                          <Ionicons name="pencil" size={hp(2)} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  <Text style={styles.groupMembersLabel}>
                    {groupMembers.length} members
                  </Text>

                  {isLoadingMembers ? (
                    <View style={styles.groupMembersEmpty}>
                      <Text style={styles.groupMembersEmptyText}>Loading members...</Text>
                    </View>
                  ) : (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.groupMembersList}
                    >
                      {groupMembers.map((member) => (
                        <TouchableOpacity
                          key={member.id}
                          style={styles.groupMemberRow}
                          activeOpacity={0.7}
                          onPress={() => setActiveGroupProfile(member)}
                        >
                          {member.avatar_url ? (
                            <Image source={{ uri: member.avatar_url }} style={styles.groupMemberAvatar} />
                          ) : (
                            <View style={styles.groupMemberAvatarPlaceholder}>
                              <Text style={styles.groupMemberAvatarInitial}>
                                {(member.full_name || member.username || 'U').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={styles.groupMemberInfo}>
                            <Text style={styles.groupMemberName}>
                              {member.full_name || member.username || 'Member'}
                            </Text>
                            <Text style={styles.groupMemberMeta}>
                              {member.major || 'Student'}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={hp(1.8)} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </Pressable>
              </Pressable>
            </View>
          </Modal>
        )}

        {/* Reaction Details Modal */}
        <Modal
          visible={showReactionModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowReactionModal(false)
            setReactionModalMessageId(null)
          }}
        >
          <Pressable
            style={styles.reactionModalOverlay}
            onPress={() => {
              setShowReactionModal(false)
              setReactionModalMessageId(null)
            }}
          >
            <Pressable
              style={styles.reactionModalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.reactionModalHeader}>
                <Text style={styles.reactionModalTitle}>Hearts</Text>
                <TouchableOpacity
                  style={styles.reactionModalClose}
                  onPress={() => {
                    setShowReactionModal(false)
                    setReactionModalMessageId(null)
                  }}
                >
                  <Ionicons name="close" size={hp(2.2)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.reactionModalSubtitle}>
                {sortedReactionModalUserIds.length}{' '}
                {sortedReactionModalUserIds.length === 1 ? 'person' : 'people'} reacted
              </Text>
              <FlatList
                data={sortedReactionModalUserIds}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.reactionListContent}
                renderItem={({ item: userId }) => {
                  const profile = reactionProfiles[userId]
                  return (
                    <View style={styles.reactionUserRow}>
                      {profile?.avatar_url ? (
                        <Image
                          source={{ uri: profile.avatar_url }}
                          style={styles.reactionAvatar}
                        />
                      ) : (
                        <View style={styles.reactionAvatarPlaceholder}>
                          <Ionicons name="person" size={hp(1.8)} color={theme.colors.textSecondary} />
                        </View>
                      )}
                      <Text style={styles.reactionUserName}>
                        {getReactionDisplayName(userId)}
                      </Text>
                    </View>
                  )
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>

        {/* Unsend Message Modal - Instagram Style */}
        <Modal
          visible={showUnsendModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowUnsendModal(false)
            setSelectedMessage(null)
          }}
        >
          <Pressable
            style={styles.unsendModalOverlay}
            onPress={() => {
              setShowUnsendModal(false)
              setSelectedMessage(null)
            }}
          >
            <View style={styles.unsendModalContent}>
              <TouchableOpacity
                style={styles.unsendButton}
                activeOpacity={0.7}
                onPress={handleUnsend}
              >
                <Ionicons name="trash-outline" size={hp(2.5)} color="#FF3B30" />
                <Text style={styles.unsendButtonText}>Unsend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unsendCancelButton}
                activeOpacity={0.7}
                onPress={() => {
                  setShowUnsendModal(false)
                  setSelectedMessage(null)
                }}
              >
                <Text style={styles.unsendCancelText}>Cancel</Text>
              </TouchableOpacity>
          </View>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary, // Light gray background like iMessage
    paddingHorizontal: 0, // Remove horizontal padding - header and messages handle their own
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: hp(0.5),
    marginRight: theme.spacing.sm,
  },
  chatHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  headerAvatar: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  headerAvatarPlaceholder: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  groupHeaderAvatar: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.bondedPurple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  chatHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeaderTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  chatHeaderSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.1),
  },
  groupChatSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    opacity: theme.ui.metaOpacity,
    marginTop: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerIcon: {
    padding: hp(0.5),
  },
  chatSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingHorizontal: theme.spacing.md,
    paddingVertical: hp(1),
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  chatSearchInput: {
    flex: 1,
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  groupInfoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  groupInfoBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  groupInfoContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingTop: hp(1.6),
    paddingHorizontal: wp(4),
    paddingBottom: hp(3),
    maxHeight: '85%',
  },
  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  groupInfoTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  groupInfoClose: {
    padding: hp(0.5),
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(1.5),
  },
  groupNameText: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  groupNameEdit: {
    padding: hp(0.5),
  },
  groupNameInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  groupNameSave: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bondedPurple,
  },
  groupNameSaveText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  groupMembersLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: hp(1),
  },
  groupMembersList: {
    paddingBottom: hp(2),
  },
  groupMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border || 'rgba(0,0,0,0.08)',
  },
  groupMemberAvatar: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    marginRight: wp(3),
  },
  groupMemberAvatarPlaceholder: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.bondedPurple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  groupMemberAvatarInitial: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.bondedPurple,
  },
  groupMemberInfo: {
    flex: 1,
  },
  groupMemberName: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  groupMemberMeta: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginTop: hp(0.2),
  },
  groupMembersEmpty: {
    paddingVertical: hp(3),
    alignItems: 'center',
  },
  groupMembersEmptyText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  profileModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  profileModalContent: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? hp(5) : hp(2),
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  reactionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reactionModalCard: {
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: hp(60),
  },
  reactionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reactionModalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  reactionModalClose: {
    padding: hp(0.5),
  },
  reactionModalSubtitle: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  reactionListContent: {
    paddingBottom: theme.spacing.lg,
  },
  reactionUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border || 'rgba(0,0,0,0.08)',
  },
  reactionAvatar: {
    width: hp(3.8),
    height: hp(3.8),
    borderRadius: hp(1.9),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  reactionAvatarPlaceholder: {
    width: hp(3.8),
    height: hp(3.8),
    borderRadius: hp(1.9),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionUserName: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  linkAIContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.accent + '30',
  },
  linkAIHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  linkAITitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  suggestionsScroll: {
    marginBottom: theme.spacing.xs,
  },
  suggestionChip: {
    backgroundColor: theme.colors.accent + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.accent + '40',
  },
  suggestionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontFamily.body,
  },
  qualityText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    minHeight: hp(50),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Transparent so it doesn't block
  },
  emptyMessagesContainer: {
    flex: 1,
    minHeight: hp(45),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyMessagesTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  emptyMessagesSubtitle: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  messagesList: {
    paddingVertical: hp(1),
    paddingBottom: hp(2),
    paddingLeft: theme.spacing.sm, // Small padding on left
    paddingRight: 0, // No padding on right for sent messages
  },
  messageContainer: {
    marginVertical: hp(0.3),
    maxWidth: wp(95), // Use almost all available space
    paddingLeft: 0,
    paddingRight: 0, // No padding on right
  },
  messageContainerMe: {
    alignItems: 'flex-end',
    paddingRight: 0, // No padding on right - push to edge
    paddingLeft: wp(5), // Minimal left padding to push all the way right
    marginRight: 0, // No margin on right
  },
  messageContainerOther: {
    alignItems: 'flex-start',
    paddingLeft: wp(2),
    paddingRight: theme.spacing.xs,
  },
  messagePending: {
    opacity: 0.7,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: wp(0.5),
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: hp(0.4),
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
    gap: wp(1),
  },
  reactionPillMe: {
    alignSelf: 'flex-end',
    borderColor: theme.colors.bondedPurple + '55',
  },
  reactionPillOther: {
    alignSelf: 'flex-start',
  },
  reactionCountText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  reactionCountTextActive: {
    color: '#FF3040',
    fontWeight: theme.typography.weights.semibold,
  },
  messageStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.6),
    gap: wp(1.5),
  },
  groupAvatarButton: {
    width: hp(3.4),
    height: hp(3.4),
    borderRadius: hp(1.7),
  },
  groupAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: hp(1.7),
  },
  groupAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: hp(1.7),
    backgroundColor: theme.colors.bondedPurple + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarInitial: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.bondedPurple,
  },
  groupSenderName: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  groupMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2),
  },
  groupMessageContent: {
    flex: 1,
  },
  messageBubble: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xl,
    maxWidth: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubbleMe: {
    backgroundColor: theme.colors.bondedPurple,
    borderBottomRightRadius: theme.radius.sm,
  },
  messageBubbleOther: {
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  messageText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.4),
    marginBottom: theme.spacing.xs,
  },
  messageTextMe: {
    color: theme.colors.white,
  },
  messageTextOther: {
    color: theme.colors.textPrimary,
  },
  messageTime: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fontFamily.body,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: theme.colors.white,
    opacity: 0.8,
  },
  messageTimeOther: {
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
  // Shared Content Card Styles
  sharedCard: {
    maxWidth: '94%',
    borderRadius: theme.radius.lg,
    padding: wp(3.4),
    marginVertical: hp(0.5),
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sharedCardMe: {
    alignSelf: 'flex-end',
    borderColor: theme.colors.bondedPurple,
  },
  sharedCardOther: {
    alignSelf: 'flex-start',
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  sharedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(0.7),
  },
  sharedCardLabelPill: {
    backgroundColor: theme.colors.bondedPurple + '15',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.full,
  },
  sharedCardLabel: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.bondedPurple,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sharedCardTitle: {
    fontSize: hp(1.85),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: hp(2.4),
  },
  sharedCardSubtitle: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.2),
    color: theme.colors.textSecondary,
  },
  sharedProfileAvatarRow: {
    alignItems: 'flex-start',
    marginBottom: hp(0.6),
  },
  sharedProfileAvatar: {
    width: hp(5.2),
    height: hp(5.2),
    borderRadius: hp(2.75),
    backgroundColor: theme.colors.background,
  },
  sharedProfileAvatarPlaceholder: {
    width: hp(5.2),
    height: hp(5.2),
    borderRadius: hp(2.75),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  sharedEventCover: {
    width: '100%',
    height: hp(12),
    borderRadius: theme.radius.md,
    marginBottom: hp(0.7),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  sharedEventCoverPlaceholder: {
    width: '100%',
    height: hp(12),
    borderRadius: theme.radius.md,
    marginBottom: hp(0.7),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  sharedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(0.8),
  },
  sharedCardTime: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  // Typing indicator styles
  typingContainer: {
    paddingHorizontal: wp(2),
    paddingBottom: hp(1),
  },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    borderBottomLeftRadius: theme.radius.sm,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: hp(0.5),
  },
  typingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  typingAvatar: {
    width: hp(2),
    height: hp(2),
    borderRadius: hp(1),
    backgroundColor: theme.colors.backgroundSecondary,
  },
  typingAvatarPlaceholder: {
    width: hp(2),
    height: hp(2),
    borderRadius: hp(1),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingUserName: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  typingDot: {
    width: hp(0.8),
    height: hp(0.8),
    borderRadius: hp(0.4),
    backgroundColor: theme.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border || 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  attachButton: {
    padding: hp(0.5),
    marginRight: wp(2),
  },
  input: {
    flex: 1,
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    maxHeight: hp(10),
    paddingVertical: hp(0.8),
  },
  sendButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(2),
  },
  sendButtonDisabled: {
    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  // Image message styles
  imageMessageBubble: {
    maxWidth: wp(75),
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  imageMessageBubbleMe: {
    backgroundColor: theme.colors.bondedPurple,
    borderBottomRightRadius: theme.radius.sm,
  },
  imageMessageBubbleOther: {
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.radius.sm,
  },
  messageImage: {
    width: '100%',
    height: hp(30),
    borderRadius: theme.radius.lg,
  },
  imagePlaceholder: {
    width: wp(75),
    height: hp(30),
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  imageMessageText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  imageMessageTextMe: {
    color: theme.colors.white,
  },
  imageMessageTextOther: {
    color: theme.colors.textPrimary,
  },
  // Inline image preview styles (Instagram-style, inside input area)
  inlineImagePreview: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  inlineImagePreviewImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  inlineRemoveImageButton: {
    position: 'absolute',
    top: -hp(0.8),
    right: -hp(0.8),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unsendModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unsendModalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    minWidth: wp(60),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  unsendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  unsendButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: '#FF3B30',
    fontFamily: theme.typography.fontFamily.body,
  },
  unsendCancelButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border || 'rgba(0,0,0,0.1)',
  },
  unsendCancelText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.body,
  },
})
