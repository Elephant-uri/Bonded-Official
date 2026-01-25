import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomNav from '../components/BottomNav'
import MessageListItem from '../components/Message/MessageListItem'
import { hp, wp } from '../helpers/common'
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile'
import { useMessageRequests } from '../hooks/useMessageRequests'
import { useConversations, useMarkAsRead } from '../hooks/useMessages'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useAppTheme } from './theme'

export default function Messages() {
  const router = useRouter()
  const theme = useAppTheme()
  const { user } = useAuthStore()
  const styles = createStyles(theme)
  const { data: currentUserProfile } = useCurrentUserProfile()

  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('direct') // 'direct' | 'groups'

  // Data Hooks
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useConversations()
  const { data: messageRequests = [] } = useMessageRequests()
  const markAsRead = useMarkAsRead()

  // Private Forums (Org Chats) - Fetched manually
  const [privateForums, setPrivateForums] = useState([])
  const [isLoadingForums, setIsLoadingForums] = useState(false)

  // Fetch Logic for Org Forums
  const fetchPrivateForums = useCallback(async () => {
    if (!user?.id) return
    try {
      setIsLoadingForums(true)
      // 1. Get Org Memberships
      const { data: orgMemberships } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)

      const orgIds = (orgMemberships || []).map(row => row.organization_id)
      if (orgIds.length === 0) {
        setPrivateForums([])
        return
      }

      // 2. Get Forums for these Orgs
      const { data: forums } = await supabase
        .from('forums')
        .select('id, name, org_id, type')
        .in('org_id', orgIds)
        .eq('type', 'org')

      const forumsList = (forums || []).map(f => ({
        id: f.id,
        name: f.name,
        type: 'org',
        org_id: f.org_id,
        isForum: true, // Marker to distinguish from active convos
        image_url: null,
      }))

      setPrivateForums(forumsList)
    } catch (err) {
      console.error('Error fetching forums:', err)
    } finally {
      setIsLoadingForums(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchPrivateForums()
  }, [fetchPrivateForums])

  const onRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refetchConversations(), fetchPrivateForums()])
    setIsRefreshing(false)
  }

  // Unified Data Merging & Splitting
  const { directChats, groupChats } = useMemo(() => {
    const activeConvoIds = new Set(conversations.map(c => c.id))
    const formattedConversations = conversations.map(c => ({
      ...c,
      sortTime: new Date(c.last_message_at || c.created_at).getTime(),
    }))

    // Filter out forums that already have an active conversation
    const activeForumNames = new Set(
      conversations
        .filter(c => c.type === 'group') // Include 'org' type if it exists in conversations
        .map(c => c.name)
    )

    const inactiveForums = privateForums
      .filter(f => !activeForumNames.has(f.name))
      .map(f => ({
        ...f,
        last_message: 'Tap to start chatting',
        last_message_at: null,
        sortTime: 0,
        participants: [],
        unread_count: 0,
      }))

    // Split
    const direct = formattedConversations.filter(c => c.type === 'direct').sort((a, b) => b.sortTime - a.sortTime)

    const groups = [
      ...formattedConversations.filter(c => c.type !== 'direct'),
      ...inactiveForums
    ].sort((a, b) => b.sortTime - a.sortTime) // Sort groups by activity too

    // Filter by search
    const filterFn = (item) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const title = item.name || item.participants?.[0]?.full_name || item.participants?.[0]?.username || 'User'
      return title.toLowerCase().includes(q)
    }

    return {
      directChats: direct.filter(filterFn),
      groupChats: groups.filter(filterFn)
    }
  }, [conversations, privateForums, searchQuery])


  // Handlers
  const handleItemPress = async (item) => {
    if (item.isForum) {
      try {
        let targetId = null

        // 1. Try finding by org_id (Most reliable for Orgs)
        if (item.org_id) {
          const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .eq('org_id', item.org_id)
            .maybeSingle()
          if (existing) targetId = existing.id
        }

        // 2. Fallback: Try finding by name
        if (!targetId) {
          const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .eq('name', item.name)
            .in('type', ['group', 'org'])
            .maybeSingle()
          if (existing) targetId = existing.id
        }

        // 3. Create if not found
        if (!targetId) {
          const type = item.org_id ? 'org' : 'group'

          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              name: item.name,
              type: type,
              created_by: user.id,
              org_id: item.org_id || null
            })
            .select()
            .single()

          if (newConv) {
            targetId = newConv.id
            // Add self
            await supabase.from('conversation_participants').insert({
              conversation_id: targetId, user_id: user.id
            })
          }
        }

        if (targetId) {
          router.push({
            pathname: '/chat',
            params: {
              conversationId: targetId,
              userName: item.name,
              isGroupChat: 'true',
              orgId: item.org_id
            }
          })
        }
      } catch (e) {
        console.error('Error opening forum chat', e)
        Alert.alert('Error', 'Could not join organization chat')
      }
      return
    }

    // Normal Conversation
    // For direct chats, find the other participant
    let otherParticipant = item.participants?.find(p => p.id !== user.id)
    if (!otherParticipant && item.participants?.length > 0) otherParticipant = item.participants[0]

    const isGroup = ['group', 'org', 'class'].includes(item.type)
    const displayName = isGroup
      ? (item.name || 'Group Chat')
      : (otherParticipant?.full_name || otherParticipant?.username || 'User')

    if (item.id) markAsRead.mutate(item.id)

    router.push({
      pathname: '/chat',
      params: {
        conversationId: item.id,
        userId: otherParticipant?.id,
        userName: displayName,
        isGroupChat: isGroup ? 'true' : 'false',
        orgId: item.org_id,
        classId: item.class_section_id
      }
    })
  }

  const handleDeleteConversation = async (conversation) => {
    // Logic: Leave conversation used 'conversation_participants'
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to remove this conversation? This will hide it from your list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!conversation.id) return // Can't delete inactive forum placeholder
            try {
              if (conversation.type === 'group') {
                const displayName =
                  currentUserProfile?.full_name ||
                  currentUserProfile?.username ||
                  user?.user_metadata?.full_name ||
                  user?.user_metadata?.username ||
                  user?.email?.split('@')[0] ||
                  'Someone'
                await supabase
                  .from('messages')
                  .insert({
                    conversation_id: conversation.id,
                    sender_id: user.id,
                    content: `${displayName} left the chat`,
                    metadata: { type: 'system', action: 'left' },
                  })
              }

              const { error } = await supabase
                .from('conversation_participants')
                .delete()
                .eq('conversation_id', conversation.id)
                .eq('user_id', user.id)

              if (error) throw error

              // Refetch
              refetchConversations()
            } catch (err) {
              Alert.alert('Error', 'Failed to delete conversation')
            }
          }
        }
      ]
    )
  }

  const renderContent = () => {
    const data = activeTab === 'direct' ? directChats : groupChats
    const emptyText = activeTab === 'direct' ? "No messages yet" : "No group chats yet"

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id || `forum-${item.name}`}
        renderItem={({ item }) => (
          <MessageListItem
            conversation={item}
            currentUserId={user?.id}
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleDeleteConversation(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !conversationsLoading && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={hp(6)} color={theme.colors.textSecondary} style={{ opacity: 0.3, marginBottom: hp(1) }} />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          )
        }
      />
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Modern Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={hp(2)} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'direct' && styles.activeTab]}
            onPress={() => setActiveTab('direct')}
          >
            <Text style={[styles.tabText, activeTab === 'direct' && styles.activeTabText]}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>Groups</Text>
          </TouchableOpacity>
        </View>

        {/* Requests Alert - Only show on Direct tab? Or both? */}
        {activeTab === 'direct' && messageRequests.length > 0 && (
          <TouchableOpacity
            style={styles.requestAlert}
            onPress={() => router.push('/message-requests')}
          >
            <Text style={styles.requestAlertText}>
              {messageRequests.length} Message Request{messageRequests.length > 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={hp(2)} color={theme.colors.bondedPurple} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>

        {/* FAB for New Chat */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => router.push('/new-chat')}
        >
          <Ionicons name="add" size={hp(3.5)} color="#FFF" />
        </TouchableOpacity>

        {/* Bottom Nav! */}
        <BottomNav />
      </View>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: hp(3.5),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  searchSection: {
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(3),
    height: hp(5),
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    color: theme.colors.textPrimary,
    fontSize: hp(1.8),
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    marginBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSecondary,
  },
  tab: {
    marginRight: wp(6),
    paddingBottom: hp(1),
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.bondedPurple,
  },
  tabText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.textPrimary,
  },
  listContent: {
    paddingBottom: hp(12), // Space for FAB + BottomNav
  },
  requestAlert: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSecondary,
    backgroundColor: theme.colors.backgroundSecondary + '50',
  },
  requestAlertText: {
    color: theme.colors.bondedPurple,
    fontWeight: '600',
  },
  emptyState: {
    paddingTop: hp(10),
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: hp(2),
  },
  fab: {
    position: 'absolute',
    bottom: hp(12), // Adjusted for BottomNav
    right: wp(5),
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 100,
  },
})
