import React, { useMemo, useState } from 'react'
import {
  Alert,
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Platform,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { hp, wp } from '../helpers/common'
import { useAppTheme } from '../app/theme'
import AppHeader from './AppHeader'
import AppCard from './AppCard'
import { useFriends } from '../hooks/useFriends'
import { useCreateConversation, useSendMessage } from '../hooks/useMessages'

export default function ShareModal({ visible, content, onClose, presentationStyle = 'pageSheet', transparent = false }) {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const insets = useSafeAreaInsets()
  const allowTransparent = transparent && (presentationStyle === 'overFullScreen' || presentationStyle === 'fullScreen')
  const modalTransparentProps = allowTransparent ? { transparent: true } : {}
  const router = useRouter()
  const { data: friends = [], isLoading: friendsLoading } = useFriends()
  const createConversation = useCreateConversation()
  const sendMessage = useSendMessage()
  const [selectedFriends, setSelectedFriends] = useState([])
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Move useMemo before early return to follow Rules of Hooks
  const friendOptions = useMemo(() => (
    friends.map((friend) => ({
      id: friend.id,
      name: friend.full_name || friend.username || 'User',
      avatar: friend.avatar_url || null,
      online: false,
    }))
  ), [friends])

  if (!content) return null

  const filteredFriends = friendOptions.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    )
  }

  const buildShareText = () => {
    switch (content.type) {
      case 'event': {
        const startDate = content.data.start_at || content.data.startDate
        const dateLabel = startDate
          ? new Date(startDate).toLocaleDateString()
          : 'Event'
        const location = content.data.location_name || content.data.location || content.data.location_address || 'Event'
        return `Event: ${content.data.title}\n${location} • ${dateLabel}`
      }
      case 'post': {
        const title = content.data.title || 'Forum Post'
        const body = content.data.body ? content.data.body.slice(0, 140) : ''
        return body ? `Post: ${title}\n${body}` : `Post: ${title}`
      }
      case 'story':
        return `Story from ${content.data.userName || 'someone'}`
      case 'professor':
        return `${content.data.name} • ${content.data.department}`
      case 'club':
        return `${content.data.name} • ${content.data.category || 'Club'}`
      case 'comment': {
        const postTitle = content.data.postTitle || 'Forum Post'
        const body = content.data.body ? content.data.body.slice(0, 140) : ''
        return body ? `Comment on ${postTitle}\n${body}` : `Comment on ${postTitle}`
      }
      case 'profile': {
        const major = content.data.majorLabel || content.data.major || 'Student'
        const year = content.data.year ? `Class of ${content.data.year}` : null
        return `Profile: ${content.data.name}\n${[major, year].filter(Boolean).join(' • ')}`
      }
      default:
        return 'Shared content'
    }
  }

  const handleSend = async () => {
    if (selectedFriends.length === 0) return
    if (isSending) return

    setIsSending(true)

    const shareText = buildShareText()
    const userMessage = message.trim()
    const fullMessage = userMessage ? `${userMessage}\n\n${shareText}` : shareText

    const shareData = {
      type: content.type, // 'event', 'post', 'story', 'professor', 'profile'
      data: content.data,
      message: userMessage || 'Check this out!',
    }

    try {
      const conversationIds = []
      for (const friendId of selectedFriends) {
        const conversationId = await createConversation.mutateAsync({ otherUserId: friendId })
        
        const baseMetadata = {
          shareType: content.type,
          shareData: shareData,
        }
        // Include metadata for shared posts/comments so they can be displayed properly
        const messageMetadata = content.type === 'post' ? {
          ...baseMetadata,
          postId: content.data.id,
          forumId: content.data.forumId || content.data.forum_id || null,
          postTitle: content.data.title || '',
          postBody: content.data.body || '',
        } : content.type === 'comment' ? {
          ...baseMetadata,
          commentId: content.data.id,
          postId: content.data.postId,
          forumId: content.data.forumId || null,
          commentBody: content.data.body || '',
          postTitle: content.data.postTitle || '',
        } : baseMetadata
        
        await sendMessage.mutateAsync({ 
          conversationId, 
          content: fullMessage,
          metadata: messageMetadata,
        })
        conversationIds.push({ friendId, conversationId })
      }

      if (selectedFriends.length === 1) {
        const recipient = friendOptions.find((friend) => friend.id === selectedFriends[0])
        const conversationId = conversationIds[0]?.conversationId
        if (conversationId) {
          router.push({
            pathname: '/chat',
            params: {
              conversationId,
              userId: selectedFriends[0],
              userName: recipient?.name || 'User',
              share: JSON.stringify(shareData),
            },
          })
        }
      } else {
        router.push('/messages')
      }

      onClose()
    } catch (error) {
      console.error('Share send failed:', error)
      Alert.alert('Share failed', 'Could not send this to your friends. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const getContentPreview = () => {
    switch (content.type) {
      case 'event': {
        const startDate = content.data.start_at || content.data.startDate
        const dateLabel = startDate
          ? new Date(startDate).toLocaleDateString()
          : 'Event'
        return {
          title: content.data.title,
          subtitle: `${content.data.location_name || content.data.location || content.data.location_address || 'Event'} • ${dateLabel}`,
          icon: 'calendar',
        }
      }
      case 'post':
        return {
          title: content.data.title || 'Forum Post',
          subtitle: content.data.body?.substring(0, 50) + '...' || 'Shared from forum',
          icon: 'chatbubble',
        }
      case 'story':
        return {
          title: `Story from ${content.data.userName}`,
          subtitle: content.data.forumName || 'Story',
          icon: 'camera',
        }
      case 'professor':
        return {
          title: content.data.name,
          subtitle: `${content.data.department} • ${content.data.overallRating.toFixed(1)}⭐`,
          icon: 'school',
        }
      case 'club':
        return {
          title: content.data.name,
          subtitle: `${content.data.category} • ${content.data.members?.length || 0} members`,
          icon: 'people',
        }
      case 'comment': {
        const postTitle = content.data.postTitle || 'Forum Post'
        const body = content.data.body ? content.data.body.slice(0, 60) : ''
        return {
          title: postTitle,
          subtitle: body || 'Shared a comment',
          icon: 'chatbubble',
        }
      }
      case 'profile': {
        const major = content.data.majorLabel || content.data.major || 'Student'
        const year = content.data.year ? `Class of ${content.data.year}` : 'Yearbook'
        return {
          title: content.data.name,
          subtitle: `${major} • ${year}`,
          icon: 'person',
        }
      }
      default:
        return {
          title: 'Shared Content',
          subtitle: 'Check this out!',
          icon: 'share',
        }
    }
  }

  const preview = getContentPreview()

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
      {...modalTransparentProps}
    >
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={[styles.container, { paddingTop: Math.max(insets.top, hp(1)) }]}>
          {/* AppHeader */}
          <AppHeader
            title="Share"
            rightAction={selectedFriends.length > 0 && !isSending ? handleSend : null}
            rightActionLabel={isSending ? 'Sending...' : `Send (${selectedFriends.length})`}
            onBack={onClose}
          />

          {/* Content Preview */}
          <AppCard style={styles.previewCard}>
            <View style={styles.previewIcon}>
              <Ionicons
                name={preview.icon}
                size={hp(2.5)}
                color={theme.colors.bondedPurple}
              />
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {preview.title}
              </Text>
              <Text style={styles.previewSubtitle} numberOfLines={1}>
                {preview.subtitle}
              </Text>
            </View>
          </AppCard>

          {/* Glass-style Message Input */}
          <View style={styles.messageSection}>
            <Text style={styles.messageLabel}>Add a message (optional)</Text>
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Say something..."
                placeholderTextColor={theme.colors.textSecondary + '80'}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={200}
              />
            </View>
          </View>

          {/* Glass-style Search */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={hp(1.8)}
              color={theme.colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor={theme.colors.textSecondary + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Friends List */}
          {friendsLoading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Loading friends…</Text>
            </View>
          ) : filteredFriends.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={hp(4)} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtitle}>Add friends to share in-app.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedFriends.includes(item.id)
                return (
                  <TouchableOpacity
                    style={styles.friendItem}
                    onPress={() => toggleFriend(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.friendAvatarContainer}>
                      {item.avatar ? (
                        <Image
                          source={{ uri: item.avatar }}
                          style={styles.friendAvatar}
                        />
                      ) : (
                        <View style={styles.friendAvatarPlaceholder}>
                          <Ionicons name="person" size={hp(2)} color={theme.colors.textSecondary} />
                        </View>
                      )}
                      {item.online && <View style={styles.onlineIndicator} />}
                    </View>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={hp(1.5)}
                          color={theme.colors.white}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                )
              }}
              contentContainerStyle={styles.friendsList}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  container: {
    flex: 1,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginTop: hp(1.5),
    marginBottom: hp(1),
    gap: wp(3),
  },
  previewIcon: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: theme.colors.bondedPurple + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.3),
  },
  previewSubtitle: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  messageSection: {
    paddingHorizontal: wp(4),
    marginTop: hp(0.5),
    marginBottom: hp(1),
  },
  messageLabel: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.8),
  },
  messageInputContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: hp(1.2),
    borderWidth: 1,
    borderColor: theme.colors.border || 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  messageInput: {
    padding: wp(4),
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    minHeight: hp(8),
    textAlignVertical: 'top',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.border || 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  searchIcon: {
    marginRight: wp(2),
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
  },
  friendsList: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  loadingState: {
    padding: wp(4),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
  },
  emptyState: {
    padding: wp(6),
    alignItems: 'center',
    gap: hp(0.8),
  },
  emptyTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    gap: wp(3),
  },
  friendAvatarContainer: {
    position: 'relative',
  },
  friendAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
  },
  friendAvatarPlaceholder: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: hp(1.5),
    height: hp(1.5),
    borderRadius: hp(0.75),
    backgroundColor: '#2ecc71',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  friendName: {
    flex: 1,
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  checkbox: {
    width: hp(2.5),
    height: hp(2.5),
    borderRadius: hp(1.25),
    borderWidth: 2,
    borderColor: theme.colors.border || theme.colors.softBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.bondedPurple,
  },
})
