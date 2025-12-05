import React, { useState } from 'react'
import {
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
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { hp, wp } from '../helpers/common'
import theme from '../constants/theme'
import AppHeader from './AppHeader'
import AppCard from './AppCard'

// Mock friends list - replace with real data
const MOCK_FRIENDS = [
  { id: 'friend-1', name: 'Alex Johnson', avatar: 'https://randomuser.me/api/portraits/men/20.jpg', online: true },
  { id: 'friend-2', name: 'Sarah Williams', avatar: 'https://randomuser.me/api/portraits/women/21.jpg', online: false },
  { id: 'friend-3', name: 'Michael Brown', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', online: true },
  { id: 'friend-4', name: 'Emily Davis', avatar: 'https://randomuser.me/api/portraits/women/23.jpg', online: false },
  { id: 'friend-5', name: 'David Miller', avatar: 'https://randomuser.me/api/portraits/men/24.jpg', online: true },
  { id: 'friend-6', name: 'Jessica Garcia', avatar: 'https://randomuser.me/api/portraits/women/25.jpg', online: false },
  { id: 'friend-7', name: 'Chris Wilson', avatar: 'https://randomuser.me/api/portraits/men/26.jpg', online: true },
  { id: 'friend-8', name: 'Olivia Martinez', avatar: 'https://randomuser.me/api/portraits/women/27.jpg', online: false },
]

export default function ShareModal({ visible, content, onClose }) {
  const router = useRouter()
  const [selectedFriends, setSelectedFriends] = useState([])
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  if (!content) return null

  const filteredFriends = MOCK_FRIENDS.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleSend = () => {
    if (selectedFriends.length === 0) return

    // TODO: Send content to selected friends via messages
    // For now, navigate to messages with pre-filled content
    const shareData = {
      type: content.type, // 'event', 'post', 'story', 'professor'
      data: content.data,
      message: message.trim() || `Check this out!`,
    }

    // Navigate to messages with share data
    router.push({
      pathname: '/messages',
      params: {
        share: JSON.stringify(shareData),
        recipients: selectedFriends.join(','),
      },
    })

    onClose()
  }

  const getContentPreview = () => {
    switch (content.type) {
      case 'event':
        return {
          title: content.data.title,
          subtitle: `${content.data.location || 'Event'} • ${new Date(content.data.startDate).toLocaleDateString()}`,
          icon: 'calendar',
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
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          {/* AppHeader */}
          <AppHeader
            title="Share"
            rightAction={selectedFriends.length > 0 ? handleSend : null}
            rightActionLabel={`Send (${selectedFriends.length})`}
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
                placeholderTextColor="#8E8E93"
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
              color="#8E8E93"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Friends List */}
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
                    <Image
                      source={{ uri: item.avatar }}
                      style={styles.friendAvatar}
                    />
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
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offWhite,
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
    color: theme.colors.charcoal,
    marginBottom: hp(0.3),
  },
  previewSubtitle: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
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
    color: '#000000',
    marginBottom: hp(0.8),
  },
  messageInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: hp(1.2),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
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
    color: '#000000',
    minHeight: hp(8),
    textAlignVertical: 'top',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
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
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
  },
  friendsList: {
    padding: wp(4),
    paddingBottom: hp(10),
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
    color: theme.colors.charcoal,
  },
  checkbox: {
    width: hp(2.5),
    height: hp(2.5),
    borderRadius: hp(1.25),
    borderWidth: 2,
    borderColor: theme.colors.softBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.bondedPurple,
  },
})

