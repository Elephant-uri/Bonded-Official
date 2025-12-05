import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { hp, wp } from '../helpers/common'
import theme from '../constants/theme'

// Mock data for users - in a real app, this would come from a users context or API
const MOCK_USERS = [
  { id: 'user-1', name: 'Alex Johnson', photoUrl: 'https://randomuser.me/api/portraits/men/20.jpg', isFriend: true },
  { id: 'user-2', name: 'Sarah Williams', photoUrl: 'https://randomuser.me/api/portraits/women/21.jpg', isFriend: true },
  { id: 'user-3', name: 'Michael Brown', photoUrl: 'https://randomuser.me/api/portraits/men/22.jpg', isFriend: false },
  { id: 'user-4', name: 'Emily Davis', photoUrl: 'https://randomuser.me/api/portraits/women/23.jpg', isFriend: true },
  { id: 'user-5', name: 'David Miller', photoUrl: 'https://randomuser.me/api/portraits/men/24.jpg', isFriend: false },
  { id: 'user-6', name: 'Jessica Garcia', photoUrl: 'https://randomuser.me/api/portraits/women/25.jpg', isFriend: true },
  { id: 'user-7', name: 'Chris Wilson', photoUrl: 'https://randomuser.me/api/portraits/men/26.jpg', isFriend: false },
  { id: 'user-8', name: 'Sophia Martinez', photoUrl: 'https://randomuser.me/api/portraits/women/27.jpg', isFriend: true },
]

export default function InviteModal({ visible, clubName, onClose, onInvite }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])

  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return MOCK_USERS
    }
    return MOCK_USERS.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleInvite = () => {
    if (selectedUsers.length === 0) {
      return
    }
    onInvite(selectedUsers)
    setSelectedUsers([])
    setSearchQuery('')
    onClose()
  }

  const renderUser = ({ item }) => {
    const isSelected = selectedUsers.includes(item.id)
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUserSelection(item.id)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.photoUrl }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          {item.isFriend && (
            <View style={styles.friendBadge}>
              <Ionicons name="checkmark-circle" size={hp(1.2)} color={theme.colors.bondedPurple} />
              <Text style={styles.friendText}>Friend</Text>
            </View>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={hp(2.5)} color={theme.colors.bondedPurple} />
        )}
      </TouchableOpacity>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={hp(3)} color={theme.colors.charcoal} />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Invite to {clubName}</Text>
                <Text style={styles.headerSubtitle}>
                  {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'Select people to invite'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleInvite}
                style={[styles.inviteButton, selectedUsers.length === 0 && styles.inviteButtonDisabled]}
                disabled={selectedUsers.length === 0}
              >
                <Text style={styles.inviteButtonText}>Invite</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={hp(2.2)} color={theme.colors.softBlack} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search people"
                placeholderTextColor={theme.colors.softBlack + '80'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <View style={styles.selectedUsersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedUsersScroll}>
                  {selectedUsers.map((userId) => {
                    const user = MOCK_USERS.find((u) => u.id === userId)
                    return user ? (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.selectedUserPill}
                        onPress={() => toggleUserSelection(user.id)}
                      >
                        <Image source={{ uri: user.photoUrl }} style={styles.selectedUserAvatar} />
                        <Text style={styles.selectedUserName}>{user.name}</Text>
                        <Ionicons name="close-circle" size={hp(1.8)} color={theme.colors.white} />
                      </TouchableOpacity>
                    ) : null
                  })}
                </ScrollView>
              </View>
            )}

            {/* Users List */}
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderUser}
              contentContainerStyle={styles.usersList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offWhite,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
    backgroundColor: theme.colors.white,
  },
  closeButton: {
    padding: wp(1),
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
  },
  headerSubtitle: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.7,
    marginTop: hp(0.2),
  },
  inviteButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bondedPurple,
  },
  inviteButtonDisabled: {
    opacity: 0.5,
  },
  inviteButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    marginHorizontal: wp(4),
    marginTop: hp(1.5),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
  },
  selectedUsersContainer: {
    marginBottom: hp(1.5),
  },
  selectedUsersScroll: {
    paddingHorizontal: wp(4),
    gap: wp(2),
  },
  selectedUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.xl,
    paddingVertical: hp(0.8),
    paddingLeft: wp(2),
    paddingRight: wp(1.5),
    gap: wp(1.5),
  },
  selectedUserAvatar: {
    width: hp(2.5),
    height: hp(2.5),
    borderRadius: hp(1.25),
  },
  selectedUserName: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.white,
    fontWeight: '600',
  },
  usersList: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
    gap: wp(3),
  },
  userAvatar: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: theme.radius.full,
    marginRight: wp(3),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
    fontWeight: '500',
    marginBottom: hp(0.2),
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  friendText: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.bondedPurple,
    fontWeight: '600',
  },
})

