import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { hp, wp } from '../helpers/common'
import theme from '../constants/theme'
import AppTopBar from '../components/AppTopBar'
import BottomNav from '../components/BottomNav'
import AppCard from '../components/AppCard'
import Chip from '../components/Chip'
import { useEventsContext } from '../contexts/EventsContext'
import { useClubsContext } from '../contexts/ClubsContext'
import CreateEventModal from '../components/Events/CreateEventModal'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const EVENT_COLORS = [
  '#A45CFF', // bondedPurple
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#FFE66D', // yellow
  '#95E1D3', // mint
  '#F38181', // coral
  '#AA96DA', // lavender
]

export default function Calendar() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState('week') // 'week', 'day', 'month'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarFilter, setCalendarFilter] = useState('all') // 'all', 'public', 'private', 'school-wide', 'orgs'
  const [isCreateEventModalVisible, setIsCreateEventModalVisible] = useState(false)
  const { getAllEvents, getUserEvents } = useEventsContext()
  const { getUserClubs, isUserMember } = useClubsContext()

  // Mock current user - replace with real auth
  const currentUserId = 'user-123'
  const allEvents = getAllEvents()
  const userEvents = getUserEvents(currentUserId)
  const userClubs = getUserClubs(currentUserId)

  // Get user's club IDs
  const userClubIds = useMemo(() => {
    return userClubs.map((club) => club.id)
  }, [userClubs])

  // Filter events based on selected calendar filter
  const filteredEvents = useMemo(() => {
    switch (calendarFilter) {
      case 'public':
        // Only public events
        return allEvents.filter((event) => event.isPublic === true)
      
      case 'private':
        // User's private events they created or are attending/interested in
        return allEvents.filter((event) => {
          if (event.isPublic) return false
          // Show if user is attending/interested
          if (event.attendees?.includes(currentUserId) || event.interested?.includes(currentUserId)) {
            return true
          }
          return false
        })
      
      case 'school-wide':
        // All public school-wide events (no club events)
        return allEvents.filter((event) => {
          return event.isPublic === true && !event.clubId
        })
      
      case 'orgs':
        // Events from organizations/clubs the user is a member of
        return allEvents.filter((event) => {
          if (!event.clubId) return false
          return isUserMember(event.clubId, currentUserId)
        })
      
      case 'all':
      default:
        // All events: public + user's private events + user's org events
        return allEvents.filter((event) => {
          // Show public events
          if (event.isPublic) return true
          // Show private events user is attending/interested in
          if (event.attendees?.includes(currentUserId) || event.interested?.includes(currentUserId)) {
            return true
          }
          // Show org events user is a member of
          if (event.clubId && isUserMember(event.clubId, currentUserId)) {
            return true
          }
          return false
        })
    }
  }, [allEvents, calendarFilter, currentUserId, isUserMember])

  // Get events for current week
  const weekEvents = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startDate)
      return eventDate >= startOfWeek && eventDate <= endOfWeek
    })
  }, [filteredEvents, currentDate])

  // Get events for current day
  const dayEvents = useMemo(() => {
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    return filteredEvents
      .filter((event) => {
        const eventDate = new Date(event.startDate)
        return eventDate >= dayStart && eventDate <= dayEnd
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  }, [filteredEvents, currentDate])

  // Get events for current month
  const monthEvents = useMemo(() => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startDate)
      return eventDate >= monthStart && eventDate <= monthEnd
    })
  }, [filteredEvents, currentDate])

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction)
    setCurrentDate(newDate)
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getEventColor = (eventId) => {
    return EVENT_COLORS[eventId.charCodeAt(eventId.length - 1) % EVENT_COLORS.length]
  }

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const renderWeekView = () => {
    const weekDays = getWeekDays()
    const isToday = (date) => {
      const today = new Date()
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      )
    }

    // Group all events by day for list view
    const allWeekEvents = weekDays.map((day) => {
      const dayEvents = weekEvents.filter((event) => {
        const eventDate = new Date(event.startDate)
        return (
          eventDate.getDate() === day.getDate() &&
          eventDate.getMonth() === day.getMonth() &&
          eventDate.getFullYear() === day.getFullYear()
        )
      })
      return { day, events: dayEvents, isToday: isToday(day) }
    })

    return (
      <View style={styles.weekContainer}>
        {allWeekEvents.map(({ day, events, isToday }, index) => (
          <View key={index} style={styles.daySection}>
            <View style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
              <View style={styles.dayHeaderLeft}>
                <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                  {DAYS[day.getDay()]}
                </Text>
                <View style={[styles.dayNumberContainer, isToday && styles.dayNumberContainerToday]}>
                  <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                    {day.getDate()}
                  </Text>
                </View>
              </View>
              {events.length > 0 && (
                <View style={styles.dayEventCount}>
                  <Text style={styles.dayEventCountText}>{events.length}</Text>
                </View>
              )}
            </View>
            {events.length > 0 ? (
              <View style={styles.eventsList}>
                {events.map((event) => (
                  <AppCard
                    key={event.id}
                    style={[styles.eventCard, { borderLeftWidth: 4, borderLeftColor: getEventColor(event.id) }]}
                  >
                    <TouchableOpacity
                      onPress={() => router.push(`/events/${event.id}`)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.eventCardContent}>
                        <Text style={styles.eventCardTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <View style={styles.eventCardMeta}>
                          <Ionicons name="time-outline" size={hp(1.3)} color="#8E8E93" />
                          <Text style={styles.eventCardTime}>
                            {formatTime(event.startDate)}
                          </Text>
                          {event.location && (
                            <>
                              <Ionicons name="location-outline" size={hp(1.3)} color="#8E8E93" style={{ marginLeft: wp(2) }} />
                              <Text style={styles.eventCardLocation} numberOfLines={1}>
                                {event.location}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </AppCard>
                ))}
              </View>
            ) : (
              <View style={styles.noEvents}>
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={hp(3)} color="#8E8E93" style={{ marginBottom: hp(1) }} />
                  <Text style={styles.emptyStateText}>No events yet – tap + to add one</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <View style={styles.dayContainer}>
        {hours.map((hour) => {
          const hourEvents = dayEvents.filter((event) => {
            const eventDate = new Date(event.startDate)
            return eventDate.getHours() === hour
          })

          return (
            <View key={hour} style={styles.hourRow}>
              <View style={styles.hourLabel}>
                <Text style={styles.hourText}>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </Text>
              </View>
              <View style={styles.hourContent}>
                {hourEvents.map((event) => {
                  const eventColor = getEventColor(event.id)
                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={[styles.dayEventCard, { backgroundColor: eventColor }]}
                      onPress={() => router.push(`/events/${event.id}`)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.dayEventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.dayEventTime}>
                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                      </Text>
                      {event.location && (
                        <View style={styles.dayEventLocationRow}>
                          <Ionicons name="location" size={hp(1.2)} color={theme.colors.white} style={{ opacity: 0.9 }} />
                          <Text style={styles.dayEventLocation} numberOfLines={1}>
                            {event.location}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
                {hourEvents.length === 0 && <View style={styles.hourLine} />}
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendarDays = []
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null)
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i)
    }

    return (
      <View style={styles.monthContainer}>
        <View style={styles.monthGrid}>
          {DAYS.map((day) => (
            <View key={day} style={styles.monthDayHeader}>
              <Text style={styles.monthDayHeaderText}>{day}</Text>
            </View>
          ))}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <View key={index} style={styles.monthDayCell} />
            }

            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const dayEvents = monthEvents.filter((event) => {
              const eventDate = new Date(event.startDate)
              return (
                eventDate.getDate() === day &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear()
              )
            })

            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear()

            return (
              <TouchableOpacity
                key={index}
                style={[styles.monthDayCell, isToday && styles.monthDayCellToday]}
                onPress={() => {
                  setCurrentDate(dayDate)
                  setViewMode('day')
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.monthDayNumber,
                    isToday && styles.monthDayNumberToday,
                  ]}
                >
                  {day}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.monthEventDots}>
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <View
                        key={i}
                        style={[
                          styles.monthEventDot,
                          { backgroundColor: getEventColor(event.id) },
                        ]}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <Text style={styles.monthEventDotMore}>+{dayEvents.length - 3}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    )
  }

  const renderView = () => {
    switch (viewMode) {
      case 'week':
        return renderWeekView()
      case 'day':
        return renderDayView()
      case 'month':
        return renderMonthView()
      default:
        return renderWeekView()
    }
  }

  const getViewTitle = () => {
    switch (viewMode) {
      case 'week':
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${MONTHS[weekStart.getMonth()].substring(0, 3)} ${weekStart.getDate()} - ${weekEnd.getDate()}`
      case 'day':
        return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}`
      case 'month':
        return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      default:
        return 'Calendar'
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppTopBar
          schoolName="University of Rhode Island"
          onPressProfile={() => router.push('/profile')}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
        />

        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => {
                if (viewMode === 'week') navigateWeek(-1)
                if (viewMode === 'day') navigateDay(-1)
                if (viewMode === 'month') navigateMonth(-1)
              }}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={hp(2.2)} color={theme.colors.charcoal} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getViewTitle()}</Text>
            <TouchableOpacity
              onPress={() => {
                if (viewMode === 'week') navigateWeek(1)
                if (viewMode === 'day') navigateDay(1)
                if (viewMode === 'month') navigateMonth(1)
              }}
              style={styles.navButton}
            >
              <Ionicons name="chevron-forward" size={hp(2.2)} color={theme.colors.charcoal} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setIsCreateEventModalVisible(true)}
            style={styles.createButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.bondedPurple, '#C77DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add" size={hp(2.2)} color={theme.colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Calendar Filter Chips */}
        <View style={styles.calendarFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarFilterScrollContent}
          >
            <Chip
              label="All"
              active={calendarFilter === 'all'}
              onPress={() => setCalendarFilter('all')}
              style={styles.filterChip}
            />
            <Chip
              label="Public"
              active={calendarFilter === 'public'}
              onPress={() => setCalendarFilter('public')}
              style={styles.filterChip}
            />
            <Chip
              label="Private"
              active={calendarFilter === 'private'}
              onPress={() => setCalendarFilter('private')}
              style={styles.filterChip}
            />
            <Chip
              label="School"
              active={calendarFilter === 'school-wide'}
              onPress={() => setCalendarFilter('school-wide')}
              style={styles.filterChip}
            />
            <Chip
              label="Orgs"
              active={calendarFilter === 'orgs'}
              onPress={() => setCalendarFilter('orgs')}
              style={styles.filterChip}
            />
          </ScrollView>
        </View>

        {/* View Mode Chips */}
        <View style={styles.viewModeContainer}>
          <Chip
            label="Week"
            active={viewMode === 'week'}
            onPress={() => setViewMode('week')}
            style={styles.viewModeChip}
          />
          <Chip
            label="Day"
            active={viewMode === 'day'}
            onPress={() => setViewMode('day')}
            style={styles.viewModeChip}
          />
          <Chip
            label="Month"
            active={viewMode === 'month'}
            onPress={() => setViewMode('month')}
            style={styles.viewModeChip}
          />
        </View>

        {/* Calendar View */}
        <ScrollView 
          style={styles.calendarContent}
          contentContainerStyle={styles.calendarContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderView()}
        </ScrollView>

        <BottomNav />

        <CreateEventModal
          visible={isCreateEventModalVisible}
          onClose={() => setIsCreateEventModalVisible(false)}
          onSuccess={() => {
            setIsCreateEventModalVisible(false)
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
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    flex: 1,
  },
  navButton: {
    padding: hp(0.5),
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
    letterSpacing: -0.3,
  },
  createButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.bondedPurple,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  createButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarFilterContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
    paddingVertical: hp(1),
  },
  calendarFilterScrollContent: {
    paddingHorizontal: wp(4),
    gap: wp(2),
    alignItems: 'center',
  },
  filterChip: {
    marginRight: wp(2),
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    gap: wp(2),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  viewModeChip: {
    flex: 1,
  },
  calendarContent: {
    flex: 1,
    backgroundColor: theme.colors.offWhite,
  },
  calendarContentContainer: {
    paddingBottom: hp(10),
  },
  weekContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
  },
  daySection: {
    marginBottom: hp(2.5),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  dayHeaderToday: {
    backgroundColor: theme.colors.bondedPurple + '08',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  dayName: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.softBlack,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayNameToday: {
    color: theme.colors.bondedPurple,
    fontWeight: '700',
  },
  dayNumberContainer: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.offWhite,
  },
  dayNumberContainerToday: {
    backgroundColor: theme.colors.bondedPurple,
  },
  dayNumber: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
  },
  dayNumberToday: {
    color: theme.colors.white,
  },
  dayEventCount: {
    backgroundColor: theme.colors.bondedPurple + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.pill,
  },
  dayEventCountText: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.bondedPurple,
  },
  eventsList: {
    padding: wp(4),
    gap: hp(1),
  },
  eventCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    padding: hp(1.5),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  eventCardContent: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#000000',
    marginBottom: hp(0.5),
  },
  eventCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    flexWrap: 'wrap',
  },
  eventCardTime: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.7,
  },
  eventCardLocation: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.7,
    flex: 1,
  },
  noEvents: {
    padding: hp(3),
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
  },
  emptyStateText: {
    fontSize: hp(1.3),
    color: '#8E8E93',
    fontWeight: '400',
  },
  dayContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: hp(8),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  hourLabel: {
    width: wp(15),
    paddingTop: hp(0.8),
    paddingHorizontal: wp(3),
    borderRightWidth: 1,
    borderRightColor: theme.colors.offWhite,
  },
  hourText: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.6,
    fontWeight: '500',
  },
  hourContent: {
    flex: 1,
    padding: hp(0.8),
    position: 'relative',
  },
  hourLine: {
    height: 1,
    backgroundColor: theme.colors.offWhite,
    marginTop: hp(0.5),
  },
  dayEventCard: {
    padding: hp(1.2),
    borderRadius: theme.radius.lg,
    marginBottom: hp(0.8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dayEventTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: hp(0.3),
  },
  dayEventTime: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.white,
    opacity: 0.95,
    marginBottom: hp(0.3),
    fontWeight: '500',
  },
  dayEventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.2),
  },
  dayEventLocation: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.white,
    opacity: 0.9,
    flex: 1,
  },
  monthContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDayHeader: {
    width: '14.28%',
    paddingVertical: hp(1.2),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  monthDayHeaderText: {
    fontSize: hp(1.2),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.softBlack,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: wp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    backgroundColor: theme.colors.white,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  monthDayCellToday: {
    backgroundColor: theme.colors.bondedPurple + '10',
    borderColor: theme.colors.bondedPurple,
    borderWidth: 2,
  },
  monthDayNumber: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  monthDayNumberToday: {
    color: theme.colors.bondedPurple,
    fontWeight: '700',
  },
  monthEventDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(0.8),
    marginTop: hp(0.3),
    width: '100%',
  },
  monthEventDot: {
    width: hp(0.7),
    height: hp(0.7),
    borderRadius: hp(0.35),
  },
  monthEventDotMore: {
    fontSize: hp(1),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.6,
    fontWeight: '600',
  },
})
