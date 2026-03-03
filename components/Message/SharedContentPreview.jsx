import { useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import CachedImage from '../CachedImage'
import { useAppTheme } from '../../app/theme'
import { hp, wp } from '../../helpers/common'
import { Logger } from '../../utils/logger'

export default function SharedContentPreview({ metadata, onPress }) {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()

  if (!metadata || !metadata.shareType) return null

  const handlePress = () => {
    if (onPress) {
      onPress()
      return
    }

    const shareData = metadata.shareData || {}
    
    Logger.info('Navigating to shared content:', {
      shareType: metadata.shareType,
      metadata: metadata,
      shareData: shareData
    })

    // Navigate based on share type
    try {
      switch (metadata.shareType) {
        case 'event':
          const eventId = metadata.eventId || shareData?.id
          Logger.info('Navigating to event:', eventId)
          if (eventId) {
            router.push(`/events/${eventId}`)
          } else {
            Logger.warn('No event ID found')
          }
          break
        
        case 'post':
          const postId = metadata.postId || shareData?.id
          const forumId = metadata.forumId || shareData?.forumId || shareData?.forum_id
          Logger.info('Navigating to post:', { postId, forumId })
          if (postId && forumId) {
            router.push(`/forum/${forumId}?post=${postId}`)
          } else if (postId) {
            // Fallback - try to find forum
            router.push(`/forum?post=${postId}`)
          } else {
            Logger.warn('No post ID found')
          }
          break
        
        case 'comment':
          const commentId = metadata.commentId || shareData?.id
          const commentPostId = metadata.postId || shareData?.postId
          const commentForumId = metadata.forumId || shareData?.forumId || shareData?.forum_id
          Logger.info('Navigating to comment:', { commentId, commentPostId, commentForumId })
          if (commentPostId && commentForumId) {
            router.push(`/forum/${commentForumId}?post=${commentPostId}&comment=${commentId}`)
          } else {
            Logger.warn('Missing comment navigation data')
          }
          break
        
        case 'profile':
          const profileId = metadata.profileId || shareData?.id
          Logger.info('Navigating to profile:', profileId)
          if (profileId) {
            router.push(`/profile/${profileId}`)
          } else {
            Logger.warn('No profile ID found')
          }
          break
        
        case 'organization':
        case 'org':
          const orgId = metadata.orgId || shareData?.id
          Logger.info('Navigating to org:', orgId)
          if (orgId) {
            router.push(`/org/${orgId}`)
          } else {
            Logger.warn('No org ID found')
          }
          break
        
        case 'class':
        case 'club':
          const classId = metadata.classId || shareData?.id
          Logger.info('Navigating to class:', classId)
          if (classId) {
            router.push(`/class/${classId}`)
          } else {
            Logger.warn('No class ID found')
          }
          break
        
        default:
          Logger.info('Unknown share type:', metadata.shareType)
      }
    } catch (error) {
      Logger.error('Navigation error:', error)
    }
  }

  const renderIcon = () => {
    const iconColor = theme.colors.bondedPurple

    switch (metadata.shareType) {
      case 'event':
        return <Text style={[styles.iconText, { color: iconColor }]}>📅</Text>
      case 'post':
      case 'comment':
        return <Text style={[styles.iconText, { color: iconColor }]}>💬</Text>
      case 'profile':
        return <Text style={[styles.iconText, { color: iconColor }]}>👤</Text>
      case 'organization':
      case 'org':
        return <Text style={[styles.iconText, { color: iconColor }]}>🏢</Text>
      case 'class':
      case 'club':
        return <Text style={[styles.iconText, { color: iconColor }]}>📚</Text>
      default:
        return <Text style={[styles.iconText, { color: iconColor }]}>📄</Text>
    }
  }

  const renderContent = () => {
    const shareData = metadata.shareData || {}
    const actualData = shareData.data || shareData // Handle nested structure

    switch (metadata.shareType) {
      case 'event':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {metadata.eventTitle || actualData?.title || 'Event'}
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>
                {metadata.eventLocation || actualData?.location_name || actualData?.location || 'Location'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🕐</Text>
              <Text style={styles.detailText}>
                {metadata.eventDate || actualData?.start_at ? 
                  new Date(metadata.eventDate || actualData?.start_at).toLocaleDateString() : 
                  'Date'
                }
              </Text>
            </View>
          </View>
        )
      
      case 'post':
        return (
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <Text style={styles.postTitle} numberOfLines={2}>
                {metadata.postTitle || actualData?.title || 'Post'}
              </Text>
              {actualData?.forum_name && (
                <Text style={styles.forumName}>
                  {actualData.forum_name}
                </Text>
              )}
            </View>
            
            {(metadata.postBody || actualData?.body || actualData?.content) && (
              <View style={styles.postContent}>
                <Text style={styles.postBody} numberOfLines={3}>
                  {metadata.postBody || actualData?.body || actualData?.content || ''}
                </Text>
              </View>
            )}
            
            <View style={styles.postFooter}>
              <View style={styles.postFooterLeft}>
                <Text style={styles.postIcon}>💬</Text>
                <Text style={styles.postType}>Forum Post</Text>
              </View>
              <Text style={styles.postArrow}>View →</Text>
            </View>
          </View>
        )
      
      case 'comment':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Comment</Text>
            <Text style={styles.description} numberOfLines={3}>
              {metadata.commentBody || actualData?.body || ''}
            </Text>
            {metadata.postTitle && (
              <Text style={styles.replyTo}>
                Replying to: {metadata.postTitle}
              </Text>
            )}
          </View>
        )
      
      case 'profile':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.profileRow}>
              {(metadata.profileAvatar || actualData?.avatar_url) && (
                <CachedImage source={{ uri: metadata.profileAvatar || actualData?.avatar_url }} style={styles.profileAvatar} />
              )}
              <View>
                <Text style={styles.title}>
                  {metadata.profileName || actualData?.full_name || actualData?.username || 'Profile'}
                </Text>
                {(metadata.profileMajor || actualData?.major) && (
                  <Text style={styles.detailText}>
                    {metadata.profileMajor || actualData?.major}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )
      
      case 'organization':
      case 'org':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {metadata.orgName || actualData?.name || 'Organization'}
            </Text>
            {(metadata.orgDescription || actualData?.description) && (
              <Text style={styles.description} numberOfLines={2}>
                {metadata.orgDescription || actualData?.description}
              </Text>
            )}
            <Text style={styles.typeLabel}>Organization</Text>
          </View>
        )
      
      case 'class':
      case 'club':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {metadata.className || actualData?.name || actualData?.course_name || 'Class/Club'}
            </Text>
            {(metadata.professorName || actualData?.professor_name) && (
              <Text style={styles.detailText}>
                Prof: {metadata.professorName || actualData?.professor_name}
              </Text>
            )}
            {(metadata.classDescription || actualData?.description) && (
              <Text style={styles.description} numberOfLines={2}>
                {metadata.classDescription || actualData?.description}
              </Text>
            )}
            <Text style={styles.typeLabel}>
              {metadata.shareType === 'class' ? 'Class' : 'Club'}
            </Text>
          </View>
        )
      
      default:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Shared Content</Text>
            <Text style={styles.description}>
              {actualData?.title || actualData?.name || 'Check this out!'}
            </Text>
          </View>
        )
    }
  }

  const getNavigationHref = () => {
    const shareData = metadata.shareData || {}
    const actualData = shareData.data || shareData // Handle nested structure

    switch (metadata.shareType) {
      case 'event':
        const eventId = metadata.eventId || actualData?.id
        Logger.info('Event ID lookup:', { 
          metadataEventId: metadata.eventId, 
          actualDataId: actualData?.id, 
          shareDataId: shareData?.id,
          eventId 
        })
        return eventId ? `/events/${eventId}` : null
      
      case 'post':
        const postId = metadata.postId || actualData?.id
        const forumId = metadata.forumId || actualData?.forumId || actualData?.forum_id
        Logger.info('Post ID lookup:', { postId, forumId })
        if (postId && forumId) {
          return `/forum/${forumId}?post=${postId}`
        } else if (postId) {
          return `/forum?post=${postId}`
        }
        return null
      
      case 'comment':
        const commentId = metadata.commentId || actualData?.id
        const commentPostId = metadata.postId || actualData?.postId
        const commentForumId = metadata.forumId || actualData?.forumId || actualData?.forum_id
        Logger.info('Comment ID lookup:', { commentId, commentPostId, commentForumId })
        if (commentPostId && commentForumId) {
          return `/forum/${commentForumId}?post=${commentPostId}&comment=${commentId}`
        }
        return null
      
      case 'profile':
        const profileId = metadata.profileId || actualData?.id
        Logger.info('Profile ID lookup:', { profileId })
        return profileId ? `/profile/${profileId}` : null
      
      case 'organization':
      case 'org':
        const orgId = metadata.orgId || actualData?.id
        Logger.info('Org ID lookup:', { orgId })
        return orgId ? `/org/${orgId}` : null
      
      case 'class':
      case 'club':
        const classId = metadata.classId || actualData?.id
        Logger.info('Class ID lookup:', { classId })
        return classId ? `/class/${classId}` : null
      
      default:
        Logger.info('Unknown share type:', metadata.shareType)
        return null
    }
  }

  const href = getNavigationHref()

  // If we have a valid href, use TouchableOpacity with router.push
  if (href) {
    return (
      <TouchableOpacity 
        style={styles.container} 
        activeOpacity={0.7}
        onPress={() => {
          Logger.info('Navigating to:', href)
          router.push(href)
        }}
      >
        <View style={styles.iconContainer}>
          {renderIcon()}
        </View>
        
        <View style={styles.content}>
          {renderContent()}
        </View>
        
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    )
  }

  // Fallback to TouchableOpacity if no href
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {renderIcon()}
      </View>
      
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  )

const createStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.cardBackground || theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: hp(1.2),
    marginVertical: hp(0.5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: theme.colors.bondedPurple + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2.5),
    marginTop: hp(0.5),
  },
  iconText: {
    fontSize: wp(4),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  // Enhanced post styles
  postContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  postHeader: {
    padding: hp(1.2),
    paddingBottom: hp(0.8),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  postTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.textPrimary,
    marginBottom: hp(0.4),
    lineHeight: hp(2.4),
  },
  postContent: {
    paddingHorizontal: hp(1.2),
    paddingBottom: hp(0.8),
  },
  postBody: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    lineHeight: hp(2),
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: hp(1.2),
    paddingVertical: hp(1),
    backgroundColor: theme.colors.bondedPurple + '8',
  },
  postFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postIcon: {
    fontSize: wp(4),
    marginRight: wp(1),
  },
  postType: {
    fontSize: hp(1.3),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  postArrow: {
    fontSize: hp(1.4),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  title: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.textPrimary,
    marginBottom: hp(0.2),
  },
  description: {
    fontSize: hp(1.4),
    color: theme.colors.textSecondary,
    lineHeight: hp(1.8),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.2),
  },
  detailIcon: {
    fontSize: wp(3),
    marginRight: wp(0.8),
  },
  detailText: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
  },
  forumName: {
    fontSize: hp(1.2),
    color: theme.colors.bondedPurple,
    marginTop: hp(0.2),
    fontStyle: 'italic',
  },
  replyTo: {
    fontSize: hp(1.2),
    color: theme.colors.textSecondary,
    marginTop: hp(0.2),
    fontStyle: 'italic',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    marginRight: wp(1.5),
  },
  typeLabel: {
    fontSize: hp(1.2),
    color: theme.colors.bondedPurple,
    marginTop: hp(0.2),
    fontFamily: theme.typography.fontFamily.medium,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(1.5),
  },
  arrow: {
    fontSize: hp(2),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
  },
})
