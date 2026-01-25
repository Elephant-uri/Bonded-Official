import { useMemo, useRef, useState } from 'react'
import { ActionSheetIOS, ActivityIndicator, Alert, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAppTheme } from '../../app/theme'
import { hp, wp } from '../../helpers/common'
import { useConversationReactions, useToggleReaction } from '../../hooks/useMessageReactions'
import { formatChatDate, isSameGroup, shouldShowDateSeparator } from '../../utils/chatHelpers'
import MessageBubble from '../Message/MessageBubble'

export default function MessageList({
    messages,
    currentUserId,
    conversationId,
    isLoading,
    isLoadingMore,
    onLoadMore,
    onMessagePress
}) {
    const theme = useAppTheme()
    const styles = createStyles(theme)
    const listRef = useRef(null)
    const [showReactionModal, setShowReactionModal] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState(null)

    // Fetch reactions for all messages in conversation
    const messageIds = useMemo(() => messages.map(m => m.id), [messages])
    const { data: reactionsMap = {} } = useConversationReactions(conversationId, messageIds)

    const toggleReaction = useToggleReaction()

    const handleLongPress = (message) => {
        setSelectedMessage(message)

        if (Platform.OS === 'ios') {
            // Use ActionSheet on iOS
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['❤️ React with Heart', 'Cancel'],
                    cancelButtonIndex: 1,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        handleReaction(message, 'heart')
                    }
                }
            )
        } else {
            // Use Modal on Android
            setShowReactionModal(true)
        }
    }

    const handleReaction = async (message, reactionType) => {
        try {
            const existingReactions = reactionsMap[message.id] || []
            await toggleReaction.mutateAsync({
                messageId: message.id,
                reactionType,
                existingReactions,
            })
            setShowReactionModal(false)
        } catch (error) {
            console.error('Error toggling reaction:', error)
            Alert.alert('Error', 'Failed to add reaction. Please try again.')
        }
    }

    const renderItem = ({ item, index }) => {
        // Determine positioning in group
        // Inverted list: index+1 is OLDER/PREV, index-1 is NEWER/NEXT

        const prevMessage = messages[index + 1] // Older
        const nextMessage = messages[index - 1] // Newer

        // Is this the "first" message of the group (visually at the TOP)?
        // Means the OLDER message is different sender or diff time
        const isFirstInGroup = !isSameGroup(item, prevMessage)

        // Is this the "last" message of the group (visually at the BOTTOM)?
        // Means the NEWER message is different sender or diff time
        const isLastInGroup = !isSameGroup(item, nextMessage)

        const showAvatar = isLastInGroup && item.sender_id !== currentUserId
        const showDate = isFirstInGroup && shouldShowDateSeparator(item.created_at, prevMessage?.created_at)

        return (
            <View>
                {/* Inverted list: Date is visually 'above' (so rendered AFTER in flex-col-reverse, or BEFORE in standard?) */}
                {/* Wait, standard FlatList inverted renders bottom-up. */}
                {/* So the "Bottom" item is index 0. */}
                {/* If we want date at TOP of group, it needs to be rendered "after" the group items in DOM? */}
                {/* Actually, for Inverted list, "Footer" is top of screen. */}
                {/* Let's keep it simple: Render date separator as a separate View if needed. */}
                {/* BUT grouping logic date check needs to be correct. */}

                {/* Date Separator logic for Inverted List: 
            If message is oldest in group (FirstInGroup visually), verify if it needs separator.
            In inverted list, to show something "Above", we render it "Below" in DOM structure? No.
            Top of screen is "End" of list.
            Let's rely on standard View flow within renderItem.
            If Date needs to be ABOVE the message, in inverted list, it should be rendered AFTER the message component?
            Actually, inverted list flips the scroll direction, but item rendering is usually standard within the item container?
            Let's test. Usually for inverted chat, standard render is:
            [Date Separator]
            [Message]
            Wait, if inverted, [Message] is at bottom.
            So [Date] needs to be visually above.
            Inverted FlatList: visual top is end of list.
            If I render <View><Date/><Bubble/></View>:
            Visual on screen:
            [Date]       (Top)
            [Bubble]     (Bottom)
            This is correct for "Date above Bubble".
        */}

                {showDate && (
                    <View style={styles.dateSeparator}>
                        <Text style={styles.dateText}>
                            {formatChatDate(item.created_at)}
                        </Text>
                    </View>
                )}

                <MessageBubble
                    message={item}
                    isMe={item.sender_id === currentUserId}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    showAvatar={showAvatar}
                    theme={theme}
                    reactions={reactionsMap[item.id] || []}
                    onPress={() => onMessagePress && onMessagePress(item)}
                    onLongPress={handleLongPress}
                />

                {/* If we need spacing between groups? */}
                {isLastInGroup && <View style={{ height: 4 }} />}
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {isLoading && messages.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.bondedPurple} />
                </View>
            ) : (
                <>
                    <FlatList
                        ref={listRef}
                    data={messages}
                    keyExtractor={(item) => item.id || item.created_at}
                    renderItem={renderItem}
                    inverted
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.2}
                    ListFooterComponent={
                        isLoadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        // For inverted list, empty component is centered? 
                        // Need to rotate it back if we want it right side up?
                        // Or just use styling `transform: [{ scaleY: -1 }]` on the container
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No messages yet</Text>
                            <Text style={styles.emptySubtext}>Say hello!</Text>
                        </View>
                    }
                    />

                    {/* Reaction Modal for Android */}
                    {Platform.OS === 'android' && (
                        <Modal
                            visible={showReactionModal}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setShowReactionModal(false)}
                        >
                            <TouchableOpacity
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPress={() => setShowReactionModal(false)}
                            >
                                <View style={styles.reactionSheet}>
                                    <Text style={styles.reactionSheetTitle}>React to message</Text>
                                    <TouchableOpacity
                                        style={styles.reactionOption}
                                        onPress={() => selectedMessage && handleReaction(selectedMessage, 'heart')}
                                    >
                                        <Text style={styles.reactionEmoji}>❤️</Text>
                                        <Text style={styles.reactionLabel}>Heart</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowReactionModal(false)}
                                    >
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    )}
                </>
            )}
        </View>
    )
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(2),
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerLoader: {
        paddingVertical: hp(2),
        alignItems: 'center',
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: hp(2),
        marginBottom: hp(1),
    },
    dateText: {
        fontSize: hp(1.5),
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: hp(20),
        transform: [{ scaleY: -1 }]
    },
    emptyText: {
        fontSize: hp(2.2),
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginBottom: hp(1),
    },
    emptySubtext: {
        fontSize: hp(1.8),
        color: theme.colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    reactionSheet: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: wp(5),
        paddingBottom: hp(4),
    },
    reactionSheetTitle: {
        fontSize: hp(2),
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginBottom: hp(2),
        textAlign: 'center',
    },
    reactionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: hp(2),
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.md,
        marginBottom: hp(1),
        gap: wp(3),
    },
    reactionEmoji: {
        fontSize: hp(3),
    },
    reactionLabel: {
        fontSize: hp(2),
        color: theme.colors.textPrimary,
        fontWeight: '500',
    },
    cancelButton: {
        marginTop: hp(2),
        padding: hp(2),
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.md,
    },
    cancelText: {
        fontSize: hp(2),
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
})
