import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'
import AppTopBar from '../components/AppTopBar'
import BottomNav from '../components/BottomNav'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import { LinearGradient } from 'expo-linear-gradient'
import { Animated } from 'react-native'

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'comment',
    title: 'New comment on your post',
    body: 'Alex commented on "Best study spots on campus?"',
    timeAgo: '5m',
    read: false,
    icon: 'chatbubble-outline',
  },
  {
    id: 'notif-2',
    type: 'upvote',
    title: 'Your post got upvoted',
    body: 'Your post "CS 201 midterm thread" received 10 upvotes',
    timeAgo: '12m',
    read: false,
    icon: 'arrow-up-circle-outline',
  },
  {
    id: 'notif-3',
    type: 'reply',
    title: 'Someone replied to your comment',
    body: 'Jordan replied to your comment in "Prof. Nguyen for Data Structures"',
    timeAgo: '1h',
    read: true,
    icon: 'return-down-forward-outline',
  },
  {
    id: 'notif-4',
    type: 'mention',
    title: 'You were mentioned',
    body: 'Taylor mentioned you in a comment',
    timeAgo: '2h',
    read: true,
    icon: 'at-outline',
  },
  {
    id: 'notif-5',
    type: 'forum',
    title: 'New forum activity',
    body: '5 new posts in "Campus Events"',
    timeAgo: '3h',
    read: true,
    icon: 'notifications-outline',
  },
]

export default function Notifications() {
  const router = useRouter()
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [refreshing, setRefreshing] = useState(false)
  const fadeAnim = React.useRef(new Animated.Value(0)).current

  const onRefresh = () => {
    setRefreshing(true)
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const NotificationItem = React.memo(({ item, index }) => {
    const slideAnim = React.useRef(new Animated.Value(50)).current
    const opacityAnim = React.useRef(new Animated.Value(0)).current

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start()
    }, [])

    return (
      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <AppCard style={styles.notificationCardWrapper}>
          {!item.read && (
            <LinearGradient
              colors={['#A855F7', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.unreadStrip}
            />
          )}
          <TouchableOpacity
            style={styles.notificationCard}
            activeOpacity={0.7}
          >
            <View style={styles.notificationIconContainer}>
              <Ionicons
                name={item.icon}
                size={hp(2.2)}
                color={item.read ? '#8E8E93' : theme.colors.bondedPurple}
              />
            </View>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
                {item.title}
              </Text>
              <Text style={styles.notificationBody}>{item.body}</Text>
              <Text style={styles.notificationTime}>{item.timeAgo}</Text>
            </View>
          </TouchableOpacity>
        </AppCard>
      </Animated.View>
    )
  })

  const renderNotification = ({ item, index }) => (
    <NotificationItem item={item} index={index} />
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppHeader
          title="Notifications"
          rightAction={() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }}
          rightActionLabel="Mark all read"
        />

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        <BottomNav />
      </View>
    </SafeAreaView>
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
  listContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(10),
  },
  notificationCardWrapper: {
    marginBottom: hp(1.5),
    position: 'relative',
    overflow: 'hidden',
  },
  unreadStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: wp(4),
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.4),
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationBody: {
    fontSize: hp(1.7),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.4),
    marginBottom: hp(0.5),
  },
  notificationTime: {
    fontSize: hp(1.4),
    color: theme.colors.softBlack,
    opacity: 0.7,
    fontFamily: theme.typography.fontFamily.body,
  },
  unreadDot: {
    width: hp(1),
    height: hp(1),
    borderRadius: hp(0.5),
    backgroundColor: theme.colors.bondedPurple,
    marginTop: hp(0.5),
  },
})


