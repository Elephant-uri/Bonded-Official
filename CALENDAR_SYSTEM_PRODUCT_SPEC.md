# Calendar System - Product Specification

## Overview

Bonded's calendar system integrates personal user calendars with organization calendars, enabling seamless event management and automatic synchronization. Organizations can create events on their calendars and automatically add them to their members' personal calendars with notifications.

---

## Core Features

### 1. Personal Calendar
- **Month View**: Traditional calendar grid showing all events
- **Week View**: Detailed weekly schedule
- **Day View**: Hour-by-hour daily view
- **List/Schedule View**: Chronological list of upcoming events
- **Event Filtering**: Filter by event type (personal, organization, campus, tasks)
- **Event Categories**: Color-coded events by source/type
- **RSVP Management**: Accept, decline, or mark "maybe" for events
- **Event Details**: Full event information with location, description, attendees

### 2. Organization Calendars
- **Multiple Calendars**: Organizations can create multiple calendars (e.g., "Main Calendar", "Events", "Meetings", "Social")
- **Calendar Customization**: Each calendar has a name, description, and color
- **Default Calendar**: One default calendar per organization
- **Calendar Management**: Admins can create, edit, and delete calendars
- **Calendar View**: Dedicated view showing only organization's events

### 3. Event Distribution
- **Automatic Distribution**: When org creates event, automatically appears on all members' calendars
- **Selective Distribution**: Choose who receives the event:
  - All members
  - Specific roles (admins, members, moderators)
  - Specific users (hand-picked individuals)
- **Distribution Settings**: Per-event control over distribution
- **Event Visibility**: Control whether event appears in members' calendars

### 4. Calendar Subscriptions
- **Auto-Subscription**: Automatically subscribed to org's default calendar when joining
- **Manual Subscription**: Subscribe to additional org calendars
- **Unsubscribe**: Unsubscribe from org calendars at any time
- **Subscription Management**: View and manage all calendar subscriptions
- **Calendar Visibility**: Show/hide specific org calendars in personal calendar view

### 5. Notifications
- **Event Added Notifications**: Receive notification when org adds event to your calendar
- **Event Updated Notifications**: Get notified when org updates an event
- **Event Cancelled Notifications**: Alert when org cancels an event
- **Notification Preferences**: Per-organization notification settings:
  - Push notifications (on/off)
  - Email notifications (on/off)
  - In-app notifications (on/off)
  - Quiet hours (time range when notifications are muted)

### 6. Event Creation
- **Personal Events**: Create events for yourself
- **Organization Events**: Create events as org admin/moderator
- **Event Details**: Title, description, date/time, location, image
- **Event Visibility**: Public, school-wide, org-only, or invite-only
- **Distribution Options**: Choose how to distribute org events to members
- **Recurring Events**: Support for weekly/monthly recurring events (future)

---

## User Roles & Permissions

### Regular User
- View personal calendar
- Create personal events
- Subscribe/unsubscribe to org calendars
- Manage notification preferences
- RSVP to events
- View event details

### Organization Member
- All regular user permissions
- View organization calendar
- See org events in personal calendar
- Receive notifications for org events

### Organization Admin/Moderator
- All member permissions
- Create/edit/delete org calendars
- Create events on org calendars
- Distribute events to members
- View subscription analytics
- Manage event distribution settings

---

## User Journeys

### Journey 1: Organization Creates Event for All Members

**Actor**: Organization Admin

**Steps**:
1. Admin navigates to organization's calendar page
2. Clicks "Create Event" button
3. Fills out event details:
   - Event title: "Spring Social Mixer"
   - Description: "Join us for food, music, and networking"
   - Date & Time: March 15, 2024, 6:00 PM - 9:00 PM
   - Location: Student Center Ballroom
   - Upload event image
4. Selects "Main Calendar" from calendar dropdown
5. Toggles "Add to member calendars" ON
6. Selects distribution: "All members"
7. Clicks "Create Event"

**System Actions**:
- Event is created on organization's calendar
- System automatically adds event to all active members' personal calendars
- System sends push/in-app notifications to all subscribed members
- Event appears in members' calendar views immediately

**Outcome**: All organization members see the event in their personal calendars and receive notifications

---

### Journey 2: User Receives Organization Event

**Actor**: Organization Member

**Steps**:
1. User receives push notification: "New Event: Spring Social Mixer"
2. User taps notification
3. App opens to event detail page
4. User sees:
   - Event title, description, date/time, location
   - Organization name
   - RSVP options (Going, Maybe, Can't Go)
   - Other attendees (if visible)
5. User taps "Going" to RSVP
6. Event is now marked in their calendar

**System Actions**:
- Notification is marked as read
- RSVP status is saved
- Event remains visible in calendar
- User can set reminder for event

**Outcome**: User is aware of the event, has RSVP'd, and can see it in their calendar

---

### Journey 3: User Manages Calendar Subscriptions

**Actor**: Regular User

**Steps**:
1. User navigates to Calendar app
2. Taps "Subscriptions" or gear icon
3. Sees list of subscribed calendars:
   - Computer Science Club - Main Calendar (Subscribed)
   - Basketball Team - Events Calendar (Subscribed)
   - Photography Club - Main Calendar (Subscribed)
4. User taps on "Basketball Team - Events Calendar"
5. Sees subscription details:
   - Notification preferences (Push: ON, Email: OFF, In-app: ON)
   - "Show in calendar" toggle (ON)
   - "Unsubscribe" button
6. User toggles "Show in calendar" to OFF
7. Basketball Team events are now hidden from main calendar view
8. User can still see them by viewing Basketball Team's calendar directly

**System Actions**:
- Subscription preference is saved
- Calendar view is updated to hide those events
- User can toggle visibility back on at any time

**Outcome**: User has control over which org calendars appear in their main calendar view

---

### Journey 4: User Joins Organization

**Actor**: Regular User

**Steps**:
1. User browses organizations
2. Finds "Debate Society" and taps "Join"
3. Request is sent to organization
4. Organization approves membership
5. User is now a member

**System Actions**:
- User is automatically subscribed to organization's default calendar
- Default notification preferences are set (Push: ON, Email: OFF, In-app: ON)
- All existing organization events appear in user's calendar
- User receives welcome notification about calendar subscription

**Outcome**: User is automatically set up to receive organization events

---

### Journey 5: Organization Creates Event for Specific Members

**Actor**: Organization Admin

**Steps**:
1. Admin navigates to organization's calendar
2. Clicks "Create Event"
3. Fills out event details:
   - Event title: "Leadership Team Meeting"
   - Date & Time: March 10, 2024, 3:00 PM
   - Location: Conference Room A
4. Selects "Meetings Calendar"
5. Toggles "Add to member calendars" ON
6. Selects distribution: "Specific roles"
7. Chooses roles: "Admin", "Moderator"
8. Clicks "Create Event"

**System Actions**:
- Event is created on organization's calendar
- System identifies all members with "Admin" or "Moderator" roles
- Event is added only to those members' calendars
- Only those members receive notifications

**Outcome**: Only leadership team members see and are notified about the meeting

---

### Journey 6: User Unsubscribes from Organization Calendar

**Actor**: Organization Member

**Steps**:
1. User navigates to Calendar Subscriptions
2. Finds "Photography Club - Main Calendar"
3. Taps on it
4. Scrolls to bottom
5. Taps "Unsubscribe"
6. Confirmation dialog appears: "Stop receiving events from Photography Club?"
7. User confirms

**System Actions**:
- Subscription is marked as inactive
- Future events from this org will not appear in user's calendar
- Existing events remain visible (user can manually remove if desired)
- User stops receiving notifications from this org
- User can resubscribe at any time

**Outcome**: User no longer receives events or notifications from this organization

---

### Journey 7: Organization Updates Event

**Actor**: Organization Admin

**Steps**:
1. Admin views organization calendar
2. Finds existing event "Spring Social Mixer"
3. Taps "Edit Event"
4. Changes location from "Student Center Ballroom" to "Outdoor Quad"
5. Updates time from 6:00 PM to 7:00 PM
6. Saves changes

**System Actions**:
- Event details are updated
- All members who have this event in their calendar see the updated information
- System sends "Event Updated" notifications to all subscribed members
- Notification includes what changed (location and time)

**Outcome**: All members are notified of the event changes

---

### Journey 8: User Views Organization Calendar

**Actor**: Organization Member

**Steps**:
1. User navigates to organization's page
2. Taps "Calendar" tab
3. Sees organization's dedicated calendar view
4. Views events in month/week/day format
5. Can filter by calendar (if org has multiple)
6. Taps on an event to see details
7. Can RSVP directly from org calendar view

**System Actions**:
- Shows only events from this organization
- Displays events from all org calendars (or filtered by selected calendar)
- Shows event details, RSVP status, attendee count

**Outcome**: User can see all organization events in a dedicated view

---

### Journey 9: User Creates Personal Event

**Actor**: Regular User

**Steps**:
1. User navigates to Calendar app
2. Taps "Create Event" or taps on a date
3. Fills out event details:
   - Title: "Study Group - Calculus"
   - Date & Time: March 12, 2024, 2:00 PM
   - Location: Library Study Room 3
   - Visibility: Invite Only
4. Selects friends to invite
5. Saves event

**System Actions**:
- Event is created on user's personal calendar
- Invited friends receive notifications
- Event appears only for creator and invited friends
- Event is marked as "Personal" in calendar

**Outcome**: User has created a private event with invited friends

---

### Journey 10: User Adjusts Notification Preferences

**Actor**: Regular User

**Steps**:
1. User navigates to Calendar Subscriptions
2. Taps on "Computer Science Club - Main Calendar"
3. Sees notification preferences:
   - Push Notifications: ON
   - Email Notifications: OFF
   - In-App Notifications: ON
   - Quiet Hours: 10:00 PM - 8:00 AM
4. User toggles "Email Notifications" to ON
5. Adjusts quiet hours to 11:00 PM - 7:00 AM
6. Saves preferences

**System Actions**:
- Preferences are saved for this organization
- User will now receive email notifications for this org's events
- Notifications are muted during quiet hours
- Preferences apply only to this organization

**Outcome**: User has customized notification preferences for this organization

---

## Feature Details

### Event Types

**Personal Events**
- Created by individual users
- Visibility: Invite Only (only invited users can see)
- Appear only on creator's and invitees' calendars
- Can be shared with friends

**Organization Events**
- Created by org admins/moderators
- Visibility: Org Only, Public, or School-wide
- Automatically distributed to members (if enabled)
- Appear on org calendar and member calendars

**Campus Events**
- Created by school administrators or public
- Visibility: Public or School-wide
- Visible to all students at the university
- Appear in campus-wide event feed

**Tasks**
- Personal reminders and to-dos
- Can have due dates
- Appear in calendar view
- Can be marked as complete

### Calendar Views

**Month View**
- Traditional calendar grid
- Shows all events for the month
- Color-coded by event type/source
- Tap date to see day's events
- Swipe to navigate months

**Week View**
- Seven-day weekly schedule
- Shows events in time slots
- Scrollable timeline
- Tap event for details
- Swipe to navigate weeks

**Day View**
- Single day detailed view
- Hour-by-hour breakdown
- Shows all events for the day
- Tap event for full details
- Swipe to navigate days

**List/Schedule View**
- Chronological list of upcoming events
- Shows next 30 days (or all future events)
- Grouped by date
- Shows event title, time, location
- Tap for full details
- Infinite scroll for past events

### Event Distribution Options

**All Members**
- Event is added to all active members' calendars
- All members receive notifications
- Simplest distribution method

**Specific Roles**
- Event is added only to members with selected roles
- Examples: "Admin", "Moderator", "Member", "Executive Board"
- Useful for role-specific meetings or events

**Specific Users**
- Event is added only to hand-picked members
- Admin selects individual users from member list
- Useful for small group events or special invitations

### Notification Types

**Event Added**
- Triggered when org creates new event
- Includes: Event title, date/time, org name
- Links to event detail page

**Event Updated**
- Triggered when org modifies existing event
- Includes: What changed (time, location, description)
- Links to updated event detail page

**Event Cancelled**
- Triggered when org cancels event
- Includes: Event title, cancellation reason (if provided)
- Removes event from user's calendar (or marks as cancelled)

**Event Reminder**
- Optional reminder before event starts
- User-configurable (15 min, 1 hour, 1 day before)
- Push notification with event details

### Calendar Subscription States

**Active Subscription**
- User is subscribed to org calendar
- Receives all events from that calendar
- Receives notifications based on preferences
- Events appear in personal calendar

**Inactive Subscription**
- User has unsubscribed from org calendar
- No longer receives new events
- Existing events may remain visible
- Can resubscribe at any time

**Hidden Calendar**
- User is subscribed but has hidden calendar from main view
- Events don't appear in main calendar
- Can view events by going to org's calendar page
- Can toggle visibility back on

---

## User Stories

### As a Student
- I want to see all my events in one place so I can manage my schedule
- I want to receive notifications when my clubs add events so I don't miss important activities
- I want to filter my calendar by event type so I can focus on what matters
- I want to RSVP to events so organizers know I'm coming
- I want to create personal events and invite friends so we can coordinate

### As an Organization Member
- I want to see my organization's events in my calendar so I stay informed
- I want to subscribe to multiple org calendars so I can follow different activities
- I want to control which org calendars appear in my main view so my calendar isn't cluttered
- I want to set notification preferences per organization so I'm not overwhelmed

### As an Organization Admin
- I want to create events on my organization's calendar so members know about activities
- I want to automatically add events to members' calendars so everyone is informed
- I want to choose who receives events so I can target specific groups
- I want to see which members have events in their calendars for analytics
- I want to update or cancel events and notify members automatically

### As a University Administrator
- I want to create campus-wide events so all students are aware
- I want events to appear in all students' calendars automatically
- I want to manage event visibility and distribution centrally

---

## Use Cases

### Use Case 1: Club Social Event
**Scenario**: Photography Club wants to host a photo walk

**Steps**:
1. Club admin creates event "Photo Walk in Central Park"
2. Sets date, time, location
3. Chooses "All members" distribution
4. Event appears on all club members' calendars
5. Members receive notifications
6. Members RSVP
7. Admin can see RSVP count

**Result**: All club members are aware of the event and can plan accordingly

---

### Use Case 2: Executive Board Meeting
**Scenario**: Student Government needs to schedule a board meeting

**Steps**:
1. Admin creates event "Executive Board Meeting"
2. Sets date, time, location
3. Chooses "Specific roles" distribution
4. Selects "Executive Board" role
5. Only board members receive event and notifications
6. Regular members don't see the event

**Result**: Only relevant members are notified about the meeting

---

### Use Case 3: Study Group Coordination
**Scenario**: Student wants to organize a study group

**Steps**:
1. Student creates personal event "Study Group - Biology"
2. Sets date, time, location
3. Sets visibility to "Invite Only"
4. Selects friends to invite
5. Friends receive invitations
6. Friends can RSVP
7. Event appears on all participants' calendars

**Result**: Study group is coordinated with invited friends

---

### Use Case 4: Campus-Wide Event
**Scenario**: University wants to announce Homecoming

**Steps**:
1. University admin creates event "Homecoming 2024"
2. Sets visibility to "Public" or "School"
3. Event appears on all students' calendars
4. All students receive notifications
5. Students can RSVP and see attendee count

**Result**: Entire campus is aware of the major event

---

### Use Case 5: Multi-Calendar Organization
**Scenario**: Large organization wants separate calendars for different activities

**Steps**:
1. Org admin creates multiple calendars:
   - "Main Calendar" (default)
   - "Social Events"
   - "Meetings"
   - "Workshops"
2. Members can subscribe to specific calendars
3. Admin creates events on appropriate calendars
4. Events only go to members subscribed to that calendar
5. Members can customize which calendars appear in their main view

**Result**: Organization can organize events by category, members can choose what they follow

---

## Success Metrics

### User Engagement
- Percentage of users who subscribe to at least one org calendar
- Average number of org calendars per user
- Event RSVP rate
- Calendar app daily active users

### Organization Adoption
- Percentage of orgs that create at least one event per month
- Average events per organization
- Distribution method usage (all members vs. specific roles vs. specific users)

### Notification Effectiveness
- Notification open rate
- Event attendance rate from notifications
- Notification preference customization rate

### Calendar Usage
- Average events per user calendar
- Calendar view usage (month vs. week vs. day vs. list)
- Event filtering usage
- Calendar subscription management frequency

---

## Future Enhancements

### Phase 2 Features
- **Recurring Events**: Support for weekly/monthly recurring org events
- **Event Templates**: Orgs can create event templates for common events
- **Calendar Sharing**: Users can share their personal calendar with orgs
- **Calendar Export**: Export org calendar to iCal/Google Calendar format
- **Event Conflicts**: Warn users about calendar conflicts
- **Event Reminders**: Customizable reminders for org events

### Phase 3 Features
- **Event Analytics**: Org dashboard with attendance and engagement metrics
- **Member Engagement**: Track which members RSVP to org events
- **Event Performance**: Compare event attendance across different org calendars
- **Smart Suggestions**: AI-powered event time suggestions based on member availability

### Phase 4 Features
- **External Calendar Integration**: Sync with Google Calendar, Apple Calendar
- **Class Schedule Integration**: Auto-add class events to calendar
- **Brightspace Integration**: Sync assignments/deadlines to calendar
- **Location-Based Events**: Show nearby events based on user location

---

## Conclusion

The Bonded calendar system provides a seamless integration between personal and organization calendars, enabling efficient event management and automatic synchronization. Organizations can easily distribute events to their members, while users have full control over their calendar subscriptions and notification preferences. This creates a powerful tool for campus event coordination and student engagement.

