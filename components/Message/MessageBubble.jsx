import { Image, StyleSheet, Text, View } from 'react-native'
import RichMessagePreview from './RichMessagePreviewSimple'

export default function MessageBubble({
    message,
    isMe,
    theme,
    isFirstInGroup, // Visually Top
    isLastInGroup,  // Visually Bottom
    showAvatar,
    onPress,
}) {
    const styles = createStyles(theme)

    // Bubble Shape Logic
    const borderTopLeft = !isMe && !isFirstInGroup ? 5 : 20
    const borderBottomLeft = !isMe && !isLastInGroup ? 5 : 20
    const borderTopRight = isMe && !isFirstInGroup ? 5 : 20
    const borderBottomRight = isMe && !isLastInGroup ? 5 : 20

    // Tail Logic (Only visually bottom aka isLastInGroup)
    // Actually iMessage creates a continuous shape.
    // Let's stick to: Rounded corners everywhere except the "connected" side.

    const bubbleStyle = {
        borderTopLeftRadius: !isMe ? (isFirstInGroup ? 20 : 5) : 20,
        borderBottomLeftRadius: !isMe ? (isLastInGroup ? 20 : 5) : 20,

        borderTopRightRadius: isMe ? (isFirstInGroup ? 20 : 5) : 20,
        borderBottomRightRadius: isMe ? (isLastInGroup ? 20 : 5) : 20,

        // Add small margin between grouped messages
        marginBottom: 2,
    }

    const senderAvatar = message.sender?.avatar_url

    return (
        <View style={[styles.container, isMe ? styles.containerMe : styles.containerOther]}>
            {/* Avatar (Left side, only if other and last in group) */}
            {!isMe && (
                <View style={styles.avatarContainer}>
                    {showAvatar ? (
                        senderAvatar ? (
                            <Image source={{ uri: senderAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarText}>
                                    {(message.sender?.full_name || message.sender?.username || '?').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )
                    ) : (
                        <View style={{ width: 30 }} /> // Spacer to keep alignment
                    )}
                </View>
            )}

            <View style={[
                styles.bubble,
                isMe ? styles.bubbleMe : styles.bubbleOther,
                bubbleStyle
            ]}>
                <Text style={[styles.text, isMe ? styles.textMe : styles.textOther]}>
                    {message.content}
                </Text>
                
                {/* Rich Message Preview */}
                <RichMessagePreview message={message} isOwn={isMe} />
            </View>

            {/* Status / Time (Optional, maybe only on last message or tap) */}
            {/* {isLastInGroup && isMe && (
                 <Text style={styles.statusText}>Delivered</Text>
             )} */}
        </View>
    )
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 1, // Tight spacing
        maxWidth: '100%',
    },
    containerMe: {
        justifyContent: 'flex-end',
    },
    containerOther: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 30,
        marginRight: 8,
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    avatarPlaceholder: {
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    bubble: {
        maxWidth: '70%',
        paddingVertical: 8,
        paddingHorizontal: 12,
        minHeight: 36,
        justifyContent: 'center',
    },
    bubbleMe: {
        backgroundColor: theme.colors.bondedPurple, // iMessage Blue/Purple equivalent
    },
    bubbleOther: {
        backgroundColor: theme.colors.backgroundSecondary || '#E5E5EA', // iMessage Gray
    },
    text: {
        fontSize: 16,
        lineHeight: 20,
    },
    textMe: {
        color: '#FFFFFF',
    },
    textOther: {
        color: theme.colors.textPrimary || '#000000',
    },
    statusText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 2,
        marginRight: 4,
        alignSelf: 'flex-end',
    }
})
