import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useAppTheme } from '../../app/theme'
import { useProfileModal } from '../../contexts/ProfileModalContext'
import { hp, wp } from '../../helpers/common'
import { formatTimeForDisplay } from '../../utils/dateFormatters'
import Text from '../ui/Text'

export default function MessageListItem({ conversation, onPress, onLongPress, currentUserId }) {
    const theme = useAppTheme()
    const router = useRouter()
    const { openProfile } = useProfileModal()
    const styles = createStyles(theme)

    const isOrg = conversation.type === 'org'
    const isGroup = conversation.type === 'group'

    // Determine avatar and name based on type
    let avatarUrl = conversation.image_url
    let name = conversation.name
    let isVerified = false

    // Helper to find other participant (now standardized in hook/context)
    let otherUser = conversation.other_participant

    if (!isOrg && !isGroup && otherUser) {
        avatarUrl = otherUser.avatar_url
        name = otherUser.full_name || otherUser.username
        isVerified = otherUser.is_verified
    }

    const lastMessage = conversation.last_message
    const isUnread = conversation.unread_count > 0
    const isSelf = lastMessage?.sender_id === currentUserId

    const timeString = lastMessage?.created_at
        ? formatTimeForDisplay(new Date(lastMessage.created_at))
        : ''

    const handleAvatarPress = () => {
        if (isOrg) {
            // Navigate to org profile or forum?
            // router.push(`/org/${conversation.org_id}`)
            return
        }
        if (conversation.other_participant?.id) {
            openProfile(conversation.other_participant.id)
        }
    }

    const Avatar = () => (
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} style={[styles.avatarContainer, isOrg && styles.avatarOrg]}>
            {avatarUrl ? (
                <Image
                    source={{ uri: avatarUrl }}
                    style={[styles.avatar, isOrg && styles.avatarOrgImage]}
                    contentFit="cover"
                />
            ) : (
                <View style={[styles.avatarPlaceholder, isOrg && styles.avatarPlaceholderOrg, isGroup && styles.avatarPlaceholderGroup]}>
                    {isOrg ? (
                        <Ionicons name="business" size={hp(3)} color={theme.colors.textSecondary} />
                    ) : isGroup ? (
                        <Ionicons name="people" size={hp(3.5)} color={theme.colors.textSecondary} />
                    ) : (
                        <Text style={styles.avatarPlaceholderText}>
                            {name ? name.charAt(0).toUpperCase() : '?'}
                        </Text>
                    )}
                </View>
            )}
            {/* Online indicator could go here */}
        </TouchableOpacity>
    )

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <Avatar />

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {name}
                        {isOrg && <Text style={styles.orgBadge}> • Org</Text>}
                    </Text>
                    <Text style={[styles.time, isUnread && styles.timeUnread]}>
                        {timeString}
                    </Text>
                </View>

                <View style={styles.bottomRow}>
                    <Text
                        style={[
                            styles.message,
                            isUnread ? styles.messageUnread : styles.messageRead
                        ]}
                        numberOfLines={1}
                    >
                        {isSelf && 'You: '}{lastMessage?.content || 'Started a conversation'}
                    </Text>
                    {isUnread && (
                        <View style={styles.unreadDot} />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    )
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(4),
        backgroundColor: theme.colors.background,
    },
    avatarContainer: {
        marginRight: wp(3.5),
    },
    avatar: {
        width: hp(6.5),
        height: hp(6.5),
        borderRadius: hp(3.25),
        backgroundColor: theme.colors.backgroundSecondary,
    },
    avatarOrg: {
        // Square for Orgs
    },
    avatarOrgImage: {
        borderRadius: theme.radius.md,
    },
    avatarPlaceholder: {
        width: hp(6.5),
        height: hp(6.5),
        borderRadius: hp(3.25),
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarPlaceholderOrg: {
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    avatarPlaceholderGroup: {
        backgroundColor: theme.colors.backgroundSecondary,
    },
    avatarPlaceholderText: {
        fontSize: hp(2.5),
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: hp(0.5),
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: hp(1.9),
        fontFamily: theme.typography.fontFamily.heading,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        flex: 1,
    },
    orgBadge: {
        fontSize: hp(1.4),
        color: theme.colors.textSecondary,
        fontWeight: '400',
    },
    time: {
        fontSize: hp(1.5),
        color: theme.colors.textTertiary,
        marginLeft: wp(2),
    },
    timeUnread: {
        color: theme.colors.bondedPurple,
        fontWeight: '600',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    message: {
        fontSize: hp(1.7),
        flex: 1,
        marginRight: wp(2),
    },
    messageRead: {
        color: theme.colors.textSecondary,
        fontWeight: '400',
    },
    messageUnread: {
        color: theme.colors.textPrimary,
        fontWeight: '600',
        fontFamily: theme.typography.fontFamily.body,
    },
    unreadDot: {
        width: hp(1.2),
        height: hp(1.2),
        borderRadius: hp(0.6),
        backgroundColor: theme.colors.bondedPurple,
    },
})
