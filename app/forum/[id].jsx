import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Heart, HeartFill, MessageCircle, MoreHorizontal, Repeat, Share2, X } from '../../components/Icons'
import { hp, wp } from '../../helpers/common'
import { useComments } from '../../hooks/useComments'
import { usePosts } from '../../hooks/usePosts'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useAppTheme } from '../theme'

export default function SharedPostScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const styles = createStyles(theme)
  
  // Debug: Log what parameters we receive
  console.log('🔍 Forum page received params:', params)
  
  const postId = params.post || params.postId || params.id
  const forumId = params.forumId
  
  console.log('🔍 Extracted IDs:', { postId, forumId })
  
  // Fetch the specific post
  const { data: postsData, isLoading: postsLoading } = usePosts(forumId, {})
  const posts = useMemo(() => {
    if (!postsData?.pages) return []
    return postsData.pages.flatMap((page) => page.posts || [])
  }, [postsData])
  
  const post = useMemo(() => {
    const foundPost = posts.find((p) => p.id === postId)
    console.log('🔍 Looking for post:', { postId, totalPosts: posts.length, foundPost })
    return foundPost
  }, [posts, postId])
  
  const {
    data: postComments = [],
    refetch: refetchComments,
  } = useComments(postId)
  
  const [comments, setComments] = useState({})
  const [newCommentText, setNewCommentText] = useState('')
  const [newCommentIsAnon, setNewCommentIsAnon] = useState(false)
  const [commentSort, setCommentSort] = useState('best')
  const [userVotes, setUserVotes] = useState({})
  const [showComments, setShowComments] = useState(false)
  
  useEffect(() => {
    if (postId && postComments.length > 0) {
      setComments((prev) => ({
        ...prev,
        [postId]: postComments,
      }))
    }
  }, [postId, postComments])
  
  const handleCommentVote = async (commentId, parentId, direction) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to vote on comments.')
      return
    }
    
    const voteKey = parentId ? `${parentId}-${commentId}` : commentId
    const currentVote = userVotes[voteKey]
    const newVote = currentVote === direction ? null : direction
    
    // Optimistic update
    setUserVotes((prev) => ({ ...prev, [voteKey]: newVote }))
    
    // TODO: Implement actual vote API call
    await refetchComments()
  }
  
  const submitComment = async () => {
    if (!newCommentText.trim() || !user?.id) {
      Alert.alert('Sign in required', 'Please sign in to comment.')
      return false
    }
    
    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        body: newCommentText.trim(),
        is_anonymous: newCommentIsAnon,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error posting comment:', error)
      Alert.alert('Error', 'Failed to post comment. Please try again.')
      return false
    }
    
    setNewCommentText('')
    setNewCommentIsAnon(false)
    await refetchComments()
    return true
  }
  
  if (postsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.bondedPurple} />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    )
  }
  
  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }
  
  const sortedComments = useMemo(() => {
    const postComments = comments[postId] || []
    if (commentSort === 'new') {
      return [...postComments].sort((a, b) => b.timeAgo?.localeCompare(a.timeAgo) || 0)
    }
    return [...postComments].sort((a, b) => {
      const scoreA = (a.upvotes || 0) - (a.downvotes || 0)
      const scoreB = (b.upvotes || 0) - (b.downvotes || 0)
      return scoreB - scoreA
    })
  }, [comments, postId, commentSort])
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={hp(2.4)} color={theme.colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MoreHorizontal size={hp(2.4)} color={theme.colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Post Content */}
        <View style={styles.postCard}>
          {/* Author */}
          <View style={styles.postHeader}>
            <View style={styles.postAuthorRow}>
              {post.isAnon ? (
                <View style={[styles.postAvatar, { backgroundColor: theme.colors.bondedPurple }]}>
                  <Text style={styles.postAvatarText}>?</Text>
                </View>
              ) : post.authorAvatar ? (
                <Image
                  source={{ uri: post.authorAvatar }}
                  style={styles.postAvatarImage}
                />
              ) : (
                <View style={styles.postAvatar}>
                  <Text style={styles.postAvatarText}>
                    {post.author?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.postAuthorInfo}>
                <Text style={styles.postAuthorName}>
                  {post.isAnon ? 'Anonymous' : post.author}
                </Text>
                <Text style={styles.postMetaText}>
                  {post.forum} • {post.timeAgo}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Post Body */}
          {post.title && (
            <Text style={styles.postTitle}>{post.title}</Text>
          )}
          <Text style={styles.postBody}>{post.body}</Text>
          
          {/* Post Media */}
          {post.media && post.media.length > 0 && (
            <View style={styles.postMediaContainer}>
              {post.media.slice(0, 1).map((media, idx) => (
                <Image
                  key={idx}
                  source={{ uri: media.uri }}
                  style={styles.postMedia}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
          
          {/* Post Actions */}
          <View style={styles.postActions}>
            <View style={styles.postActionGroup}>
              <TouchableOpacity style={styles.postActionButton}>
                <Heart size={hp(2.4)} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={styles.postActionText}>{post.upvotes || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.postActionButton}
                onPress={() => setShowComments(true)}
              >
                <MessageCircle
                  size={hp(2.4)}
                  color={theme.colors.textSecondary}
                  strokeWidth={2}
                />
                <Text style={styles.postActionText}>{post.commentsCount || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postActionButton}>
                <Repeat size={hp(2.4)} color={theme.colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.postActionButton}>
                <Share2 size={hp(2.4)} color={theme.colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Comments Preview */}
        {sortedComments.length > 0 && (
          <View style={styles.commentsPreview}>
            <Text style={styles.commentsPreviewTitle}>
              Comments ({post.commentsCount || sortedComments.length})
            </Text>
            {sortedComments.slice(0, 3).map((comment) => (
              <View key={comment.id} style={styles.commentPreviewItem}>
                <Text style={styles.commentPreviewAuthor}>
                  {comment.isAnon ? 'Anonymous' : comment.author}
                </Text>
                <Text style={styles.commentPreviewText} numberOfLines={2}>
                  {comment.body}
                </Text>
              </View>
            ))}
            {sortedComments.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllCommentsButton}
                onPress={() => setShowComments(true)}
              >
                <Text style={styles.viewAllCommentsText}>
                  View all {sortedComments.length} comments
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Comment Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom || hp(2) }]}>
          <View style={styles.commentInputAvatar}>
            <Text style={styles.commentInputAvatarText}>
              {user?.email?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={theme.colors.textSecondary}
            value={newCommentText}
            onChangeText={setNewCommentText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.commentPostButton,
              !newCommentText.trim() && styles.commentPostButtonDisabled,
            ]}
            onPress={submitComment}
            disabled={!newCommentText.trim()}
          >
            <Text style={styles.commentPostButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Comments Modal */}
      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.commentsModalContainer}>
          <Pressable
            style={styles.commentsModalBackdrop}
            onPress={() => setShowComments(false)}
          />
          <View style={styles.commentsModalContent}>
            <View style={styles.commentsModalHeader}>
              <Text style={styles.commentsModalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <X size={hp(2.4)} color={theme.colors.textPrimary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.commentsModalList}>
              {sortedComments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {comment.isAnon ? '?' : comment.author?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentAuthor}>
                      {comment.isAnon ? 'Anonymous' : comment.author}
                    </Text>
                    <Text style={styles.commentText}>{comment.body}</Text>
                    <View style={styles.commentActions}>
                      <TouchableOpacity
                        style={styles.commentLikeButton}
                        onPress={() => handleCommentVote(comment.id, null, 'up')}
                      >
                        {userVotes[comment.id] === 'up' ? (
                          <HeartFill size={hp(1.8)} color={theme.colors.error} strokeWidth={2} />
                        ) : (
                          <Heart size={hp(1.8)} color={theme.colors.textSecondary} strokeWidth={2} />
                        )}
                        {(comment.upvotes - (comment.downvotes || 0)) > 0 && (
                          <Text style={styles.commentLikeCount}>
                            {comment.upvotes - (comment.downvotes || 0)}
                          </Text>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(5),
  },
  errorText: {
    fontSize: hp(2),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(3),
  },
  backButton: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.lg,
  },
  backButtonText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    width: hp(4),
    height: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(10),
  },
  postCard: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  postHeader: {
    marginBottom: hp(2),
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.5),
  },
  postAvatarImage: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    marginRight: wp(2.5),
  },
  postAvatarText: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  postMetaText: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.2),
  },
  postTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1),
  },
  postBody: {
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.5),
    marginBottom: hp(2),
  },
  postMediaContainer: {
    marginBottom: hp(2),
  },
  postMedia: {
    width: '100%',
    height: hp(30),
    borderRadius: theme.radius.md,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(1.5),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  postActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  postActionText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  commentsPreview: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
  },
  commentsPreviewTitle: {
    fontSize: hp(1.8),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1.5),
  },
  commentPreviewItem: {
    marginBottom: hp(1.5),
  },
  commentPreviewAuthor: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(0.3),
  },
  commentPreviewText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  viewAllCommentsButton: {
    paddingVertical: hp(1),
  },
  viewAllCommentsText: {
    fontSize: hp(1.4),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  commentInputAvatar: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2),
  },
  commentInputAvatarText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  commentInput: {
    flex: 1,
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    maxHeight: hp(10),
    paddingVertical: hp(1),
  },
  commentPostButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  commentPostButtonDisabled: {
    opacity: 0.5,
  },
  commentPostButtonText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
  },
  commentsModalContainer: {
    flex: 1,
  },
  commentsModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentsModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: hp(2),
    borderTopRightRadius: hp(2),
  },
  commentsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  commentsModalTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  commentsModalList: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: hp(1.5),
  },
  commentAvatar: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  commentAvatarText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(0.3),
  },
  commentText: {
    fontSize: hp(1.5),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.1),
    marginBottom: hp(0.5),
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  commentLikeCount: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  commentTime: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
  },
})



