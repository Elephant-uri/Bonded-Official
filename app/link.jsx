/**
 * Link AI Chat Screen
 * Dedicated chat interface for talking with Link
 */

import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Text from '../components/ui/Text'
import { hp, wp } from '../helpers/common'
import { useLinkConversation, useLinkMessages, useSendLinkMessage, useLinkSystemProfile } from '../hooks/useLinkChat'
import { queryLink, learnUserStyle } from '../services/linkService'
import { useAuthStore } from '../stores/authStore'
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile'
import { useAppTheme } from './theme'
import { supabase } from '../lib/supabase'
import RichMessagePreview from '../components/Message/RichMessagePreview'

const LINK_LOGO = require('../assets/images/transparent-bonded.png')

export default function LinkChat() {
  const router = useRouter()
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const { user } = useAuthStore()
  const { data: currentUserProfile } = useCurrentUserProfile()
  const { data: linkProfile, isLoading: linkProfileLoading } = useLinkSystemProfile()
  const { data: conversation, isLoading: conversationLoading } = useLinkConversation()
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const { data: messagesData, isLoading: messagesLoading, fetchNextPage, hasNextPage } = useLinkMessages(conversation?.id, currentSessionId)
  const sendMessage = useSendLinkMessage()

  const [inputText, setInputText] = useState('')
  const [isLinkTyping, setIsLinkTyping] = useState(false)
  const [localMessages, setLocalMessages] = useState([])
  const [linkMemory, setLinkMemory] = useState(null)
  const [isAwaitingPreferredName, setIsAwaitingPreferredName] = useState(false)
  const [introInjected, setIntroInjected] = useState(false)
  const flatListRef = useRef(null)

  // Flatten messages from infinite query
  const messages = useMemo(() => {
    if (!messagesData?.pages) return []
    return messagesData.pages.flatMap(page => page.messages || [])
  }, [messagesData])

  const mergedMessages = useMemo(() => {
    const combined = [...messages, ...localMessages]
      .filter((message) => !currentSessionId || message?.session_id === currentSessionId)
      .sort((a, b) => {
      const aTime = new Date(a.created_at || a.timestamp || 0).getTime()
      const bTime = new Date(b.created_at || b.timestamp || 0).getTime()
      return aTime - bTime
    })
    const seen = new Set()
    return combined.filter((message) => {
      const id = message?.id
      if (!id) return true
      if (seen.has(id)) return false
      seen.add(id)
      return true
    }).filter((message, index, arr) => {
      if (!message?.id?.startsWith('local-link-')) return true
      const content = (message.content || '').trim()
      if (!content) return true
      const matching = arr.find((other) =>
        other.sender_type === 'link'
        && !other.id?.startsWith('local-link-')
        && (other.content || '').trim() === content
      )
      return !matching
    })
  }, [messages, localMessages, currentSessionId])

  const coerceMessageText = useCallback((content) => {
    if (content == null) return ''
    if (typeof content === 'string' || typeof content === 'number') return String(content)
    if (typeof content === 'object') {
      if (typeof content.message === 'string') return content.message
      if (typeof content.response === 'string') return content.response
      if (typeof content.text === 'string') return content.text
      try {
        return JSON.stringify(content)
      } catch (error) {
        return ''
      }
    }
    return String(content)
  }, [])

  const normalizeMetadata = useCallback((metadata) => {
    if (!metadata) return {}
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata)
      } catch (error) {
        return {}
      }
    }
    if (Array.isArray(metadata)) return { items: metadata }
    if (typeof metadata === 'object') return metadata
    return {}
  }, [])

  const getFirstName = useCallback((fullName, email) => {
    const normalized = (fullName || '').trim()
    if (normalized) {
      return normalized.split(/\s+/)[0]
    }
    if (email && email.includes('@')) {
      return email.split('@')[0]
    }
    return 'there'
  }, [])

  const inferCardType = useCallback((item, typeHint) => {
    const normalizedHint = (typeHint || '').toLowerCase()
    if (['people', 'person', 'profile', 'profiles', 'users', 'user'].includes(normalizedHint)) return 'profile'
    if (['event', 'events'].includes(normalizedHint)) return 'event'
    if (['org', 'orgs', 'organization', 'organizations', 'club', 'clubs'].includes(normalizedHint)) return 'org'
    if (['post', 'posts'].includes(normalizedHint)) return 'post'

    const itemType = (item?.type || '').toLowerCase()
    if (['profile', 'person', 'user'].includes(itemType)) return 'profile'
    if (['event'].includes(itemType)) return 'event'
    if (['organization', 'org', 'club'].includes(itemType)) return 'org'
    if (['post'].includes(itemType)) return 'post'

    if (item?.user_id || item?.profile_id || item?.username || item?.full_name) return 'profile'
    if (item?.event_id || item?.start_at || item?.end_at) return 'event'
    if (item?.org_id || item?.organization_id || item?.logo_url) return 'org'
    if (item?.post_id || item?.forum_id || item?.upvotes_count || item?.comments_count) return 'post'

    return null
  }, [])

  const normalizeLinkResponse = useCallback((response) => {
    if (!response) return { text: '', cards: [] }
    const text = coerceMessageText(response.response || response.message || response.text || '')
    const data = response.data || response.payload
    const typeHint = response.type || data?.type || response.shareType
    const results = data?.results || data?.items || []
    const allowCards = Array.isArray(results) && results.length > 0 && response.need_outreach === false
    const cards = Array.isArray(results)
      && allowCards
      ? results.map((item) => {
        const cardType = inferCardType(item, typeHint)
        if (!cardType) return null

        if (cardType === 'event') {
          return {
            message_type: 'event',
            metadata: {
              event_id: item.event_id || item.id,
              title: item.title || item.name,
              start_at: item.start_at || item.start_time || item.starts_at,
              location_name: item.location_name || item.location || item.venue,
              image_url: item.image_url || item.cover_url || item.image,
              attendee_count: item.attendee_count || item.going_count || item.rsvp_count,
            },
            fallbackText: item.title || 'Event',
          }
        }

        if (cardType === 'post') {
          return {
            message_type: 'post',
            metadata: {
              post_id: item.post_id || item.id,
              forum_id: item.forum_id,
              title: item.title,
              body: item.body || item.content,
              image_url: item.image_url || item.media_url,
              forum_name: item.forum_name,
              comments_count: item.comments_count,
              upvotes_count: item.upvotes_count,
            },
            fallbackText: item.title || 'Post',
          }
        }

        if (cardType === 'profile') {
          return {
            message_type: 'profile',
            metadata: {
              user_id: item.user_id || item.id,
              full_name: item.full_name || item.name,
              username: item.username,
              avatar_url: item.avatar_url || item.avatar,
              major: item.major,
              graduation_year: item.graduation_year || item.year,
              mutual_friends: item.mutual_friends,
            },
            fallbackText: item.full_name || item.name || 'Profile',
          }
        }

        if (cardType === 'org') {
          return {
            message_type: 'org',
            metadata: {
              org_id: item.org_id || item.id,
              name: item.name,
              category: item.category,
              logo_url: item.logo_url || item.image_url || item.image,
              member_count: item.member_count || item.members,
            },
            fallbackText: item.name || 'Organization',
          }
        }

        return null
      }).filter(Boolean)
      : []

    return { text, cards }
  }, [coerceMessageText, inferCardType])

  const extractPreferredName = useCallback((text, allowShortReply) => {
    if (!text) return null
    const trimmed = text.trim()
    const patterns = [
      /(?:call me|you can call me|please call me|i go by)\s+([A-Za-z][A-Za-z'’\\-]{1,30})/i,
      /(?:my name is|it's|it is|im|i'm)\s+([A-Za-z][A-Za-z'’\\-]{1,30})/i,
    ]
    for (const pattern of patterns) {
      const match = trimmed.match(pattern)
      if (match?.[1]) {
        return match[1]
      }
    }
    if (allowShortReply && trimmed.length <= 30 && !trimmed.includes('?')) {
      const parts = trimmed.split(/\s+/)
      if (parts.length <= 2) {
        return parts[0]
      }
    }
    return null
  }, [])

  const upsertLinkMemory = useCallback(async (updates) => {
    if (!user?.id) return null
    const knownPreferences = {
      ...(linkMemory?.known_preferences || {}),
      ...(updates?.known_preferences || {}),
    }
    const payload = {
      user_id: user.id,
      university_id: currentUserProfile?.university_id || null,
      ...updates,
      known_preferences: knownPreferences,
      last_interaction_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('link_user_memory')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle()

    if (error) {
      console.warn('Failed to update Link memory:', error)
      return null
    }

    setLinkMemory(data)
    return data
  }, [user?.id, linkMemory, currentUserProfile?.university_id])

  const insertLinkMessage = useCallback(async (content, options = {}) => {
    if (!conversation?.id) return null
    const normalizedContent = coerceMessageText(content)
    const metadata = {
      ...normalizeMetadata(options.metadata),
      ...(options.messageType ? { shareType: options.messageType } : {}),
    }

    const localMessage = {
      id: `local-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversation_id: conversation.id,
      sender_type: 'link',
      sender_id: linkProfile?.link_user_id || null,
      content: normalizedContent,
      metadata,
      session_id: currentSessionId || null,
      created_at: new Date().toISOString(),
    }

    setLocalMessages(prev => ([...prev, localMessage]))
    return localMessage
  }, [conversation?.id, linkProfile?.link_user_id, coerceMessageText, normalizeMetadata, currentSessionId])

  const preferredName = useMemo(() => {
    return linkMemory?.known_preferences?.preferred_name || null
  }, [linkMemory])

  const firstName = useMemo(() => {
    const baseName = preferredName
      || currentUserProfile?.full_name
      || user?.user_metadata?.full_name
      || user?.email
    return getFirstName(baseName, user?.email)
  }, [preferredName, currentUserProfile?.full_name, user?.user_metadata?.full_name, user?.email, getFirstName])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  useEffect(() => {
    if (!user?.id) return
    let isMounted = true

    const loadMemory = async () => {
      const { data, error } = await supabase
        .from('link_user_memory')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!isMounted) return
      if (error) {
        console.warn('Failed to load Link memory:', error)
        return
      }

      setLinkMemory(data)
    }

    loadMemory()
    return () => { isMounted = false }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    let isMounted = true

    const getOrCreateSession = async () => {
      const { data: existing, error } = await supabase
        .from('link_user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!isMounted) return
      if (error) {
        console.warn('Failed to load Link session:', error)
        return
      }

      if (existing?.id) {
        setCurrentSessionId(existing.id)
        return
      }

      const { data: created, error: createError } = await supabase
        .from('link_user_sessions')
        .insert({
          user_id: user.id,
          university_id: currentUserProfile?.university_id || null,
          status: 'active',
          last_active_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (!isMounted) return
      if (createError) {
        console.warn('Failed to create Link session:', createError)
        return
      }
      setCurrentSessionId(created?.id || null)
    }

    getOrCreateSession()
    return () => { isMounted = false }
  }, [user?.id, currentUserProfile?.university_id])

  useEffect(() => {
    if (introInjected) return
    if (!conversation?.id || !linkProfile || messagesLoading) return
    if ((messages?.length || 0) > 0 || localMessages.length > 0) return
    if (preferredName) return

    setIntroInjected(true)
    setIsAwaitingPreferredName(true)

    const introMessage = `hey ${firstName}! i'm link - think of me like a friend you can text anytime. btw, what should i call you?`
    insertLinkMessage(introMessage, { type: 'intro' })
  }, [
    introInjected,
    conversation?.id,
    linkProfile,
    messagesLoading,
    messages?.length,
    localMessages.length,
    preferredName,
    firstName,
    insertLinkMessage,
  ])

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !conversation?.id) return

    const messageContent = inputText.trim()
    setInputText('')

    try {
      const extractedName = extractPreferredName(messageContent, isAwaitingPreferredName)

      if (extractedName) {
        await upsertLinkMemory({
          known_preferences: {
            preferred_name: extractedName,
            preferred_name_updated_at: new Date().toISOString(),
          },
        })
        setIsAwaitingPreferredName(false)
        insertLinkMessage(`got it — i’ll call you ${extractedName}.`, { type: 'preferred_name' })
      }

      // Send user message to database
      await sendMessage.mutateAsync({
        conversationId: conversation.id,
        content: messageContent,
      })

      // Learn user's style (non-blocking)
      learnUserStyle(user.id, messageContent).catch(() => {})

      // Show typing indicator
      setIsLinkTyping(true)

      // Query Link backend for response
      const linkResponse = await queryLink(
        user.id,
        messageContent,
        currentUserProfile?.university_id,
        {
          preferred_name: extractedName || preferredName || firstName,
          session_id: currentSessionId,
        }
      )

      setIsLinkTyping(false)

      // If Link has a response, it will be inserted via the backend
      // The real-time subscription will pick it up
      // For now, we can show the response directly if needed

      if (linkResponse) {
        if (linkResponse.session_id && linkResponse.session_id !== currentSessionId) {
          setCurrentSessionId(linkResponse.session_id)
        }
        const normalized = normalizeLinkResponse(linkResponse)
        if (normalized.text) {
          await insertLinkMessage(normalized.text)
        }
        if (normalized.cards.length > 0) {
          for (const card of normalized.cards) {
            await insertLinkMessage(card.fallbackText || '', {
              messageType: card.message_type,
              metadata: card.metadata,
            })
          }
        }
      }

      // Journal the user's message (best-effort)
      supabase
        .from('link_journal_entries')
        .insert({
          user_id: user.id,
          university_id: currentUserProfile?.university_id || null,
          entry_type: 'note',
          title: 'Chat with Link',
          content: messageContent,
        })
        .then(() => {})
        .catch(() => {})

      // Update memory interaction stats (best-effort)
      upsertLinkMemory({
        total_interactions: (linkMemory?.total_interactions || 0) + 1,
      })

    } catch (error) {
      console.error('Error sending message to Link:', error)
      setIsLinkTyping(false)
    }
  }, [
    inputText,
    conversation?.id,
    user?.id,
    currentUserProfile?.university_id,
    sendMessage,
    extractPreferredName,
    isAwaitingPreferredName,
    upsertLinkMemory,
    insertLinkMessage,
    preferredName,
    firstName,
    coerceMessageText,
    normalizeLinkResponse,
    linkMemory?.total_interactions,
    currentSessionId,
  ])

  const renderMessage = useCallback(({ item }) => {
    const isUser = item.sender_type === 'user'
    const metadata = normalizeMetadata(item.metadata)
    const previewMessage = {
      ...item,
      metadata,
      sender: item.sender_type === 'link' ? { username: 'Link' } : item.sender,
    }

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.linkMessage]}>
        {!isUser && (
          <View style={styles.linkAvatar}>
            <Image source={LINK_LOGO} style={styles.linkLogoSmall} contentFit="contain" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.linkBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.linkText]}>
            {coerceMessageText(item.content)}
          </Text>
          {(metadata.shareType || Object.keys(metadata).length > 0) && (
            <RichMessagePreview message={previewMessage} isOwn={isUser} />
          )}
        </View>
      </View>
    )
  }, [styles, theme, coerceMessageText, normalizeMetadata])

  if (linkProfileLoading || conversationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.bondedPurple} />
          <Text style={styles.loadingText}>Starting chat with Link...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!linkProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={hp(6)} color={theme.colors.textSecondary} />
          <Text style={styles.loadingText}>Link is not available for your campus yet.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <Ionicons name="arrow-back" size={hp(2.8)} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Image source={LINK_LOGO} style={styles.linkLogo} contentFit="contain" />
          </View>
          <View>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName}>Link</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Your campus buddy</Text>
          </View>
        </View>
        <View style={{ width: hp(4.5) }} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={hp(10)}
      >
        <FlatList
          ref={flatListRef}
          data={mergedMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !messagesLoading && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyAvatar}>
                  <Image source={LINK_LOGO} style={styles.linkLogoLarge} contentFit="contain" />
                </View>
                <Text style={styles.emptyTitle}>Chat with Link</Text>
                <Text style={styles.emptySubtitle}>
                  Ask me anything about campus! I can help you find friends, study spots, events, and more.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            isLinkTyping ? (
              <View style={[styles.messageContainer, styles.linkMessage]}>
                <View style={styles.linkAvatar}>
                  <Image source={LINK_LOGO} style={styles.linkLogoSmall} contentFit="contain" />
                </View>
                <View style={[styles.messageBubble, styles.linkBubble, styles.typingBubble]}>
                  <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                  <Text style={styles.typingText}>Link is typing...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message Link..."
            placeholderTextColor={theme.colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={hp(2.2)} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(8),
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    marginTop: hp(3),
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.lg,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: hp(1.8),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSecondary,
  },
  backArrow: {
    padding: hp(0.5),
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(3),
  },
  headerAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: theme.colors.bondedPurple + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  linkLogo: {
    width: '70%',
    height: '70%',
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  headerName: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  aiBadge: {
    backgroundColor: theme.colors.bondedPurple + '20',
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.2),
    borderRadius: theme.radius.sm,
  },
  aiBadgeText: {
    fontSize: hp(1.1),
    color: theme.colors.bondedPurple,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    marginTop: hp(0.2),
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: hp(1.5),
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  linkMessage: {
    justifyContent: 'flex-start',
  },
  linkAvatar: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
    backgroundColor: theme.colors.bondedPurple + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2),
  },
  linkLogoSmall: {
    width: '75%',
    height: '75%',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.lg,
  },
  userBubble: {
    backgroundColor: theme.colors.bondedPurple,
    borderBottomRightRadius: theme.radius.sm,
  },
  linkBubble: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomLeftRadius: theme.radius.sm,
  },
  messageText: {
    fontSize: hp(1.8),
    lineHeight: hp(2.4),
  },
  userText: {
    color: '#FFF',
  },
  linkText: {
    color: theme.colors.textPrimary,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  typingText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    paddingTop: hp(10),
  },
  emptyAvatar: {
    width: hp(10),
    height: hp(10),
    borderRadius: hp(5),
    backgroundColor: theme.colors.bondedPurple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(3),
  },
  linkLogoLarge: {
    width: '70%',
    height: '70%',
  },
  emptyTitle: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: hp(1),
  },
  emptySubtitle: {
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSecondary,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    maxHeight: hp(15),
    marginRight: wp(3),
  },
  sendButton: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})
