import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAppTheme } from './theme'
import { hp, wp } from '../helpers/common'

const MOCK_CHAT_MESSAGES = [
  {
    id: 'msg-1',
    text: "Hey, what's up?",
    senderId: 'other',
    timestamp: '2:00 PM',
  },
  {
    id: 'msg-2',
    text: 'Not much, just studying for the midterm. You?',
    senderId: 'me',
    timestamp: '2:01 PM',
  },
  {
    id: 'msg-3',
    text: 'Same here. Want to study together?',
    senderId: 'other',
    timestamp: '2:02 PM',
  },
  {
    id: 'msg-4',
    text: 'Yeah that sounds great! Library at 3?',
    senderId: 'me',
    timestamp: '2:03 PM',
  },
  {
    id: 'msg-5',
    text: 'Perfect, see you there!',
    senderId: 'other',
    timestamp: '2:04 PM',
  },
]

export default function Chat() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const params = useLocalSearchParams()
  const [messages, setMessages] = useState(MOCK_CHAT_MESSAGES)
  const [inputText, setInputText] = useState('')
  const flatListRef = useRef(null)
  const userName = params.userName || params.forumName || 'User'
  const isGroupChat = params.isGroupChat === 'true'
  const forumName = params.forumName

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages])

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        text: inputText.trim(),
        senderId: 'me',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      }
      setMessages([...messages, newMessage])
      setInputText('')
    }
  }

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === 'me'
    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.messageContainerMe : styles.messageContainerOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextMe : styles.messageTextOther,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMe ? styles.messageTimeMe : styles.messageTimeOther,
            ]}
          >
            {item.timestamp}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={hp(2.5)} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <View style={styles.chatHeaderContent}>
            {isGroupChat && (
              <View style={styles.groupChatIcon}>
                <Ionicons name="people" size={hp(2)} color={theme.colors.bondedPurple} />
              </View>
            )}
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderTitle}>{userName}</Text>
              {isGroupChat && (
                <Text style={styles.groupChatSubtitle}>Group chat from {forumName}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={() => {
              // TODO: Open user profile or chat options
            }}
          >
            <Ionicons name="ellipsis-vertical" size={hp(2.5)} color={theme.colors.charcoal} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? hp(2) : 0}
        >
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              activeOpacity={0.7}
              onPress={() => {
                // TODO: Open attachment options
              }}
            >
              <Ionicons name="add-circle-outline" size={hp(2.8)} color={theme.colors.bondedPurple} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Message"
              placeholderTextColor={theme.colors.softBlack}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              activeOpacity={0.7}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={hp(2.5)}
                color={inputText.trim() ? theme.colors.white : theme.colors.softBlack}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
    paddingVertical: hp(1),
  },
  backButton: {
    padding: hp(0.5),
  },
  chatHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupChatIcon: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2),
  },
  chatHeaderText: {
    alignItems: 'center',
  },
  chatHeaderTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.heading,
  },
  groupChatSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.7,
    marginTop: hp(0.2),
  },
  headerIcon: {
    padding: hp(0.5),
  },
  messagesList: {
    paddingVertical: hp(1),
    paddingBottom: hp(2),
  },
  messageContainer: {
    marginBottom: hp(1.5),
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageContainerOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: wp(70),
    paddingVertical: hp(1),
    paddingHorizontal: wp(3.5),
    borderRadius: theme.radius.xl,
  },
  messageBubbleMe: {
    backgroundColor: theme.colors.bondedPurple,
    borderBottomRightRadius: theme.radius.sm,
  },
  messageBubbleOther: {
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.radius.sm,
  },
  messageText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.4),
    marginBottom: hp(0.3),
  },
  messageTextMe: {
    color: theme.colors.white,
  },
  messageTextOther: {
    color: theme.colors.textPrimary,
  },
  messageTime: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: theme.colors.white,
    opacity: 0.8,
  },
  messageTimeOther: {
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  attachButton: {
    padding: hp(0.5),
    marginRight: wp(2),
  },
  input: {
    flex: 1,
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    maxHeight: hp(10),
    paddingVertical: hp(0.8),
  },
  sendButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.bondedPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(2),
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
})

