import React, { useState, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'
import AppTopBar from '../components/AppTopBar'
import BottomNav from '../components/BottomNav'
import Stories from '../components/Stories/Stories'
import StoryViewer from '../components/Stories/StoryViewer'
import StoryFlow from '../components/Stories/StoryFlow'
import EventPost from '../components/Events/EventPost'
import ShareModal from '../components/ShareModal'
import CreateEventModal from '../components/Events/CreateEventModal'
import AppCard from '../components/AppCard'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import Chip from '../components/Chip'
import ForumSwitcher from '../components/ForumSwitcher'
import ForumSelectorModal from '../components/ForumSelectorModal'
import { LinearGradient } from 'expo-linear-gradient'
import { useStoriesContext } from '../contexts/StoriesContext'
import { useEventsContext } from '../contexts/EventsContext'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

const MOCK_STORIES = Array.from({ length: 8 }).map((_, index) => ({
  id: `story-${index + 1}`,
  name: ['Dorms', 'Library', 'Quad', 'Clubs', 'Dining', 'Events', 'Study', 'Random'][index % 8],
}))

const MOCK_COMMENTS = {
  'post-1': [
    {
      id: 'comment-1-1',
      author: 'Student123',
      isAnon: false,
      body: 'The 24/7 study room in the engineering building is great! Usually pretty quiet after 8pm.',
      upvotes: 8,
      downvotes: 0,
      timeAgo: '1h',
      replies: [
        {
          id: 'reply-1-1-1',
          author: 'Anon',
          isAnon: true,
          body: 'Thanks for the tip! Will check it out.',
          upvotes: 2,
          downvotes: 0,
          timeAgo: '45m',
        },
      ],
    },
    {
      id: 'comment-1-2',
      author: 'Anon',
      isAnon: true,
      body: 'Coffee shop near the quad stays open until midnight. Good vibes but can get loud.',
      upvotes: 5,
      downvotes: 0,
      timeAgo: '45m',
      replies: [],
    },
    {
      id: 'comment-1-3',
      author: 'StudyBuddy',
      isAnon: false,
      body: 'Library basement is underrated. Super quiet and has good lighting.',
      upvotes: 12,
      downvotes: 0,
      timeAgo: '30m',
      replies: [],
    },
    {
      id: 'comment-1-4',
      author: 'Anon',
      isAnon: true,
      body: 'The new student center has private study pods you can book. Worth checking out!',
      upvotes: 3,
      downvotes: 0,
      timeAgo: '15m',
      replies: [],
    },
  ],
  'post-2': [
    {
      id: 'comment-2-1',
      author: 'CS Major',
      isAnon: false,
      body: 'Took it last semester. Focus on the practice problems from the textbook - very similar format.',
      upvotes: 15,
      downvotes: 0,
      timeAgo: '3h',
      replies: [
        {
          id: 'reply-2-1-1',
          author: 'Anon',
          isAnon: true,
          body: 'Which chapter should I focus on most?',
          upvotes: 1,
          downvotes: 0,
          timeAgo: '2h',
        },
        {
          id: 'reply-2-1-2',
          author: 'CS Major',
          isAnon: false,
          body: 'Chapters 5-7 are the most important for the midterm.',
          upvotes: 4,
          downvotes: 0,
          timeAgo: '1h',
        },
      ],
    },
    {
      id: 'comment-2-2',
      author: 'Anon',
      isAnon: true,
      body: 'The midterm is fair but time is tight. Practice writing code by hand.',
      upvotes: 9,
      downvotes: 0,
      timeAgo: '2h',
      replies: [],
    },
    {
      id: 'comment-2-3',
      author: 'DataStructures',
      isAnon: false,
      body: 'Review the linked list and tree traversal algorithms. Those always show up.',
      upvotes: 11,
      downvotes: 0,
      timeAgo: '1h',
      replies: [],
    },
  ],
  'post-3': [
    {
      id: 'comment-3-1',
      author: 'Former Student',
      isAnon: false,
      body: 'Hard but fair is accurate. Workload is heavy but you learn a lot. Worth it if you put in the effort.',
      upvotes: 7,
      downvotes: 0,
      timeAgo: '6h',
      replies: [],
    },
    {
      id: 'comment-3-2',
      author: 'Anon',
      isAnon: true,
      body: 'Expect 10-15 hours per week on assignments. Lectures are clear though.',
      upvotes: 4,
      downvotes: 0,
      timeAgo: '5h',
      replies: [],
    },
  ],
}

const POST_TITLES = [
  // Social/Casual posts
  'Anyone else see that couple making out in the library?',
  'Who else is procrastinating right now?',
  'The dining hall pizza is actually fire today',
  'Someone left their AirPods in the quad',
  'Why is everyone so quiet in the elevator?',
  'Best spot to people watch on campus?',
  'Anyone else tired of group project members who do nothing?',
  'The WiFi in my dorm is absolutely terrible',
  'Who else is surviving on coffee and ramen?',
  'Someone please tell me why tuition keeps going up',
  'Anyone else feel like they\'re faking it till they make it?',
  'The library at 2am hits different',
  'Who else is already counting down to spring break?',
  'Someone left their laundry in the dryer for 3 hours',
  'Why do professors assign work over break?',
  'Anyone else get anxiety from group chats?',
  'The person who sits next to me in class smells amazing',
  'Who else is living that broke college student life?',
  'Someone please adopt this stray cat near the dorms',
  'Why is it so hard to make friends in college?',
  'Anyone else feel like they\'re drowning in assignments?',
  'The person in front of me in line paid with change',
  'Who else is questioning their major choice?',
  'Someone left their car running in the parking lot',
  'Why do we have 8am classes?',
  'Anyone else get weird vibes from that one professor?',
  'The dining hall ran out of the good food again',
  'Who else is just trying to pass at this point?',
  'Someone please explain why textbooks cost $200',
  'Anyone else see that person fall down the stairs?',
  // School-related posts
  'Best study spots on campus?',
  'CS 201 midterm thread',
  'Prof. Nguyen for Data Structures',
  'Dorm room setup ideas?',
  'Best coffee shops near campus',
  'Looking for a study group for MATH 150',
  'Campus gym hours?',
  'Anyone know good parking spots?',
  'Rate my schedule: CS 201, ENGL 101, MATH 150',
  'Best professors for intro classes?',
  'Library vs study rooms?',
  'How to survive finals week',
  'Looking for roommates for next year',
  'Best clubs to join?',
  'Campus dining hall reviews',
  'Textbook buy/sell thread',
  'Internship opportunities?',
  'Study abroad experiences?',
  'Best time to register for classes?',
  'Campus WiFi issues?',
]

const POST_BODIES = [
  // Social/Casual bodies
  'Like get a room please',
  'I have 3 assignments due tomorrow and I\'m on here',
  'No cap, best pizza they\'ve had all semester',
  'Found them by the fountain, come get them',
  'It\'s so awkward when it\'s just you and one other person',
  'I like sitting by the main entrance and watching people',
  'Literally did all the work myself and they get the same grade',
  'Can\'t even load a YouTube video',
  'This is my diet and I\'m not ashamed',
  'Like what are we even paying for at this point?',
  'Every day I wake up and pretend I know what I\'m doing',
  'The vibes are immaculate',
  'Only 47 more days',
  'I\'m about to take them out myself',
  'We literally have ONE week off',
  'The constant notifications give me anxiety',
  'What cologne/perfume is that? Asking for a friend',
  'Ramen for breakfast, lunch, and dinner',
  'She\'s so cute but I\'m allergic',
  'It\'s been 2 months and I still eat alone',
  'I have 5 papers due this week send help',
  'I felt so bad for them',
  'Is it too late to switch?',
  'It\'s been running for 20 minutes now',
  'Who decided this was a good idea?',
  'Something\'s off about them',
  'They always run out right when I get there',
  'Cs get degrees right?',
  'I could buy a whole laptop for that',
  'I hope they\'re okay',
  // School-related bodies
  'Looking for quiet places that stay open late. Any recommendations besides the main library?',
  'How is everyone feeling about the midterm next week? Any tips from people who took it last semester?',
  'Thinking of taking Nguyen for Data Structures. Hard but fair? How heavy is the workload?',
  'Moving into the dorms next week. Any tips for making the space feel like home?',
  'Need caffeine but tired of Starbucks. What are the best local spots?',
  'Struggling with calculus. Anyone want to form a study group?',
  'What are the gym hours? Is it usually crowded?',
  'Commuting to campus and parking is a nightmare. Any secret spots?',
  'Is this schedule too heavy? Looking for honest opinions.',
  'Taking intro classes next semester. Who should I avoid?',
]

const FORUMS = ['Quad', 'Classes', 'RMP', 'Campus Life', 'Dorms', 'Library', 'Clubs', 'Random']
const AUTHORS = ['Anon', 'CS 201', 'Rate My Professor', 'Student123', 'StudyBuddy', 'CS Major', 'DataStructures', 'Former Student']

// Mock Forums Data
const MOCK_FORUMS = [
  // Main Forum (Pinned)
  {
    id: 'forum-quad',
    name: 'Main Forum',
    type: 'main',
    description: 'Campus-wide discussions',
    memberCount: 12450,
    postCount: 1245,
    unreadCount: 0,
    isPinned: true,
    code: null,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
  },
  // Classes
  {
    id: 'forum-cs-201',
    name: 'CS 201 - Data Structures',
    type: 'class',
    description: 'Professor: Dr. Smith',
    memberCount: 234,
    postCount: 45,
    unreadCount: 3,
    isPinned: false,
    code: 'CS 201',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
  },
  {
    id: 'forum-engl-101',
    name: 'ENGL 101 - Writing',
    type: 'class',
    description: 'Professor: Dr. Johnson',
    memberCount: 189,
    postCount: 28,
    unreadCount: 1,
    isPinned: false,
    code: 'ENGL 101',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
  },
  {
    id: 'forum-math-150',
    name: 'MATH 150 - Calc I',
    type: 'class',
    description: 'Professor: Dr. Williams',
    memberCount: 312,
    postCount: 67,
    unreadCount: 0,
    isPinned: false,
    code: 'MATH 150',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
  },
  // Organizations
  {
    id: 'forum-cs-club',
    name: 'Computer Science Club',
    type: 'org',
    description: 'Tech talks, hackathons, and networking',
    memberCount: 145,
    postCount: 89,
    unreadCount: 5,
    isPinned: false,
    code: null,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
  },
  {
    id: 'forum-basketball',
    name: 'Basketball Team',
    type: 'org',
    description: 'Team updates and events',
    memberCount: 12,
    postCount: 23,
    unreadCount: 2,
    isPinned: false,
    code: null,
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
  },
  // Private Forums
  {
    id: 'forum-roommates',
    name: 'Roommates',
    type: 'private',
    description: 'Private group chat',
    memberCount: 4,
    postCount: 12,
    unreadCount: 0,
    isPinned: false,
    code: null,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
  },
  {
    id: 'forum-study-group',
    name: 'Study Group CS 201',
    type: 'private',
    description: 'Study sessions and notes',
    memberCount: 8,
    postCount: 34,
    unreadCount: 1,
    isPinned: false,
    code: null,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
  },
]

const MOCK_POSTS = Array.from({ length: 60 }).map((_, index) => ({
  id: `post-${index + 1}`,
  author: AUTHORS[index % AUTHORS.length],
  isAnon: index % 3 === 0,
  title: POST_TITLES[index % POST_TITLES.length],
  body: POST_BODIES[index % POST_BODIES.length],
  forum: FORUMS[index % FORUMS.length],
  upvotes: Math.floor(Math.random() * 100) + 5,
  commentsCount: Math.floor(Math.random() * 50) + 2,
  timeAgo: `${Math.floor(Math.random() * 24)}h`,
  ...(index % 5 === 0 && {
    media: [
      {
        uri: `https://images.pexels.com/photos/${140945 + index}/pexels-photo-${140945 + index}.jpeg?auto=compress&cs=tinysrgb&w=800`,
        type: 'image',
      },
    ],
  }),
}))

export default function Forum() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [posts, setPosts] = useState(MOCK_POSTS)
  const [activePost, setActivePost] = useState(null)
  const [activeAuthorPost, setActiveAuthorPost] = useState(null)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isCreateEventModalVisible, setIsCreateEventModalVisible] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftIsAnon, setDraftIsAnon] = useState(true)
  const [draftMedia, setDraftMedia] = useState([])
  const [currentSchool, setCurrentSchool] = useState(params.schoolName || 'University of Rhode Island')
  const [currentForum, setCurrentForum] = useState(MOCK_FORUMS[0]) // Start with Main Forum
  const [filter, setFilter] = useState('posts') // 'all', 'posts', 'events'
  const [isForumSelectorVisible, setIsForumSelectorVisible] = useState(false)
  
  // Story state
  const [isStoryFlowVisible, setIsStoryFlowVisible] = useState(false)
  const [isStoryViewerVisible, setIsStoryViewerVisible] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
  const [viewerStories, setViewerStories] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareContent, setShareContent] = useState(null)
  
  const { getForumStories } = useStoriesContext()
  const { getForumEventPosts } = useEventsContext()
  
  // Mock current user - replace with real auth
  const currentUser = {
    id: 'user-123',
    name: 'John Doe',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  }
  
  const currentForumId = currentForum?.id || 'forum-quad'
  
  // Get event posts for this forum
  const eventPosts = getForumEventPosts(currentForumId)
  
  // Filter and merge posts for current forum
  const allPosts = useMemo(() => {
    // Filter regular posts by current forum
    const forumPosts = posts.filter((post) => {
      // If forum property exists, match it
      if (post.forum) {
        // Map forum names to forum IDs
        const forumMap = {
          'Quad': 'forum-quad',
          'Classes': 'forum-cs-201', // Default class forum
          'RMP': 'forum-quad',
          'Campus Life': 'forum-quad',
          'Dorms': 'forum-quad',
          'Library': 'forum-quad',
          'Clubs': 'forum-cs-club',
          'Random': 'forum-quad',
        }
        return forumMap[post.forum] === currentForumId || currentForumId === 'forum-quad'
      }
      // Default: show in main forum
      return currentForumId === 'forum-quad'
    })
    
    const regularPosts = forumPosts.map((post) => ({
      ...post,
      type: 'post',
      sortDate: new Date(post.createdAt || Date.now()),
    }))
    
    const eventPostsWithType = eventPosts.map((eventPost) => ({
      ...eventPost,
      type: 'event',
      sortDate: new Date(eventPost.event?.startDate || Date.now()),
    }))
    
    const merged = [...regularPosts, ...eventPostsWithType]
    const sorted = merged.sort((a, b) => b.sortDate - a.sortDate)
    
    // Apply filter
    if (filter === 'posts') {
      return sorted.filter((item) => item.type === 'post')
    } else if (filter === 'events') {
      return sorted.filter((item) => item.type === 'event')
    }
    return sorted
  }, [posts, eventPosts, filter, currentForumId])
  
  // Update school if params change
  React.useEffect(() => {
    if (params.schoolName) {
      setCurrentSchool(params.schoolName)
    }
  }, [params.schoolName])
  const [isFavorited, setIsFavorited] = useState(false)
  const [comments, setComments] = useState(MOCK_COMMENTS)
  const [newCommentText, setNewCommentText] = useState('')
  const [newCommentIsAnon, setNewCommentIsAnon] = useState(true)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyIsAnon, setReplyIsAnon] = useState(true)
  const [userVotes, setUserVotes] = useState({}) // Track user votes: { 'comment-id': 'up' | 'down' | null }
  const scrollY = useRef(new Animated.Value(0)).current
  const lastScrollY = useRef(0)
  const headerTranslateY = useRef(new Animated.Value(0)).current
  const isAnimating = useRef(false)

  const handlePickMedia = async (kind) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          kind === 'image'
            ? ImagePicker.MediaType.Image
            : ImagePicker.MediaType.Video,
        allowsEditing: false,
        quality: 0.7,
      })

      if (result.canceled) return

      const asset = result.assets?.[0]
      if (!asset) return

      setDraftMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          type: kind,
        },
      ])
    } catch (error) {
      console.log('Media pick error', error)
    }
  }

  const handleCreateStory = () => {
    setIsStoryFlowVisible(true)
  }

  const handleViewStory = (storyGroup) => {
    // Get all story groups for this forum
    const rawStories = getForumStories(currentForumId)
    const groupedStories = {}
    rawStories.forEach((story) => {
      if (!groupedStories[story.userId]) {
        groupedStories[story.userId] = {
          id: story.userId,
          userId: story.userId,
          name: story.userName,
          thumbnail: story.userAvatar,
          forumId: currentForumId,
          segments: [],
        }
      }
      groupedStories[story.userId].segments.push(story)
    })
    const stories = Object.values(groupedStories)
    const index = stories.findIndex((s) => s.id === storyGroup.id)

    setViewerStories(stories)
    setSelectedStoryIndex(index >= 0 ? index : 0)
    setIsStoryViewerVisible(true)
  }

  const renderStory = (story, isFirst) => {
    if (isFirst) {
      return (
        <TouchableOpacity
          key="add-story"
          style={styles.storyItem}
          activeOpacity={0.8}
        >
          <View style={[styles.storyAvatar, styles.storyAddAvatar]}>
            <Ionicons
              name="add"
              size={hp(3)}
              color={theme.colors.bondedPurple}
            />
          </View>
          <Text style={styles.storyLabel}>New</Text>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        key={story.id}
        style={styles.storyItem}
        activeOpacity={0.8}
      >
        <View style={styles.storyAvatar}>
          <Text style={styles.storyAvatarText}>
            {story.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.storyLabel}>
          {story.name}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderPost = ({ item }) => {
    // Render event post differently
    if (item.type === 'event' && item.event) {
      return <EventPost event={item.event} forumId={currentForumId} />
    }

    // Regular post
    return (
      <AppCard style={styles.postCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setActivePost(item)}
        >
          {/* Header */}
          <View style={styles.postHeader}>
      <TouchableOpacity
        style={styles.postAuthorRow}
        activeOpacity={0.8}
        onPress={() => setActiveAuthorPost(item)}
      >
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>
            {item.isAnon ? '?' : item.author.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>
            {item.isAnon ? 'Anonymous' : item.author}
          </Text>
          <Text style={styles.postMetaText}>
            {item.forum} • {item.timeAgo}
          </Text>
        </View>
      </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons
            name="ellipsis-horizontal"
            size={hp(2.4)}
            color={theme.colors.softBlack}
          />
        </TouchableOpacity>
      </View>

        {/* Content */}
        <View style={styles.postBody}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text numberOfLines={3} style={styles.postBodyText}>
            {item.body}
          </Text>

          {item.media && item.media.length > 0 && (
            <View style={styles.postMediaPreview}>
              {item.media[0].type === 'image' ? (
                <Image
                  source={{ uri: item.media[0].uri }}
                  style={styles.postMediaImage}
                />
              ) : (
                <View style={styles.postMediaVideo}>
                  <Ionicons
                    name="play-circle"
                    size={hp(4)}
                    color={theme.colors.white}
                  />
                  <Text style={styles.postMediaVideoText}>Video</Text>
                </View>
              )}
            </View>
          )}
        </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.postActionsRow}>
        <View style={styles.postVotesRow}>
          <TouchableOpacity
            style={styles.voteButton}
            activeOpacity={0.7}
            onPress={() =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === item.id ? { ...p, upvotes: p.upvotes + 1 } : p
                )
              )
            }
          >
            <Ionicons
              name="arrow-up-circle-outline"
              size={hp(2.8)}
              color={item.upvotes > 0 ? '#2ecc71' : theme.colors.softBlack}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.postVoteCount,
              item.upvotes > 0 && styles.postVotePositive,
              item.upvotes < 0 && styles.postVoteNegative,
            ]}
          >
            {item.upvotes}
          </Text>
          <TouchableOpacity
            style={styles.voteButton}
            activeOpacity={0.7}
            onPress={() =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === item.id ? { ...p, upvotes: p.upvotes - 1 } : p
                )
              )
            }
          >
            <Ionicons
              name="arrow-down-circle-outline"
              size={hp(2.8)}
              color={item.upvotes < 0 ? '#e74c3c' : theme.colors.softBlack}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.postCommentsButton}
          activeOpacity={0.7}
          onPress={() => setActivePost(item)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={hp(2.2)}
            color={theme.colors.softBlack}
          />
          <Text style={styles.postCommentsText}>
            {item.commentsCount} comments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postShareButton}
          activeOpacity={0.7}
          onPress={() => {
            setShareContent({
              type: 'post',
              data: item,
            })
            setShowShareModal(true)
          }}
        >
          <Ionicons
            name="share-outline"
            size={hp(2.2)}
            color={theme.colors.softBlack}
          />
        </TouchableOpacity>
        </View>
      </AppCard>
    )
  }

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y
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

        if (currentScrollY <= 0) {
          // At the very top - always show
          isAnimating.current = true
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false
          })
        } else if (scrollDifference > 0) {
          // Scrolling down - hide header
          isAnimating.current = true
          Animated.timing(headerTranslateY, {
            toValue: -350,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false
          })
        } else if (scrollDifference < 0) {
          // Scrolling up - show header
          isAnimating.current = true
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false
          })
        }

        lastScrollY.current = currentScrollY
      },
    }
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Animated.View
          style={{
            transform: [{ translateY: headerTranslateY }],
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: theme.colors.white,
            paddingHorizontal: wp(4),
          }}
        >
          {/* Custom Header with Forum Switcher */}
          <View style={styles.customHeader}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/profile')}
              activeOpacity={0.6}
            >
              <Ionicons
                name="person-circle-outline"
                size={hp(2.8)}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <ForumSwitcher
                currentForum={currentForum}
                onPress={() => setIsForumSelectorVisible(true)}
                unreadCount={MOCK_FORUMS.reduce((sum, f) => sum + f.unreadCount, 0)}
              />
            </View>
            
            <View style={styles.headerButton} />
          </View>

          {/* Removed forum title - cleaner look */}

          {/* Create post/event buttons */}
          <View style={styles.createPostRowContainer}>
            <View style={styles.createPostRow}>
              <PrimaryButton
                label="New Post"
                icon="create-outline"
                onPress={() => setIsCreateModalVisible(true)}
                style={styles.createButton}
              />
              <SecondaryButton
                label="Create Event"
                icon="calendar-outline"
                onPress={() => setIsCreateEventModalVisible(true)}
                style={styles.createButton}
              />
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            <Chip
              label="All"
              active={filter === 'all'}
              onPress={() => setFilter('all')}
              style={styles.filterChip}
            />
            <Chip
              label="Posts"
              active={filter === 'posts'}
              onPress={() => setFilter('posts')}
              style={styles.filterChip}
            />
            <Chip
              label="Events"
              active={filter === 'events'}
              onPress={() => setFilter('events')}
              style={styles.filterChip}
            />
          </View>

          {/* Stories row with purple gradient background */}
          <View style={styles.storiesWrapper}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.08)', 'transparent']}
              style={styles.storiesGradient}
            >
              <Stories
                forumId={currentForumId}
                onCreateStory={handleCreateStory}
                onViewStory={handleViewStory}
                currentUserId={currentUser.id}
              />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Posts list */}
        <AnimatedFlatList
          data={allPosts}
          keyExtractor={(item) => item.id || item.event?.id}
          contentContainerStyle={styles.postsList}
          showsVerticalScrollIndicator={false}
          renderItem={renderPost}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />

        {/* Post / Comments Modal Shell */}
        <Modal
          visible={!!activePost}
          transparent
          animationType="slide"
          onRequestClose={() => setActivePost(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setActivePost(null)}
          >
            <Pressable
              style={styles.postModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              {activePost && (
                <>
                  <View style={styles.postModalHeader}>
                    <Text style={styles.postModalTitle}>{activePost.title}</Text>
                    <TouchableOpacity
                      onPress={() => setActivePost(null)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons
                        name="close"
                        size={hp(2.6)}
                        color={theme.colors.charcoal}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.postModalMeta}>
                    {activePost.isAnon ? 'Anonymous' : activePost.author} •{' '}
                    {activePost.forum} • {activePost.timeAgo}
                  </Text>

                  <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                  >
                    <ScrollView
                      style={styles.postModalBody}
                      contentContainerStyle={styles.postModalBodyContent}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                      scrollEnabled={true}
                      bounces={true}
                      keyboardDismissMode="interactive"
                    >
                      <Text style={styles.postModalBodyText}>
                        {activePost.body}
                      </Text>

                      <View style={styles.commentsHeader}>
                        <Text style={styles.commentsTitle}>Comments</Text>
                        <Text style={styles.commentsCount}>
                          {activePost.commentsCount} total
                        </Text>
                      </View>

                      {/* Comments list */}
                      {comments[activePost.id] && comments[activePost.id].length > 0 ? (
                        <View style={styles.commentsList}>
                          {comments[activePost.id].map((comment) => (
                            <View key={comment.id} style={styles.commentCard}>
                            <View style={styles.commentHeader}>
                              <View style={styles.commentAuthorRow}>
                                <View style={styles.commentAvatar}>
                                  <Text style={styles.commentAvatarText}>
                                    {comment.isAnon ? '?' : comment.author.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.commentAuthorInfo}>
                                  <Text style={styles.commentAuthorName}>
                                    {comment.isAnon ? 'Anonymous' : comment.author}
                                  </Text>
                                  <Text style={styles.commentMetaText}>
                                    {comment.timeAgo}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <Text style={styles.commentBody}>{comment.body}</Text>
                            <View style={styles.commentActions}>
                              <View style={styles.commentVotesRow}>
                                <TouchableOpacity
                                  style={styles.commentVoteButton}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    const currentVote = userVotes[comment.id]
                                    const newVote = currentVote === 'up' ? null : 'up'
                                    setUserVotes((prev) => ({ ...prev, [comment.id]: newVote }))
                                    setComments((prev) => ({
                                      ...prev,
                                      [activePost.id]: prev[activePost.id].map((c) => {
                                        if (c.id !== comment.id) return c
                                        let newUpvotes = c.upvotes
                                        let newDownvotes = c.downvotes
                                        if (currentVote === 'up') {
                                          newUpvotes = Math.max(0, newUpvotes - 1)
                                        } else if (currentVote === 'down') {
                                          newDownvotes = Math.max(0, newDownvotes - 1)
                                          newUpvotes += 1
                                        } else {
                                          newUpvotes += 1
                                        }
                                        return { ...c, upvotes: newUpvotes, downvotes: newDownvotes }
                                      }),
                                    }))
                                  }}
                                >
                                  <Ionicons
                                    name="arrow-up-circle-outline"
                                    size={hp(2.2)}
                                    color={userVotes[comment.id] === 'up' ? '#2ecc71' : theme.colors.softBlack}
                                  />
                                </TouchableOpacity>
                                <Text
                                  style={[
                                    styles.commentVoteCount,
                                    (comment.upvotes - comment.downvotes) > 0 && styles.commentVotePositive,
                                    (comment.upvotes - comment.downvotes) < 0 && styles.commentVoteNegative,
                                  ]}
                                >
                                  {comment.upvotes - comment.downvotes}
                                </Text>
                                <TouchableOpacity
                                  style={styles.commentVoteButton}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    const currentVote = userVotes[comment.id]
                                    const newVote = currentVote === 'down' ? null : 'down'
                                    setUserVotes((prev) => ({ ...prev, [comment.id]: newVote }))
                                    setComments((prev) => ({
                                      ...prev,
                                      [activePost.id]: prev[activePost.id].map((c) => {
                                        if (c.id !== comment.id) return c
                                        let newUpvotes = c.upvotes
                                        let newDownvotes = c.downvotes
                                        if (currentVote === 'down') {
                                          newDownvotes = Math.max(0, newDownvotes - 1)
                                        } else if (currentVote === 'up') {
                                          newUpvotes = Math.max(0, newUpvotes - 1)
                                          newDownvotes += 1
                                        } else {
                                          newDownvotes += 1
                                        }
                                        return { ...c, upvotes: newUpvotes, downvotes: newDownvotes }
                                      }),
                                    }))
                                  }}
                                >
                                  <Ionicons
                                    name="arrow-down-circle-outline"
                                    size={hp(2.2)}
                                    color={userVotes[comment.id] === 'down' ? '#e74c3c' : theme.colors.softBlack}
                                  />
                                </TouchableOpacity>
                              </View>
                              <TouchableOpacity
                                style={styles.replyButton}
                                activeOpacity={0.7}
                                onPress={() => setReplyingTo(comment.id)}
                              >
                                <Ionicons
                                  name="return-down-forward-outline"
                                  size={hp(1.8)}
                                  color={theme.colors.softBlack}
                                  style={{ marginRight: wp(1) }}
                                />
                                <Text style={styles.replyButtonText}>Reply</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <View style={styles.repliesContainer}>
                                {comment.replies.map((reply) => (
                                  <View key={reply.id} style={styles.replyCard}>
                                    <View style={styles.replyHeader}>
                                      <View style={styles.replyAuthorRow}>
                                        <View style={styles.replyAvatar}>
                                          <Text style={styles.replyAvatarText}>
                                            {reply.isAnon ? '?' : reply.author.charAt(0).toUpperCase()}
                                          </Text>
                                        </View>
                                        <View style={styles.replyAuthorInfo}>
                                          <Text style={styles.replyAuthorName}>
                                            {reply.isAnon ? 'Anonymous' : reply.author}
                                          </Text>
                                          <Text style={styles.replyMetaText}>
                                            {reply.timeAgo}
                                          </Text>
                                        </View>
                                      </View>
                                    </View>
                                    <Text style={styles.replyBody}>{reply.body}</Text>
                                    <View style={styles.replyActions}>
                                      <View style={styles.commentVotesRow}>
                                        <TouchableOpacity
                                          style={styles.commentVoteButton}
                                          activeOpacity={0.7}
                                          onPress={() => {
                                            const replyVoteKey = `${comment.id}-${reply.id}`
                                            const currentVote = userVotes[replyVoteKey]
                                            const newVote = currentVote === 'up' ? null : 'up'
                                            setUserVotes((prev) => ({ ...prev, [replyVoteKey]: newVote }))
                                            setComments((prev) => ({
                                              ...prev,
                                              [activePost.id]: prev[activePost.id].map((c) => {
                                                if (c.id !== comment.id) return c
                                                return {
                                                  ...c,
                                                  replies: c.replies.map((r) => {
                                                    if (r.id !== reply.id) return r
                                                    let newUpvotes = r.upvotes
                                                    let newDownvotes = r.downvotes
                                                    if (currentVote === 'up') {
                                                      newUpvotes = Math.max(0, newUpvotes - 1)
                                                    } else if (currentVote === 'down') {
                                                      newDownvotes = Math.max(0, newDownvotes - 1)
                                                      newUpvotes += 1
                                                    } else {
                                                      newUpvotes += 1
                                                    }
                                                    return { ...r, upvotes: newUpvotes, downvotes: newDownvotes }
                                                  }),
                                                }
                                              }),
                                            }))
                                          }}
                                        >
                                          <Ionicons
                                            name="arrow-up-circle-outline"
                                            size={hp(1.8)}
                                            color={userVotes[`${comment.id}-${reply.id}`] === 'up' ? '#2ecc71' : theme.colors.softBlack}
                                          />
                                        </TouchableOpacity>
                                        <Text
                                          style={[
                                            styles.commentVoteCount,
                                            { fontSize: hp(1.4) },
                                            (reply.upvotes - reply.downvotes) > 0 && styles.commentVotePositive,
                                            (reply.upvotes - reply.downvotes) < 0 && styles.commentVoteNegative,
                                          ]}
                                        >
                                          {reply.upvotes - reply.downvotes}
                                        </Text>
                                        <TouchableOpacity
                                          style={styles.commentVoteButton}
                                          activeOpacity={0.7}
                                          onPress={() => {
                                            const replyVoteKey = `${comment.id}-${reply.id}`
                                            const currentVote = userVotes[replyVoteKey]
                                            const newVote = currentVote === 'down' ? null : 'down'
                                            setUserVotes((prev) => ({ ...prev, [replyVoteKey]: newVote }))
                                            setComments((prev) => ({
                                              ...prev,
                                              [activePost.id]: prev[activePost.id].map((c) => {
                                                if (c.id !== comment.id) return c
                                                return {
                                                  ...c,
                                                  replies: c.replies.map((r) => {
                                                    if (r.id !== reply.id) return r
                                                    let newUpvotes = r.upvotes
                                                    let newDownvotes = r.downvotes
                                                    if (currentVote === 'down') {
                                                      newDownvotes = Math.max(0, newDownvotes - 1)
                                                    } else if (currentVote === 'up') {
                                                      newUpvotes = Math.max(0, newUpvotes - 1)
                                                      newDownvotes += 1
                                                    } else {
                                                      newDownvotes += 1
                                                    }
                                                    return { ...r, upvotes: newUpvotes, downvotes: newDownvotes }
                                                  }),
                                                }
                                              }),
                                            }))
                                          }}
                                        >
                                          <Ionicons
                                            name="arrow-down-circle-outline"
                                            size={hp(1.8)}
                                            color={userVotes[`${comment.id}-${reply.id}`] === 'down' ? '#e74c3c' : theme.colors.softBlack}
                                          />
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Reply input */}
                            {replyingTo === comment.id && (
                              <View style={styles.replyInputContainer}>
                                <TextInput
                                  style={styles.replyInput}
                                  placeholder="Write a reply..."
                                  placeholderTextColor={theme.colors.softBlack}
                                  value={replyText}
                                  onChangeText={setReplyText}
                                  multiline
                                />
                                <View style={styles.replyInputActions}>
                                  <TouchableOpacity
                                    style={[
                                      styles.anonPillSmall,
                                      replyIsAnon && styles.anonPillActiveSmall,
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => setReplyIsAnon((prev) => !prev)}
                                  >
                                    <Ionicons
                                      name={replyIsAnon ? 'eye-off-outline' : 'person-outline'}
                                      size={hp(1.6)}
                                      color={replyIsAnon ? theme.colors.white : theme.colors.bondedPurple}
                                      style={{ marginRight: wp(1) }}
                                    />
                                    <Text
                                      style={[
                                        styles.anonPillTextSmall,
                                        replyIsAnon && { color: theme.colors.white },
                                      ]}
                                    >
                                      {replyIsAnon ? 'Anon' : 'Name'}
                                    </Text>
                                  </TouchableOpacity>
                                  <View style={styles.replyInputButtons}>
                                    <TouchableOpacity
                                      style={styles.replyCancelButton}
                                      activeOpacity={0.8}
                                      onPress={() => {
                                        setReplyingTo(null)
                                        setReplyText('')
                                        setReplyIsAnon(true)
                                      }}
                                    >
                                      <Text style={styles.replyCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[
                                        styles.replySubmitButton,
                                        !replyText.trim() && styles.replySubmitButtonDisabled,
                                      ]}
                                      activeOpacity={0.8}
                                      onPress={() => {
                                        if (!replyText.trim()) return
                                        const newReply = {
                                          id: `reply-${comment.id}-${Date.now()}`,
                                          author: replyIsAnon ? 'Anon' : 'You',
                                          isAnon: replyIsAnon,
                                          body: replyText.trim(),
                                          upvotes: 0,
                                          downvotes: 0,
                                          timeAgo: 'now',
                                        }
                                        setComments((prev) => ({
                                          ...prev,
                                          [activePost.id]: prev[activePost.id].map((c) =>
                                            c.id === comment.id
                                              ? { ...c, replies: [...(c.replies || []), newReply] }
                                              : c
                                          ),
                                        }))
                                        setReplyingTo(null)
                                        setReplyText('')
                                        setReplyIsAnon(true)
                                      }}
                                    >
                                      <Text style={styles.replySubmitText}>Reply</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>
                            )}
                          </View>
                            ))}
                          </View>
                        ) : (
                          <View style={styles.emptyCommentsBox}>
                            <Text style={styles.emptyCommentsText}>
                              No comments yet. Be the first to comment!
                            </Text>
                          </View>
                        )}
                    </ScrollView>

                    {/* New comment input - Fixed at bottom */}
                    <View style={styles.newCommentContainer}>
                    <TextInput
                      style={styles.newCommentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor={theme.colors.softBlack}
                      value={newCommentText}
                      onChangeText={setNewCommentText}
                      multiline
                    />
                    <View style={styles.newCommentActions}>
                      <TouchableOpacity
                        style={[
                          styles.anonPillSmall,
                          newCommentIsAnon && styles.anonPillActiveSmall,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setNewCommentIsAnon((prev) => !prev)}
                      >
                        <Ionicons
                          name={newCommentIsAnon ? 'eye-off-outline' : 'person-outline'}
                          size={hp(1.6)}
                          color={newCommentIsAnon ? theme.colors.white : theme.colors.bondedPurple}
                          style={{ marginRight: wp(1) }}
                        />
                        <Text
                          style={[
                            styles.anonPillTextSmall,
                            newCommentIsAnon && { color: theme.colors.white },
                          ]}
                        >
                          {newCommentIsAnon ? 'Anon' : 'Name'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.commentSubmitButton,
                          !newCommentText.trim() && styles.commentSubmitButtonDisabled,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (!newCommentText.trim()) return
                          const newComment = {
                            id: `comment-${activePost.id}-${Date.now()}`,
                            author: newCommentIsAnon ? 'Anon' : 'You',
                            isAnon: newCommentIsAnon,
                            body: newCommentText.trim(),
                            upvotes: 0,
                            downvotes: 0,
                            timeAgo: 'now',
                            replies: [],
                          }
                          setComments((prev) => ({
                            ...prev,
                            [activePost.id]: [...(prev[activePost.id] || []), newComment],
                          }))
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === activePost.id
                                ? { ...p, commentsCount: p.commentsCount + 1 }
                                : p
                            )
                          )
                          setNewCommentText('')
                          setNewCommentIsAnon(true)
                          Keyboard.dismiss()
                        }}
                      >
                        <Text style={styles.commentSubmitText}>Post</Text>
                      </TouchableOpacity>
                    </View>
                    </View>
                  </KeyboardAvoidingView>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Author Profile Modal */}
        <Modal
          visible={!!activeAuthorPost}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveAuthorPost(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setActiveAuthorPost(null)}
          >
            <Pressable
              style={styles.profileModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              {activeAuthorPost && (
                <>
                  <View style={styles.profileModalHeader}>
                    <View style={styles.profileModalHeaderText}>
                      <Text style={styles.profileName}>
                        {activeAuthorPost.isAnon
                          ? 'Anonymous'
                          : activeAuthorPost.author}
                      </Text>
                      <Text style={styles.profileSubText}>
                        {activeAuthorPost.forum} • {activeAuthorPost.timeAgo}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveAuthorPost(null)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons
                        name="close"
                        size={hp(2.6)}
                        color={theme.colors.charcoal}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.profileBody}>
                    <View style={styles.profileAvatarLarge}>
                      <Text style={styles.profileAvatarLargeText}>
                        {activeAuthorPost.isAnon
                          ? '?'
                          : activeAuthorPost.author.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.profileMetaRow}>
                      <View style={styles.profileMetaPill}>
                        <Ionicons
                          name="chatbubble-outline"
                          size={hp(1.8)}
                          color={theme.colors.bondedPurple}
                          style={{ marginRight: wp(1) }}
                        />
                        <Text style={styles.profileMetaPillText}>
                          {activeAuthorPost.upvotes} karma
                        </Text>
                      </View>
                    </View>

                    <View style={styles.profileSection}>
                      <Text style={styles.profileSectionLabel}>Recent post</Text>
                      <Text style={styles.profileQuote}>
                        {activeAuthorPost.title}
                      </Text>
                    </View>

                    <View style={styles.profileActions}>
                      <TouchableOpacity
                        style={[
                          styles.profileButton,
                          styles.profilePrimaryButton,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="person-add-outline"
                          size={hp(2)}
                          color={theme.colors.white}
                          style={{ marginRight: wp(1.5) }}
                        />
                        <Text style={styles.profilePrimaryText}>Connect</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* New Post Modal */}
        <Modal
          visible={isCreateModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsCreateModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsCreateModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.postModalContent}>
                <View style={styles.postModalHeader}>
                  <TouchableOpacity
                    onPress={() => setIsCreateModalVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.composeCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      if (!draftBody.trim() && !draftTitle.trim()) {
                        setIsCreateModalVisible(false)
                        return
                      }

                      const newPost = {
                        id: `post-${Date.now()}`,
                        author: draftIsAnon ? 'Anon' : 'You',
                        isAnon: draftIsAnon,
                        title: draftTitle.trim() || 'Untitled post',
                        body:
                          draftBody.trim() ||
                          'Started a new thread. Details coming soon.',
                        forum: 'Main Forum',
                        upvotes: 0,
                        commentsCount: 0,
                        timeAgo: 'now',
                        media: draftMedia,
                      }

                      setPosts((prev) => [newPost, ...prev])
                      setDraftTitle('')
                      setDraftBody('')
                      setDraftIsAnon(true)
                      setDraftMedia([])
                      setIsCreateModalVisible(false)
                    }}
                    style={styles.composePostButton}
                  >
                    <Text style={styles.composePostButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.composeBody}>
                  <TextInput
                    value={draftTitle}
                    onChangeText={setDraftTitle}
                    placeholder="Post title (optional)"
                    placeholderTextColor={theme.colors.softBlack}
                    style={styles.composeTitleInput}
                  />
                  <TextInput
                    value={draftBody}
                    onChangeText={setDraftBody}
                    placeholder="What's happening on campus?"
                    placeholderTextColor={theme.colors.softBlack}
                    style={styles.composeInput}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.composeToolbar}>
                  <View style={styles.mediaRow}>
                    <TouchableOpacity
                      style={styles.mediaButton}
                      activeOpacity={0.8}
                      onPress={() => handlePickMedia('image')}
                    >
                      <Ionicons
                        name="image-outline"
                        size={hp(2.2)}
                        color={theme.colors.bondedPurple}
                        style={{ marginRight: wp(1.2) }}
                      />
                      <Text style={styles.mediaButtonText}>Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.mediaButton}
                      activeOpacity={0.8}
                      onPress={() => handlePickMedia('video')}
                    >
                      <Ionicons
                        name="videocam-outline"
                        size={hp(2.2)}
                        color={theme.colors.bondedPurple}
                        style={{ marginRight: wp(1.2) }}
                      />
                      <Text style={styles.mediaButtonText}>Video</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.mediaButton,
                      draftIsAnon ? styles.anonPillActive : styles.anonPill,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setDraftIsAnon((prev) => !prev)}
                  >
                    <Ionicons
                      name={draftIsAnon ? 'eye-off-outline' : 'person-outline'}
                      size={hp(2)}
                      color={
                        draftIsAnon
                          ? theme.colors.white
                          : theme.colors.bondedPurple
                      }
                      style={{ marginRight: wp(1.2) }}
                    />
                    <Text
                      style={[
                        styles.mediaButtonText,
                        draftIsAnon && { color: theme.colors.white },
                      ]}
                    >
                      {draftIsAnon ? 'Anon' : 'With name'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {draftMedia.length > 0 && (
                  <View style={styles.mediaAttachedRow}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {draftMedia.map((asset, index) => (
                        <View
                          key={`${asset.uri}-${index}`}
                          style={styles.draftMediaItem}
                        >
                          {asset.type === 'image' ? (
                            <Image
                              source={{ uri: asset.uri }}
                              style={styles.draftMediaImage}
                            />
                          ) : (
                            <View style={styles.draftMediaVideo}>
                              <Ionicons
                                name="videocam-outline"
                                size={hp(2.5)}
                                color={theme.colors.white}
                              />
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.draftMediaRemove}
                            activeOpacity={0.8}
                            onPress={() => {
                              setDraftMedia((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }}
                          >
                            <Ionicons
                              name="close-circle"
                              size={hp(2.2)}
                              color={theme.colors.charcoal}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </Pressable>
        </Modal>

        {/* Story Flow (Create/Edit/Preview) */}
        <StoryFlow
          visible={isStoryFlowVisible}
          forumId={currentForumId}
          forumName={currentForum}
          userId={currentUser.id}
          userName={currentUser.name}
          userAvatar={currentUser.avatar}
          onClose={() => setIsStoryFlowVisible(false)}
        />

        {/* Story Viewer */}
        <StoryViewer
          visible={isStoryViewerVisible}
          stories={viewerStories}
          initialIndex={selectedStoryIndex}
          currentUserId={currentUser.id}
          onClose={() => setIsStoryViewerVisible(false)}
        />

        {/* Share Modal */}
        <ShareModal
          visible={showShareModal}
          content={shareContent}
          onClose={() => {
            setShowShareModal(false)
            setShareContent(null)
          }}
        />

        <CreateEventModal
          visible={isCreateEventModalVisible}
          onClose={() => setIsCreateEventModalVisible(false)}
          forumId={currentForumId}
        />

        <BottomNav scrollY={scrollY} />

        {/* Forum Selector Modal */}
        <ForumSelectorModal
          visible={isForumSelectorVisible}
          forums={MOCK_FORUMS}
          currentForumId={currentForumId}
          onSelectForum={(forum) => {
            setCurrentForum(forum)
            // Filter posts by forum if needed
          }}
          onClose={() => setIsForumSelectorVisible(false)}
          onCreateForum={() => {
            router.push('/create-forum')
          }}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  container: {
    flex: 1,
  },
  forumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(0.5),
  },
  forumTitle: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    letterSpacing: -0.3,
  },
  favoriteButton: {
    padding: hp(0.8),
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
  },
  headerButton: {
    width: hp(4.5),
    height: hp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
  },
  createPostRowContainer: {
    paddingTop: hp(1.5), // Spacing between header and buttons
  },
  createPostRow: {
    flexDirection: 'row',
    gap: wp(2),
    paddingBottom: hp(0.5),
  },
  createButton: {
    flex: 1,
  },
  createPostButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.pill,
    paddingVertical: hp(1.1),
    paddingHorizontal: wp(4),
  },
  createPostText: {
    fontSize: hp(1.6),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  createEventButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingVertical: hp(0.9),
    paddingHorizontal: wp(4),
  },
  createEventText: {
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: wp(2),
    paddingBottom: hp(0.5),
    paddingHorizontal: wp(4),
  },
  filterChip: {
    flex: 1,
  },
  filterButton: {
    flex: 1,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.pill,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  filterButtonActive: {
    backgroundColor: 'transparent',
  },
  filterButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  storiesWrapper: {
    marginBottom: hp(2.5),
    position: 'relative',
  },
  storiesGradient: {
    paddingVertical: hp(1),
    borderRadius: hp(1),
  },
  storiesRow: {
    marginBottom: hp(0.5),
  },
  storyItem: {
    width: wp(16),
    alignItems: 'center',
  },
  storyAvatar: {
    width: wp(13),
    height: wp(13),
    borderRadius: wp(6.5),
    backgroundColor: theme.colors.white,
    borderWidth: 2.5,
    borderColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.8),
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.bondedPurple,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  storyAddAvatar: {
    borderStyle: 'dashed',
  },
  storyAvatarText: {
    fontSize: hp(2.2),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  storyLabel: {
    fontSize: hp(1.3),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
  },
  postsList: {
    paddingTop: hp(40), // Account for header (hp(5.5)) + spacing + buttons + stories (~hp(13)) + margin + extra buffer
    paddingBottom: hp(10),
    paddingHorizontal: 0,
  },
  postCard: {
    marginHorizontal: wp(4),
    marginBottom: hp(2),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp(2),
  },
  postAvatar: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.5),
    opacity: 0.15,
  },
  postAvatarText: {
    fontSize: hp(1.9),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600', // Slightly lighter for modern look
  },
  postMetaText: {
    fontSize: hp(1.35),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.1),
    fontWeight: '400',
  },
  postBody: {
    marginBottom: hp(1),
  },
  postTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.8),
    lineHeight: hp(2.2),
  },
  postBodyText: {
    fontSize: hp(1.65),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.4),
    marginTop: hp(0.3),
  },
  postMediaPreview: {
    marginTop: hp(1.2),
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
    // Clean, minimal - no shadows
  },
  postMediaImage: {
    width: '100%',
    height: hp(18),
    resizeMode: 'cover',
  },
  postMediaVideo: {
    width: '100%',
    height: hp(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.charcoal,
  },
  postMediaVideoText: {
    marginTop: hp(0.5),
    fontSize: hp(1.6),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(1.2),
    paddingTop: hp(1),
  },
  postVotesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  voteButton: {
    padding: hp(0.8),
    borderRadius: theme.radius.full,
  },
  postVoteCount: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    minWidth: wp(6),
    textAlign: 'center',
  },
  postVotePositive: {
    color: theme.colors.success,
  },
  postVoteNegative: {
    color: theme.colors.error,
  },
  postCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    padding: hp(0.8),
    borderRadius: theme.radius.full,
  },
  postCommentsText: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  postModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(2),
    maxHeight: '92%',
    minHeight: hp(55),
    flex: 1,
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  postModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  postModalTitle: {
    flex: 1,
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginRight: wp(2),
  },
  postModalMeta: {
    fontSize: hp(1.5),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
    marginBottom: hp(1),
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  postModalBody: {
    flex: 1,
  },
  postModalBodyContent: {
    paddingBottom: hp(2),
    flexGrow: 1,
  },
  postModalBodyText: {
    fontSize: hp(1.8),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.6),
    marginBottom: hp(2),
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  commentsTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
  },
  commentsCount: {
    fontSize: hp(1.5),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
  },
  commentsList: {
    gap: hp(1.5),
  },
  commentCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: wp(4.5),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: 'rgba(164, 92, 255, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    width: hp(3.2),
    height: hp(3.2),
    borderRadius: hp(1.6),
    backgroundColor: theme.colors.bondedPurple,
    opacity: 0.12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.5),
  },
  commentAvatarText: {
    fontSize: hp(1.5),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  commentAuthorInfo: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: hp(1.6),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
  },
  commentMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.softBlack,
    opacity: 0.8,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.1),
  },
  commentBody: {
    fontSize: hp(1.8),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.5),
    marginBottom: hp(1),
    opacity: 0.95,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(0.5),
  },
  commentVotesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  commentVoteButton: {
    padding: hp(0.5),
    borderRadius: theme.radius.sm,
  },
  commentVoteCount: {
    fontSize: hp(1.5),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    minWidth: wp(4),
    textAlign: 'center',
  },
  commentVotePositive: {
    color: '#2ecc71',
  },
  commentVoteNegative: {
    color: '#e74c3c',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(2.5),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.offWhite,
  },
  replyButtonText: {
    fontSize: hp(1.5),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: hp(1.5),
    marginLeft: wp(4),
    paddingLeft: wp(3),
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.offWhite,
    gap: hp(1),
  },
  replyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: wp(3.5),
    marginBottom: hp(0.8),
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.bondedPurple,
    borderWidth: 1,
    borderColor: 'rgba(164, 92, 255, 0.1)',
  },
  replyHeader: {
    marginBottom: hp(0.5),
  },
  replyAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyAvatar: {
    width: hp(2.2),
    height: hp(2.2),
    borderRadius: hp(1.1),
    backgroundColor: theme.colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(1.5),
  },
  replyAvatarText: {
    fontSize: hp(1.1),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  replyAuthorInfo: {
    flex: 1,
  },
  replyAuthorName: {
    fontSize: hp(1.5),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
  },
  replyMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.softBlack,
    opacity: 0.85,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.1),
  },
  replyBody: {
    fontSize: hp(1.7),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.3),
    marginBottom: hp(0.5),
    opacity: 0.95,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyInputContainer: {
    marginTop: hp(1),
    padding: wp(3),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  replyInput: {
    fontSize: hp(1.7),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    minHeight: hp(6),
    maxHeight: hp(12),
    marginBottom: hp(1),
  },
  replyInputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyInputButtons: {
    flexDirection: 'row',
    gap: wp(2),
  },
  replyCancelButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
  },
  replyCancelText: {
    fontSize: hp(1.5),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
  },
  replySubmitButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.pill,
  },
  replySubmitButtonDisabled: {
    opacity: 0.5,
  },
  replySubmitText: {
    fontSize: hp(1.5),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  newCommentContainer: {
    padding: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  newCommentInput: {
    fontSize: hp(1.7),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    backgroundColor: '#F2F2F7',
    borderRadius: hp(1.2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    minHeight: hp(6),
    maxHeight: hp(12),
    marginBottom: hp(1),
    textAlignVertical: 'top',
  },
  newCommentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentSubmitButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    backgroundColor: theme.colors.bondedPurple,
    borderRadius: theme.radius.pill,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.bondedPurple,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  commentSubmitButtonDisabled: {
    opacity: 0.5,
  },
  commentSubmitText: {
    fontSize: hp(1.6),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  anonPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(2.5),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.bondedPurple,
  },
  anonPillActiveSmall: {
    backgroundColor: theme.colors.bondedPurple,
    borderWidth: 0,
  },
  anonPillTextSmall: {
    fontSize: hp(1.4),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  emptyCommentsBox: {
    paddingVertical: hp(3),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(164, 92, 255, 0.08)',
    borderStyle: 'dashed',
  },
  emptyCommentsText: {
    fontSize: hp(1.8),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.7,
    textAlign: 'center',
  },
  profileModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  profileModalHeaderText: {
    flex: 1,
    marginRight: wp(4),
  },
  profileName: {
    fontSize: hp(2.4),
    fontWeight: '800',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
  },
  profileSubText: {
    marginTop: hp(0.5),
    fontSize: hp(1.7),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
  },
  profileBody: {
    marginTop: hp(1),
  },
  profileAvatarLarge: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    backgroundColor: theme.colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.8),
  },
  profileAvatarLargeText: {
    fontSize: hp(3),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
  },
  profileMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(1.8),
  },
  profileMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.radius.pill,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
  },
  profileMetaPillText: {
    fontSize: hp(1.6),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
  },
  profileSection: {
    marginBottom: hp(1.8),
  },
  profileSectionLabel: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.6),
  },
  profileQuote: {
    fontSize: hp(1.8),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.6),
  },
  profileActions: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2),
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.4),
    borderRadius: theme.radius.lg,
  },
  profileSecondaryButton: {
    backgroundColor: theme.colors.offWhite,
  },
  profilePrimaryButton: {
    backgroundColor: theme.colors.bondedPurple,
  },
  profileSecondaryText: {
    fontSize: hp(1.8),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  profilePrimaryText: {
    fontSize: hp(1.8),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: hp(1.8),
  },
  inputLabel: {
    fontSize: hp(1.7),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.5),
  },
  inputHint: {
    fontSize: hp(1.4),
    color: theme.colors.softBlack,
    opacity: 0.8,
    fontFamily: theme.typography.fontFamily.body,
  },
  textInput: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    backgroundColor: theme.colors.white,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    fontSize: hp(1.7),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
  },
  textArea: {
    minHeight: hp(12),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  mediaRow: {
    flexDirection: 'row',
    gap: wp(2),
    marginBottom: hp(0.6),
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.9),
    paddingHorizontal: wp(3.4),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.offWhite,
  },
  mediaButtonText: {
    fontSize: hp(1.6),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  composeBody: {
    flex: 1,
    marginTop: hp(1.5),
    marginBottom: hp(1.5),
  },
  composeTitleInput: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1),
    paddingBottom: hp(0.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  composeInput: {
    flex: 1,
    fontSize: hp(1.9),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.6),
  },
  composeToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composeCancelText: {
    fontSize: hp(1.7),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
  },
  composePostButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.9),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bondedPurple,
  },
  composePostButtonText: {
    fontSize: hp(1.7),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  anonPill: {
    backgroundColor: theme.colors.offWhite,
    borderWidth: 1,
    borderColor: theme.colors.bondedPurple,
  },
  anonPillActive: {
    backgroundColor: theme.colors.bondedPurple,
    borderWidth: 0,
  },
  mediaAttachedRow: {
    marginTop: hp(1.2),
  },
  mediaAttachedText: {
    fontSize: hp(1.4),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.8,
  },
  draftMediaItem: {
    marginRight: wp(2),
  },
  draftMediaImage: {
    width: wp(16),
    height: wp(16),
    borderRadius: theme.radius.md,
    resizeMode: 'cover',
  },
  draftMediaVideo: {
    width: wp(16),
    height: wp(16),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftMediaRemove: {
    position: 'absolute',
    top: -hp(0.8),
    right: -hp(0.8),
  },
})


