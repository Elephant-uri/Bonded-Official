import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'

const ForumSwitcher = ({ currentForum, onPress, unreadCount = 0 }) => {
  const getForumIcon = (type) => {
    switch (type) {
      case 'main':
        return 'home'
      case 'class':
        return 'school'
      case 'org':
        return 'people'
      case 'private':
        return 'lock-closed'
      default:
        return 'chatbubbles'
    }
  }

  const getForumColor = (type) => {
    switch (type) {
      case 'main':
        return theme.colors.bondedPurple
      case 'class':
        return '#4ECDC4'
      case 'org':
        return '#FF6B6B'
      case 'private':
        return '#95E1D3'
      default:
        return theme.colors.bondedPurple
    }
  }

  return (
    <TouchableOpacity
      style={styles.switcher}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getForumColor(currentForum?.type || 'main') + '15' }]}>
        <Ionicons
          name={getForumIcon(currentForum?.type || 'main')}
          size={hp(1.8)}
          color={getForumColor(currentForum?.type || 'main')}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.forumName} numberOfLines={1}>
          {currentForum?.name || 'Main Forum'}
        </Text>
        {currentForum?.memberCount && (
          <Text style={styles.memberCount}>
            {currentForum.memberCount} members
          </Text>
        )}
      </View>
      <Ionicons
        name="chevron-down"
        size={hp(1.6)}
        color={theme.colors.textSecondary}
        style={styles.chevron}
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

export default ForumSwitcher

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: wp(40),
    maxWidth: wp(70),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  iconContainer: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2),
  },
  textContainer: {
    flex: 1,
    marginRight: wp(1),
  },
  forumName: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  memberCount: {
    fontSize: hp(1.1),
    color: theme.colors.textSecondary,
    marginTop: hp(0.1),
  },
  chevron: {
    marginLeft: wp(1),
  },
  badge: {
    position: 'absolute',
    top: -hp(0.5),
    right: -hp(0.5),
    backgroundColor: theme.colors.error,
    borderRadius: hp(1),
    minWidth: hp(1.8),
    height: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1),
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  badgeText: {
    fontSize: hp(1),
    fontWeight: '700',
    color: theme.colors.white,
  },
})

