import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Modal,
  Pressable,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { hp, wp } from '../../helpers/common'
import theme from '../../constants/theme'
import { useStoriesContext } from '../../contexts/StoriesContext'

const STORY_DURATION = 5000 // 5 seconds per story segment

export default function StoryViewer({
  visible,
  stories,
  initialIndex = 0,
  onClose,
  currentUserId,
}) {
  const router = useRouter()
  const [currentStoryGroupIndex, setCurrentStoryGroupIndex] = useState(initialIndex)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [swipeUpProgress, setSwipeUpProgress] = useState(0)
  const progressAnims = useRef([]).current
  const pauseTimeRef = useRef(null)
  const remainingTimeRef = useRef(STORY_DURATION)
  const swipeUpAnim = useRef(new Animated.Value(0)).current
  const { markStoryAsViewed, deleteStory, addCommentToStory, getStoryComments } =
    useStoriesContext()

  const currentStoryGroup = stories[currentStoryGroupIndex]
  const currentSegment = currentStoryGroup?.segments?.[currentSegmentIndex]
  const totalSegments = currentStoryGroup?.segments?.length || 0
  const isOwnStory = currentStoryGroup?.userId === currentUserId
  const isPublic = currentStoryGroup?.isPublic !== false // Default to public
  const currentStoryId = currentSegment?.id
  const comments = currentStoryId ? getStoryComments(currentStoryId) : []

  // Initialize progress animations
  useEffect(() => {
    if (currentStoryGroup) {
      progressAnims.length = 0
      for (let i = 0; i < totalSegments; i++) {
        progressAnims.push(new Animated.Value(0))
      }
    }
  }, [currentStoryGroupIndex, totalSegments])

  useEffect(() => {
    if (visible && currentSegment && !isPaused) {
      startProgress()
    }
    return () => {
      progressAnims.forEach((anim) => anim.stopAnimation())
    }
  }, [visible, currentStoryGroupIndex, currentSegmentIndex, isPaused])

  useEffect(() => {
    if (currentStoryGroup) {
      markStoryAsViewed(currentStoryGroup.id)
    }
  }, [currentStoryGroupIndex])

  const startProgress = () => {
    const duration = remainingTimeRef.current
    Animated.timing(progressAnims[currentSegmentIndex], {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPaused) {
        remainingTimeRef.current = STORY_DURATION
        handleNext()
      }
    })
  }

  const pauseProgress = () => {
    pauseTimeRef.current = Date.now()
    progressAnims[currentSegmentIndex].stopAnimation((value) => {
      remainingTimeRef.current = STORY_DURATION * (1 - value)
    })
    setIsPaused(true)
  }

  const resumeProgress = () => {
    setIsPaused(false)
  }

  const handleNext = () => {
    if (currentSegmentIndex < totalSegments - 1) {
      progressAnims[currentSegmentIndex].setValue(1)
      setCurrentSegmentIndex((prev) => prev + 1)
      remainingTimeRef.current = STORY_DURATION
    } else if (currentStoryGroupIndex < stories.length - 1) {
      progressAnims.forEach((anim) => anim.setValue(0))
      setCurrentStoryGroupIndex((prev) => prev + 1)
      setCurrentSegmentIndex(0)
      remainingTimeRef.current = STORY_DURATION
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentSegmentIndex > 0) {
      progressAnims[currentSegmentIndex].setValue(0)
      setCurrentSegmentIndex((prev) => prev - 1)
      remainingTimeRef.current = STORY_DURATION
    } else if (currentStoryGroupIndex > 0) {
      const prevStoryGroup = stories[currentStoryGroupIndex - 1]
      progressAnims.forEach((anim) => anim.setValue(0))
      setCurrentStoryGroupIndex((prev) => prev - 1)
      setCurrentSegmentIndex(prevStoryGroup.segments.length - 1)
      remainingTimeRef.current = STORY_DURATION
    }
  }

  const handleTap = (event) => {
    const { locationX } = event.nativeEvent
    const screenWidth = Dimensions.get('window').width
    if (locationX < screenWidth / 3) {
      handlePrevious()
    } else if (locationX > (screenWidth * 2) / 3) {
      handleNext()
    }
  }

  const handleLongPressIn = () => {
    pauseProgress()
  }

  const handleLongPressOut = () => {
    resumeProgress()
  }

  const handleDelete = () => {
    Alert.alert('Delete Story', 'Are you sure you want to delete this story?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteStory(currentStoryGroup.forumId, currentStoryGroup.id)
          if (stories.length > 1) {
            if (currentStoryGroupIndex < stories.length - 1) {
              setCurrentStoryGroupIndex(currentStoryGroupIndex)
            } else {
              setCurrentStoryGroupIndex(currentStoryGroupIndex - 1)
            }
          } else {
            onClose()
          }
        },
      },
    ])
  }

  const handleSendComment = () => {
    if (!commentText.trim() || !currentStoryId) return

    addCommentToStory(currentStoryId, {
      userId: currentUserId,
      userName: 'You',
      userAvatar: null,
      text: commentText.trim(),
      isAnon: false,
    })

    setCommentText('')
  }

  const handleSwipeUp = () => {
    if (!currentStoryGroup || !currentSegment) return
    
    if (isPublic) {
      // Show action sheet for public stories
      Alert.alert(
        'Story Actions',
        'What would you like to do?',
        [
          {
            text: 'Comment',
            onPress: () => setShowComments(true),
          },
          {
            text: 'Message',
            onPress: () => {
              // Navigate to messages with story content
              router.push({
                pathname: '/messages',
                params: {
                  share: JSON.stringify({
                    type: 'story',
                    data: {
                      storyId: currentStoryId,
                      userName: currentStoryGroup?.name || 'Unknown',
                      imageUri: currentSegment?.imageUri || '',
                    },
                  }),
                },
              })
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      )
    } else {
      setShowComments(true)
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gestureState) => {
        // Only start if it's an upward swipe
        return gestureState.dy < 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Continue if it's an upward swipe
        return Math.abs(gestureState.dy) > 10 && gestureState.dy < 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
      },
      onPanResponderGrant: () => {
        pauseProgress()
        Animated.spring(swipeUpAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start()
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < -50) {
          setSwipeUpProgress(Math.min(1, Math.abs(gestureState.dy) / 100))
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        Animated.spring(swipeUpAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start()
        if (gestureState.dy < -100) {
          handleSwipeUp()
        }
        setSwipeUpProgress(0)
        resumeProgress()
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeUpAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start()
        setSwipeUpProgress(0)
        resumeProgress()
      },
    })
  ).current

  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        {item.userAvatar ? (
          <Image source={{ uri: item.userAvatar }} style={styles.commentAvatarImage} />
        ) : (
          <Text style={styles.commentAvatarText}>
            {item.userName?.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.commentName}>{item.userName}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  )

  if (!visible || !currentStoryGroup || !currentSegment) return null

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Progress bars */}
          <View style={styles.progressContainer}>
            {currentStoryGroup.segments.map((_, index) => (
              <View key={index} style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        progressAnims[index]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }) || '0%',
                      backgroundColor:
                        index < currentSegmentIndex
                          ? '#FFFFFF'
                          : index === currentSegmentIndex
                          ? '#FFFFFF'
                          : 'rgba(255, 255, 255, 0.3)',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                {currentStoryGroup.thumbnail ? (
                  <Image source={{ uri: currentStoryGroup.thumbnail }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {currentStoryGroup.name?.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.name}>{currentStoryGroup.name}</Text>
                <Text style={styles.time}>{currentSegment.timeAgo || '3h ago'}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {isOwnStory && (
                <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                  <Ionicons name="trash-outline" size={hp(2.5)} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Ionicons name="close" size={hp(2.8)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Story content - Full Screen */}
          <View
            style={styles.content}
            {...panResponder.panHandlers}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleTap}
              onLongPress={handleLongPressIn}
              onPressOut={handleLongPressOut}
            >
            {currentSegment.type === 'video' ? (
              <View style={styles.media}>
                <Text style={styles.videoPlaceholder}>
                  Video playback requires expo-av
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: currentSegment.imageUri }}
                style={styles.media}
                resizeMode="cover"
              />
            )}

            {/* Render text overlays */}
            {currentSegment.textElements?.map((textEl) => (
              <View
                key={textEl.id}
                style={[
                  styles.textElement,
                  {
                    left: textEl.x - 50,
                    top: textEl.y - 20,
                  },
                ]}
              >
                <View
                  style={[
                    styles.textWrapper,
                    {
                      backgroundColor: textEl.backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.textElementText,
                      {
                        color: textEl.color,
                        fontSize: textEl.size,
                      },
                    ]}
                  >
                    {textEl.text}
                  </Text>
                </View>
              </View>
            ))}

            {/* Render sticker overlays */}
            {currentSegment.stickerElements?.map((sticker) => (
              <View
                key={sticker.id}
                style={[
                  styles.stickerElement,
                  {
                    left: sticker.x - sticker.size / 2,
                    top: sticker.y - sticker.size / 2,
                  },
                ]}
              >
                <Text style={{ fontSize: sticker.size }}>{sticker.emoji}</Text>
              </View>
            ))}

            {isPaused && (
              <View style={styles.pausedIndicator}>
                <Ionicons name="pause" size={hp(6)} color="rgba(255, 255, 255, 0.9)" />
              </View>
            )}
            </Pressable>
          </View>

          {/* Swipe Up Action Indicator */}
          <Animated.View
            style={[
              styles.swipeUpContainer,
              {
                opacity: swipeUpAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.7],
                }),
                transform: [
                  {
                    translateY: swipeUpAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.swipeUpButton}
              onPress={handleSwipeUp}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.swipeUpArrow,
                  {
                    transform: [
                      {
                        translateY: swipeUpAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -10],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="chevron-up" size={hp(3)} color="#FFFFFF" />
              </Animated.View>
              <Text style={styles.swipeUpText}>
                {isPublic ? 'Swipe up to interact' : 'Swipe up to comment'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Comments Panel */}
          {showComments && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.commentsContainer}
            >
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>
                  {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </Text>
                <TouchableOpacity onPress={() => setShowComments(false)}>
                  <Ionicons name="close" size={hp(2.5)} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
                contentContainerStyle={styles.commentsListContent}
              />
              <View style={styles.commentInputContainer}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  style={styles.commentInput}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSendComment}
                  style={[
                    styles.sendButton,
                    !commentText.trim() && styles.sendButtonDisabled,
                  ]}
                  disabled={!commentText.trim()}
                >
                  <Ionicons
                    name="send"
                    size={hp(2.2)}
                    color={commentText.trim() ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: wp(1),
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(1.5),
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  headerButton: {
    padding: hp(0.5),
  },
  avatar: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: hp(2),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  name: {
    fontSize: hp(1.8),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  time: {
    fontSize: hp(1.3),
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoPlaceholder: {
    color: '#FFFFFF',
    fontSize: hp(2),
    textAlign: 'center',
    opacity: 0.7,
  },
  textElement: {
    position: 'absolute',
    zIndex: 10,
  },
  textWrapper: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: hp(0.5),
  },
  textElementText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stickerElement: {
    position: 'absolute',
    zIndex: 10,
  },
  pausedIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -hp(3) }, { translateY: -hp(3) }],
  },
  swipeUpContainer: {
    position: 'absolute',
    bottom: hp(4),
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeUpButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeUpArrow: {
    marginBottom: hp(0.5),
  },
  swipeUpText: {
    fontSize: hp(1.3),
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.9,
  },
  commentsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: hp(2.5),
    borderTopRightRadius: hp(2.5),
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  commentsTitle: {
    fontSize: hp(2),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    paddingVertical: hp(1),
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    gap: wp(3),
  },
  commentAvatar: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  commentAvatarText: {
    fontSize: hp(1.6),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
  },
  commentName: {
    fontSize: hp(1.6),
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: hp(0.3),
  },
  commentText: {
    fontSize: hp(1.5),
    color: '#FFFFFF',
    opacity: 0.9,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: wp(2),
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: hp(1.5),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    fontSize: hp(1.6),
    color: '#FFFFFF',
    maxHeight: hp(10),
  },
  sendButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})
