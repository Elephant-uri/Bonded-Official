import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet, Image, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { hp, wp } from '../../helpers/common'
import theme from '../../constants/theme'

export default function StoryCircle({ story, onPress, isOwn = false }) {
  const hasUnviewed = story.hasUnviewed

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={onPress}>
      {hasUnviewed ? (
        // Gradient border for unviewed stories
        <LinearGradient
          colors={['#FF6B9D', '#C239B3', '#A45CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={styles.innerCircle}>
            {story.thumbnail ? (
              <Image source={{ uri: story.thumbnail }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                  {story.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      ) : (
        // Gray border for viewed stories
        <View style={[styles.gradientBorder, styles.viewedBorder]}>
          <View style={styles.innerCircle}>
            {story.thumbnail ? (
              <Image source={{ uri: story.thumbnail }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                  {story.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {isOwn && (
        <View style={styles.ownBadge}>
          <Ionicons name="person" size={hp(1.2)} color={theme.colors.white} />
        </View>
      )}

      <Text numberOfLines={1} style={styles.label}>
        {isOwn ? 'Your Story' : story.name || 'User'}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: wp(4),
  },
  gradientBorder: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(4),
    padding: 4,
    marginBottom: hp(1),
    ...Platform.select({
      ios: {
        shadowColor: '#A45CFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  viewedBorder: {
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#C0C0C0',
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: hp(4),
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8D5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: hp(2.8),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  ownBadge: {
    position: 'absolute',
    top: hp(6),
    right: wp(-0.5),
    width: hp(2.4),
    height: hp(2.4),
    borderRadius: hp(1.2),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  label: {
    fontSize: hp(1.5),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: wp(22),
  },
})
