import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { hp, wp } from '../../helpers/common'
import theme from '../../constants/theme'
import AppTopBar from '../../components/AppTopBar'
import BottomNav from '../../components/BottomNav'
import ShareModal from '../../components/ShareModal'
import { useEventsContext } from '../../contexts/EventsContext'
import { useClubsContext } from '../../contexts/ClubsContext'

export default function EventDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const { getEvent, rsvpToEvent, getUserRSVP, deleteEvent } = useEventsContext()
  const { getClub } = useClubsContext()

  // Mock current user - replace with real auth
  const currentUserId = 'user-123'
  const event = getEvent(id)
  const userRSVP = getUserRSVP(id, currentUserId)
  
  // Get club info if event is from a club
  const club = event?.clubId ? getClub(event.clubId) : null

  const [rsvpStatus, setRsvpStatus] = useState(userRSVP)
  const [showShareModal, setShowShareModal] = useState(false)

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <AppTopBar
            schoolName="University of Rhode Island"
            onPressProfile={() => router.push('/profile')}
            onPressSchool={() => {}}
            onPressNotifications={() => router.push('/notifications')}
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Event not found</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleRSVP = (status) => {
    rsvpToEvent(id, currentUserId, status)
    setRsvpStatus(status)
    Alert.alert(
      'Success',
      status === 'going'
        ? "You're going to this event!"
        : "You're interested in this event!"
    )
  }

  const handleRemoveRSVP = () => {
    rsvpToEvent(id, currentUserId, null)
    setRsvpStatus(null)
  }

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteEvent(id)
          router.back()
        },
      },
    ])
  }

  const attendeesCount = event.attendees?.length || 0
  const interestedCount = event.interested?.length || 0

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppTopBar
          schoolName="Your University"
          onPressProfile={() => router.push('/profile')}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image */}
          {event.coverImage ? (
            <Image source={{ uri: event.coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverImagePlaceholder}>
              <Ionicons name="calendar" size={hp(8)} color={theme.colors.bondedPurple} />
            </View>
          )}

          {/* Event Info */}
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>EVENT</Text>
                </View>
                <Text style={styles.category}>{event.category}</Text>
              </View>
            </View>

            <Text style={styles.title}>{event.title}</Text>

            {/* Date & Time */}
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={hp(2.2)}
                color={theme.colors.bondedPurple}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>
                  {formatDate(event.startDate)} at {formatTime(event.startDate)}
                </Text>
                {event.endDate && event.endDate !== event.startDate && (
                  <Text style={styles.infoSubtext}>
                    Until {formatTime(event.endDate)}
                  </Text>
                )}
              </View>
            </View>

            {/* Location */}
            {event.location && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={hp(2.2)}
                  color={theme.colors.bondedPurple}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{event.location}</Text>
                </View>
              </View>
            )}

            {/* Link */}
            {event.link && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="link-outline"
                  size={hp(2.2)}
                  color={theme.colors.bondedPurple}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Link</Text>
                  <TouchableOpacity
                    onPress={async () => {
                      const url = event.link.startsWith('http') ? event.link : `https://${event.link}`
                      const canOpen = await Linking.canOpenURL(url)
                      if (canOpen) {
                        await Linking.openURL(url)
                      } else {
                        Alert.alert('Error', 'Cannot open this link')
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.linkText}>{event.link}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Recurring Info */}
            {event.isRecurring && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="repeat-outline"
                  size={hp(2.2)}
                  color={theme.colors.bondedPurple}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Recurring Event</Text>
                  <Text style={styles.infoValue}>
                    Repeats {event.recurringType || 'weekly'}
                  </Text>
                </View>
              </View>
            )}

            {/* Club/Organization */}
            {club && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => router.push(`/clubs/${event.clubId}`)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="people-outline"
                  size={hp(2.2)}
                  color={theme.colors.bondedPurple}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Hosted by</Text>
                  <View style={styles.clubRow}>
                    <Text style={styles.clubName}>{club.name}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={hp(1.8)}
                      color={theme.colors.bondedPurple}
                      style={{ opacity: 0.6 }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Description */}
            {event.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionTitle}>About</Text>
                <Text style={styles.descriptionText}>{event.description}</Text>
              </View>
            )}

            {/* RSVP Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={hp(2.5)}
                  color={theme.colors.bondedPurple}
                />
                <Text style={styles.statValue}>{attendeesCount}</Text>
                <Text style={styles.statLabel}>Going</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name="heart-outline"
                  size={hp(2.5)}
                  color={theme.colors.bondedPurple}
                />
                <Text style={styles.statValue}>{interestedCount}</Text>
                <Text style={styles.statLabel}>Interested</Text>
              </View>
            </View>

            {/* RSVP Buttons */}
            <View style={styles.rsvpSection}>
              {rsvpStatus === 'going' ? (
                <TouchableOpacity
                  style={styles.rsvpButtonGoing}
                  onPress={handleRemoveRSVP}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={hp(2)} color={theme.colors.white} />
                  <Text style={styles.rsvpButtonText}>You're Going</Text>
                </TouchableOpacity>
              ) : rsvpStatus === 'interested' ? (
                <View style={styles.rsvpButtonRow}>
                  <TouchableOpacity
                    style={styles.rsvpButtonInterested}
                    onPress={handleRemoveRSVP}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="heart" size={hp(2)} color={theme.colors.bondedPurple} />
                    <Text style={styles.rsvpButtonTextInterested}>Interested</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rsvpButtonGoing}
                    onPress={() => handleRSVP('going')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rsvpButtonText}>I'm Going</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.rsvpButtonRow}>
                  <TouchableOpacity
                    style={styles.rsvpButtonInterested}
                    onPress={() => handleRSVP('interested')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="heart-outline"
                      size={hp(2)}
                      color={theme.colors.bondedPurple}
                    />
                    <Text style={styles.rsvpButtonTextInterested}>Interested</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rsvpButtonGoing}
                    onPress={() => handleRSVP('going')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rsvpButtonText}>I'm Going</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => setShowShareModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={hp(2.5)} color={theme.colors.bondedPurple} />
              <Text style={styles.shareButtonText}>Share Event</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Share Modal */}
        <ShareModal
          visible={showShareModal}
          content={{
            type: 'event',
            data: event,
          }}
          onClose={() => setShowShareModal(false)}
        />

        <BottomNav />
      </View>
    </SafeAreaView>
    )
  }

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offWhite,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(10),
  },
  coverImage: {
    width: '100%',
    height: hp(25),
    resizeMode: 'cover',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: hp(25),
    backgroundColor: theme.colors.bondedPurple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: wp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  eventBadge: {
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.pill,
  },
  eventBadgeText: {
    fontSize: hp(1.1),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  category: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: hp(3),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '800',
    color: theme.colors.charcoal,
    marginBottom: hp(2),
  },
  infoRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginBottom: hp(2),
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.7,
    marginBottom: hp(0.3),
  },
  infoValue: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  linkText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.bondedPurple,
    textDecorationLine: 'underline',
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  clubName: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.bondedPurple,
    flex: 1,
  },
  infoSubtext: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.7,
    marginTop: hp(0.2),
  },
  descriptionSection: {
    marginTop: hp(1),
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
  },
  descriptionTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
    marginBottom: hp(1),
  },
  descriptionText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
    lineHeight: hp(2.4),
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(4),
    marginBottom: hp(2),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: hp(1.5),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    gap: hp(0.5),
  },
  statValue: {
    fontSize: hp(2.2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
  },
  statLabel: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.7,
  },
  rsvpSection: {
    marginTop: hp(1),
  },
  rsvpButtonRow: {
    flexDirection: 'row',
    gap: wp(2),
  },
  rsvpButtonGoing: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bondedPurple,
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
    gap: wp(2),
  },
  rsvpButtonInterested: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.bondedPurple,
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
    gap: wp(2),
  },
  rsvpButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  rsvpButtonTextInterested: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.bondedPurple,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(4),
  },
  errorText: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    marginBottom: hp(2),
  },
  backButton: {
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.xl,
  },
  backButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bondedPurple + '15',
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.xl,
    gap: wp(2),
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.bondedPurple,
  },
  shareButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.bondedPurple,
  },
})

