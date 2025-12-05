import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'

const BottomNav = ({ scrollY = null }) => {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  
  // Animation for hiding/showing nav on scroll
  const navTranslateY = useRef(new Animated.Value(0)).current
  const lastScrollY = useRef(0)
  const isAnimating = useRef(false)
  
  // Handle scroll-based hide/show
  useEffect(() => {
    if (!scrollY) return
    
    const listenerId = scrollY.addListener(({ value }) => {
      const currentScrollY = value
      const scrollDifference = currentScrollY - lastScrollY.current
      
      // Prevent multiple animations from running
      if (isAnimating.current) {
        lastScrollY.current = currentScrollY
        return
      }
      
      // Ignore small scrolls
      if (Math.abs(scrollDifference) < 3) {
        return
      }
      
      // Always show nav when at the top
      if (currentScrollY <= 0) {
        isAnimating.current = true
        Animated.timing(navTranslateY, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          isAnimating.current = false
        })
        lastScrollY.current = currentScrollY
        return
      }
      
      // Hide nav when scrolling down, show when scrolling up
      isAnimating.current = true
      const toValue = scrollDifference > 0 ? 100 : 0 // Hide by moving down 100px
      
      Animated.timing(navTranslateY, {
        toValue,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false
      })
      
      lastScrollY.current = currentScrollY
    })
    
    return () => {
      if (scrollY) {
        scrollY.removeListener(listenerId)
      }
    }
  }, [scrollY])

  const tabs = [
    {
      id: 'yearbook',
      label: 'Yearbook',
      icon: 'book-outline',
      activeIcon: 'book',
      route: '/yearbook',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: 'chatbubbles-outline',
      activeIcon: 'chatbubbles',
      route: '/messages',
    },
    {
      id: 'forum',
      label: 'Forum',
      icon: 'chatbox-ellipses-outline',
      activeIcon: 'chatbox-ellipses',
      route: '/forum',
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: 'calendar-outline',
      activeIcon: 'calendar',
      route: '/calendar',
    },
  ]

  const handleTabPress = (tab) => {
    router.push(tab.route)
  }

  const isActive = (route) => {
    if (route === '/yearbook') {
      return pathname === '/yearbook' || pathname === '/home' || pathname === '/'
    }
    return pathname === route || pathname?.startsWith(route + '/')
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, hp(2)),
          transform: [{ translateY: navTranslateY }],
        },
      ]}
    >
      <View style={styles.navPill}>
        {tabs.map((tab) => {
          const active = isActive(tab.route)
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={active ? hp(2.5) : hp(2.2)}
                color={active ? theme.colors.bondedPurple : '#8E8E93'}
                style={{ strokeWidth: active ? 1.5 : 1 }}
              />
              <Text
                style={[
                  styles.tabLabel,
                  active && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {active && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </Animated.View>
  )
}

export default BottomNav

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
    backgroundColor: 'transparent',
  },
  navPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    width: '100%',
    maxWidth: wp(90),
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: theme.radius.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(1),
    borderRadius: theme.radius.md,
    gap: hp(0.2),
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: hp(1.1),
    color: '#8E8E93',
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '400',
    marginTop: hp(0.1),
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: theme.colors.bondedPurple,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: hp(-0.4),
    width: wp(2.5),
    height: hp(0.3),
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bondedPurple,
  },
})

