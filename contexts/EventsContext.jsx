import React, { createContext, useState, useContext, useEffect } from 'react'

const EventsContext = createContext()

// Generate mock events for testing
const generateMockEvents = () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const mockEvents = {}
  
  // Helper to create date
  const createDate = (daysFromToday, hours, minutes = 0) => {
    const date = new Date(today)
    date.setDate(date.getDate() + daysFromToday)
    date.setHours(hours, minutes, 0, 0)
    return date.toISOString()
  }
  
  // Helper to create end date
  const createEndDate = (daysFromToday, hours, minutes = 0, durationHours = 1) => {
    const date = new Date(today)
    date.setDate(date.getDate() + daysFromToday)
    date.setHours(hours + durationHours, minutes, 0, 0)
    return date.toISOString()
  }
  
  // Today's events (some overlapping)
  mockEvents['event-1'] = {
    id: 'event-1',
    title: 'CS 101 Lecture',
    description: 'Introduction to Computer Science - Chapter 5: Data Structures',
    location: 'Engineering Building, Room 201',
    category: 'academic',
    startDate: createDate(0, 9, 0), // Today 9:00 AM
    endDate: createEndDate(0, 9, 0, 1.5), // Today 10:30 AM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-2, 10, 0),
    attendees: ['user-123', 'user-456', 'user-789'],
    interested: ['user-101'],
    comments: [],
  }
  
  mockEvents['event-2'] = {
    id: 'event-2',
    title: 'Basketball Team Practice',
    description: 'Weekly team practice session',
    location: 'Gymnasium, Court 2',
    category: 'sports',
    startDate: createDate(0, 10, 0), // Today 10:00 AM (overlaps with CS 101)
    endDate: createEndDate(0, 10, 0, 2), // Today 12:00 PM
    isPublic: false,
    maxAttendees: 15,
    requireApproval: true,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: [],
    clubId: 'club-basketball',
    createdAt: createDate(-5, 14, 0),
    attendees: ['user-123', 'user-202', 'user-303'],
    interested: [],
    comments: [],
  }
  
  mockEvents['event-3'] = {
    id: 'event-3',
    title: 'Study Group: Calculus',
    description: 'Review session for midterm exam',
    location: 'Library, Study Room 3',
    category: 'academic',
    startDate: createDate(0, 14, 0), // Today 2:00 PM
    endDate: createEndDate(0, 14, 0, 2), // Today 4:00 PM
    isPublic: true,
    maxAttendees: 8,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic', 'forum-quad'],
    clubId: null,
    createdAt: createDate(-1, 18, 0),
    attendees: ['user-123', 'user-404', 'user-505'],
    interested: ['user-606', 'user-707'],
    comments: [],
  }
  
  mockEvents['event-4'] = {
    id: 'event-4',
    title: 'Coffee Chat with Friends',
    description: 'Casual meetup at the campus cafe',
    location: 'Student Center Cafe',
    category: 'social',
    startDate: createDate(0, 15, 30), // Today 3:30 PM (overlaps with study group)
    endDate: createEndDate(0, 15, 30, 1.5), // Today 5:00 PM
    isPublic: false,
    maxAttendees: 10,
    requireApproval: false,
    allowPlusOnes: true,
    coverImage: null,
    postedToForums: [],
    clubId: null,
    createdAt: createDate(-3, 12, 0),
    attendees: ['user-123', 'user-808'],
    interested: ['user-909'],
    comments: [],
  }
  
  // Tomorrow's events
  mockEvents['event-5'] = {
    id: 'event-5',
    title: 'CS Club Hackathon',
    description: '24-hour coding competition with prizes!',
    location: 'Engineering Building, Lab 301',
    category: 'club',
    startDate: createDate(1, 9, 0), // Tomorrow 9:00 AM
    endDate: createEndDate(1, 9, 0, 24), // Tomorrow 9:00 AM (next day)
    isPublic: true,
    maxAttendees: 50,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
    postedToForums: ['forum-quad', 'forum-events', 'forum-academic'],
    clubId: 'club-cs',
    createdAt: createDate(-7, 10, 0),
    attendees: ['user-123', 'user-111', 'user-222', 'user-333', 'user-444'],
    interested: ['user-555', 'user-666', 'user-777'],
    comments: [],
  }
  
  mockEvents['event-6'] = {
    id: 'event-6',
    title: 'Math 205 Midterm',
    description: 'Midterm examination - Bring calculator',
    location: 'Science Hall, Room 105',
    category: 'academic',
    startDate: createDate(1, 13, 0), // Tomorrow 1:00 PM
    endDate: createEndDate(1, 13, 0, 2), // Tomorrow 3:00 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-14, 9, 0),
    attendees: ['user-123', 'user-888', 'user-999'],
    interested: [],
    comments: [],
  }
  
  mockEvents['event-7'] = {
    id: 'event-7',
    title: 'Friday Night Party',
    description: 'End of week celebration! Music, food, and fun',
    location: 'Off-campus: 123 Main St',
    category: 'party',
    startDate: createDate(1, 20, 0), // Tomorrow 8:00 PM
    endDate: createEndDate(1, 20, 0, 4), // Tomorrow 12:00 AM (midnight)
    isPublic: true,
    maxAttendees: 100,
    requireApproval: false,
    allowPlusOnes: true,
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop',
    postedToForums: ['forum-quad', 'forum-events'],
    clubId: null,
    createdAt: createDate(-2, 19, 0),
    attendees: ['user-123', 'user-aaa', 'user-bbb', 'user-ccc'],
    interested: ['user-ddd', 'user-eee', 'user-fff', 'user-ggg'],
    comments: [],
  }
  
  // Day after tomorrow - overlapping events
  mockEvents['event-8'] = {
    id: 'event-8',
    title: 'Soccer Game vs Rival University',
    description: 'Home game - Come support the team!',
    location: 'Stadium',
    category: 'sports',
    startDate: createDate(2, 14, 0), // Day after tomorrow 2:00 PM
    endDate: createEndDate(2, 14, 0, 2), // Day after tomorrow 4:00 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: true,
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
    postedToForums: ['forum-quad', 'forum-events'],
    clubId: 'club-soccer',
    createdAt: createDate(-10, 12, 0),
    attendees: ['user-123', 'user-hhh', 'user-iii', 'user-jjj'],
    interested: ['user-kkk', 'user-lll'],
    comments: [],
  }
  
  mockEvents['event-9'] = {
    id: 'event-9',
    title: 'Art Exhibition Opening',
    description: 'Student art showcase - Free admission',
    location: 'Arts Building, Gallery 1',
    category: 'social',
    startDate: createDate(2, 14, 30), // Day after tomorrow 2:30 PM (overlaps with soccer)
    endDate: createEndDate(2, 14, 30, 3), // Day after tomorrow 5:30 PM
    isPublic: true,
    maxAttendees: 200,
    requireApproval: false,
    allowPlusOnes: true,
    coverImage: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop',
    postedToForums: ['forum-quad', 'forum-events'],
    clubId: 'club-art',
    createdAt: createDate(-5, 15, 0),
    attendees: ['user-123', 'user-mmm'],
    interested: ['user-nnn', 'user-ooo'],
    comments: [],
  }
  
  mockEvents['event-10'] = {
    id: 'event-10',
    title: 'Chemistry Lab Session',
    description: 'Organic Chemistry Lab - Experiment 7',
    location: 'Science Hall, Lab 203',
    category: 'academic',
    startDate: createDate(2, 15, 0), // Day after tomorrow 3:00 PM (overlaps with both)
    endDate: createEndDate(2, 15, 0, 2), // Day after tomorrow 5:00 PM
    isPublic: true,
    maxAttendees: 20,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-3, 11, 0),
    attendees: ['user-123', 'user-ppp'],
    interested: [],
    comments: [],
  }
  
  // This week - more events
  mockEvents['event-11'] = {
    id: 'event-11',
    title: 'Dance Club Practice',
    description: 'Weekly practice session',
    location: 'Arts Building, Dance Studio',
    category: 'club',
    startDate: createDate(3, 18, 0), // 3 days from today 6:00 PM
    endDate: createEndDate(3, 18, 0, 2), // 3 days from today 8:00 PM
    isPublic: false,
    maxAttendees: 25,
    requireApproval: true,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: [],
    clubId: 'club-dance',
    createdAt: createDate(-7, 17, 0),
    attendees: ['user-123'],
    interested: [],
    comments: [],
  }
  
  mockEvents['event-12'] = {
    id: 'event-12',
    title: 'Career Fair',
    description: 'Meet employers and explore career opportunities',
    location: 'Convention Center',
    category: 'academic',
    startDate: createDate(4, 10, 0), // 4 days from today 10:00 AM
    endDate: createEndDate(4, 10, 0, 6), // 4 days from today 4:00 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop',
    postedToForums: ['forum-quad', 'forum-events', 'forum-academic'],
    clubId: null,
    createdAt: createDate(-20, 9, 0),
    attendees: ['user-123', 'user-qqq', 'user-rrr'],
    interested: ['user-sss', 'user-ttt', 'user-uuu'],
    comments: [],
  }
  
  // Next week
  mockEvents['event-13'] = {
    id: 'event-13',
    title: 'Spring Break Planning Meeting',
    description: 'Plan the ultimate spring break trip',
    location: 'Student Center, Room 204',
    category: 'social',
    startDate: createDate(7, 19, 0), // 7 days from today 7:00 PM
    endDate: createEndDate(7, 19, 0, 1.5), // 7 days from today 8:30 PM
    isPublic: false,
    maxAttendees: 15,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: [],
    clubId: null,
    createdAt: createDate(-1, 20, 0),
    attendees: ['user-123', 'user-vvv'],
    interested: ['user-www'],
    comments: [],
  }

  // ===== PUBLIC SCHOOL-WIDE EVENTS =====
  mockEvents['event-pub-1'] = {
    id: 'event-pub-1',
    title: 'Welcome Back BBQ',
    description: 'School-wide welcome event for all students',
    location: 'Main Quad',
    category: 'social',
    startDate: createDate(0, 12, 0), // Today 12:00 PM
    endDate: createEndDate(0, 12, 0, 3), // Today 3:00 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: true,
    coverImage: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=400&fit=crop',
    postedToForums: ['forum-quad'],
    clubId: null,
    createdAt: createDate(-5, 10, 0),
    attendees: ['user-123', 'user-456', 'user-789', 'user-101'],
    interested: ['user-202', 'user-303'],
    comments: [],
  }

  mockEvents['event-pub-2'] = {
    id: 'event-pub-2',
    title: 'Campus Tour Day',
    description: 'Open house for prospective students',
    location: 'Admissions Office',
    category: 'academic',
    startDate: createDate(1, 10, 0), // Tomorrow 10:00 AM
    endDate: createEndDate(1, 10, 0, 4), // Tomorrow 2:00 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-quad'],
    clubId: null,
    createdAt: createDate(-10, 9, 0),
    attendees: ['user-123'],
    interested: [],
    comments: [],
  }

  mockEvents['event-pub-3'] = {
    id: 'event-pub-3',
    title: 'Library Study Night',
    description: 'Extended hours with free coffee and snacks',
    location: 'Main Library',
    category: 'academic',
    startDate: createDate(2, 18, 0), // Day after tomorrow 6:00 PM
    endDate: createEndDate(2, 18, 0, 6), // Day after tomorrow 12:00 AM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-quad', 'forum-academic'],
    clubId: null,
    createdAt: createDate(-3, 14, 0),
    attendees: ['user-123', 'user-404'],
    interested: ['user-505'],
    comments: [],
  }

  // ===== OVERLAPPING PARTIES (Same Time) =====
  mockEvents['event-party-1'] = {
    id: 'event-party-1',
    title: 'Frat House Party',
    description: 'Biggest party of the semester!',
    location: 'Greek Row, House 12',
    category: 'party',
    startDate: createDate(1, 21, 0), // Tomorrow 9:00 PM
    endDate: createEndDate(1, 21, 0, 5), // Tomorrow 2:00 AM
    isPublic: true,
    maxAttendees: 150,
    requireApproval: false,
    allowPlusOnes: true,
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop',
    postedToForums: ['forum-quad', 'forum-events'],
    clubId: null,
    createdAt: createDate(-2, 18, 0),
    attendees: ['user-123', 'user-aaa', 'user-bbb', 'user-ccc', 'user-ddd'],
    interested: ['user-eee', 'user-fff'],
    comments: [],
  }

  mockEvents['event-party-2'] = {
    id: 'event-party-2',
    title: 'Dorm Block Party',
    description: 'All dorms welcome! Music, games, food',
    location: 'Residence Hall Quad',
    category: 'party',
    startDate: createDate(1, 21, 0), // Tomorrow 9:00 PM (OVERLAPS with party-1)
    endDate: createEndDate(1, 21, 0, 4), // Tomorrow 1:00 AM
    isPublic: true,
    maxAttendees: 200,
    requireApproval: false,
    allowPlusOnes: true,
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
    postedToForums: ['forum-quad', 'forum-events'],
    clubId: null,
    createdAt: createDate(-1, 19, 0),
    attendees: ['user-123', 'user-ggg', 'user-hhh'],
    interested: ['user-iii', 'user-jjj', 'user-kkk'],
    comments: [],
  }

  // ===== OVERLAPPING ORG EVENTS (Same Time) =====
  mockEvents['event-org-1'] = {
    id: 'event-org-1',
    title: 'CS Club Workshop: React Native',
    description: 'Learn mobile app development',
    location: 'Engineering Building, Lab 205',
    category: 'club',
    startDate: createDate(0, 15, 0), // Today 3:00 PM
    endDate: createEndDate(0, 15, 0, 2), // Today 5:00 PM
    isPublic: false,
    maxAttendees: 30,
    requireApproval: true,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: [],
    clubId: 'club-cs',
    createdAt: createDate(-3, 12, 0),
    attendees: ['user-123', 'user-111', 'user-222'],
    interested: ['user-333'],
    comments: [],
  }

  mockEvents['event-org-2'] = {
    id: 'event-org-2',
    title: 'Art Club Life Drawing Session',
    description: 'Bring your sketchbook and pencils',
    location: 'Arts Building, Studio 3',
    category: 'club',
    startDate: createDate(0, 15, 0), // Today 3:00 PM (OVERLAPS with org-1)
    endDate: createEndDate(0, 15, 0, 2.5), // Today 5:30 PM
    isPublic: false,
    maxAttendees: 20,
    requireApproval: true,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: [],
    clubId: 'club-art',
    createdAt: createDate(-4, 11, 0),
    attendees: ['user-123', 'user-mmm'],
    interested: ['user-nnn'],
    comments: [],
  }

  // ===== MORE PRIVATE EVENTS =====
  mockEvents['event-priv-1'] = {
    id: 'event-priv-1',
    title: 'Study Group: Physics 201',
    description: 'Review for upcoming exam',
    location: 'Library, Study Room 5',
    category: 'academic',
    startDate: createDate(0, 16, 0), // Today 4:00 PM
    endDate: createEndDate(0, 16, 0, 2), // Today 6:00 PM
    isPublic: false,
    maxAttendees: 6,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: [],
    clubId: null,
    createdAt: createDate(-2, 15, 0),
    attendees: ['user-123', 'user-404', 'user-505'],
    interested: [],
    comments: [],
  }

  mockEvents['event-priv-2'] = {
    id: 'event-priv-2',
    title: 'Roommate Dinner',
    description: 'Monthly roommate bonding dinner',
    location: 'Off-campus: Italian Restaurant',
    category: 'social',
    startDate: createDate(1, 19, 0), // Tomorrow 7:00 PM
    endDate: createEndDate(1, 19, 0, 2), // Tomorrow 9:00 PM
    isPublic: false,
    maxAttendees: 4,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: [],
    clubId: null,
    createdAt: createDate(-5, 18, 0),
    attendees: ['user-123', 'user-808'],
    interested: [],
    comments: [],
  }

  mockEvents['event-priv-3'] = {
    id: 'event-priv-3',
    title: 'Gym Session with Friends',
    description: 'Morning workout',
    location: 'Campus Gym',
    category: 'sports',
    startDate: createDate(2, 7, 0), // Day after tomorrow 7:00 AM
    endDate: createEndDate(2, 7, 0, 1.5), // Day after tomorrow 8:30 AM
    isPublic: false,
    maxAttendees: 5,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: [],
    clubId: null,
    createdAt: createDate(-1, 20, 0),
    attendees: ['user-123', 'user-101'],
    interested: [],
    comments: [],
  }

  // ===== ACADEMIC CALENDAR - WEEKLY CLASSES =====
  // These are recurring classes that show up every week
  const getDayOfWeek = (daysFromToday) => {
    const date = new Date(today)
    date.setDate(date.getDate() + daysFromToday)
    return date.getDay() // 0 = Sunday, 1 = Monday, etc.
  }

  // Find next Monday (or today if it's Monday)
  const getNextMonday = () => {
    const date = new Date(today)
    const day = date.getDay()
    const diff = day === 0 ? 1 : (8 - day) % 7 || 7
    date.setDate(date.getDate() + (diff === 7 ? 0 : diff))
    return date
  }

  const nextMonday = getNextMonday()
  const mondayOffset = Math.floor((nextMonday - today) / (1000 * 60 * 60 * 24))

  // Monday classes
  mockEvents['class-monday-1'] = {
    id: 'class-monday-1',
    title: 'CS 101 - Introduction to Computer Science',
    description: 'MWF Lecture - Data Structures and Algorithms',
    location: 'Engineering Building, Room 201',
    category: 'academic',
    startDate: createDate(mondayOffset, 9, 0), // Monday 9:00 AM
    endDate: createEndDate(mondayOffset, 9, 0, 1.5), // Monday 10:30 AM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-456', 'user-789'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }

  mockEvents['class-monday-2'] = {
    id: 'class-monday-2',
    title: 'MATH 205 - Calculus II',
    description: 'MWF Lecture - Integration Techniques',
    location: 'Science Hall, Room 105',
    category: 'academic',
    startDate: createDate(mondayOffset, 11, 0), // Monday 11:00 AM
    endDate: createEndDate(mondayOffset, 11, 0, 1.5), // Monday 12:30 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-888'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }

  mockEvents['class-monday-3'] = {
    id: 'class-monday-3',
    title: 'PHYS 201 - Physics for Engineers',
    description: 'MWF Lecture - Mechanics',
    location: 'Science Hall, Room 203',
    category: 'academic',
    startDate: createDate(mondayOffset, 14, 0), // Monday 2:00 PM
    endDate: createEndDate(mondayOffset, 14, 0, 1.5), // Monday 3:30 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-404'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }

  // Wednesday classes (same times as Monday)
  mockEvents['class-wednesday-1'] = {
    id: 'class-wednesday-1',
    title: 'CS 101 - Introduction to Computer Science',
    description: 'MWF Lecture - Data Structures and Algorithms',
    location: 'Engineering Building, Room 201',
    category: 'academic',
    startDate: createDate(mondayOffset + 2, 9, 0), // Wednesday 9:00 AM
    endDate: createEndDate(mondayOffset + 2, 9, 0, 1.5), // Wednesday 10:30 AM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-456', 'user-789'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }

  mockEvents['class-wednesday-2'] = {
    id: 'class-wednesday-2',
    title: 'MATH 205 - Calculus II',
    description: 'MWF Lecture - Integration Techniques',
    location: 'Science Hall, Room 105',
    category: 'academic',
    startDate: createDate(mondayOffset + 2, 11, 0), // Wednesday 11:00 AM
    endDate: createEndDate(mondayOffset + 2, 11, 0, 1.5), // Wednesday 12:30 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-888'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }

  mockEvents['class-wednesday-3'] = {
    id: 'class-wednesday-3',
    title: 'PHYS 201 - Physics for Engineers',
    description: 'MWF Lecture - Mechanics',
    location: 'Science Hall, Room 203',
    category: 'academic',
    startDate: createDate(mondayOffset + 2, 14, 0), // Wednesday 2:00 PM
    endDate: createEndDate(mondayOffset + 2, 14, 0, 1.5), // Wednesday 3:30 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-404'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }

  // Friday classes
  mockEvents['class-friday-1'] = {
    id: 'class-friday-1',
    title: 'CS 101 - Introduction to Computer Science',
    description: 'MWF Lecture - Data Structures and Algorithms',
    location: 'Engineering Building, Room 201',
    category: 'academic',
    startDate: createDate(mondayOffset + 4, 9, 0), // Friday 9:00 AM
    endDate: createEndDate(mondayOffset + 4, 9, 0, 1.5), // Friday 10:30 AM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-456', 'user-789'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }

  mockEvents['class-friday-2'] = {
    id: 'class-friday-2',
    title: 'MATH 205 - Calculus II',
    description: 'MWF Lecture - Integration Techniques',
    location: 'Science Hall, Room 105',
    category: 'academic',
    startDate: createDate(mondayOffset + 4, 11, 0), // Friday 11:00 AM
    endDate: createEndDate(mondayOffset + 4, 11, 0, 1.5), // Friday 12:30 PM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-888'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }

  // Tuesday/Thursday classes
  mockEvents['class-tuesday-1'] = {
    id: 'class-tuesday-1',
    title: 'CHEM 101 - General Chemistry',
    description: 'TTH Lecture - Organic Chemistry Basics',
    location: 'Science Hall, Lab 203',
    category: 'academic',
    startDate: createDate(mondayOffset + 1, 10, 0), // Tuesday 10:00 AM
    endDate: createEndDate(mondayOffset + 1, 10, 0, 1.5), // Tuesday 11:30 AM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-ppp'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }

  mockEvents['class-thursday-1'] = {
    id: 'class-thursday-1',
    title: 'CHEM 101 - General Chemistry',
    description: 'TTH Lecture - Organic Chemistry Basics',
    location: 'Science Hall, Lab 203',
    category: 'academic',
    startDate: createDate(mondayOffset + 3, 10, 0), // Thursday 10:00 AM
    endDate: createEndDate(mondayOffset + 3, 10, 0, 1.5), // Thursday 11:30 AM
    isPublic: true,
    maxAttendees: null,
    requireApproval: false,
    allowPlusOnes: false,
    coverImage: null,
    postedToForums: ['forum-academic'],
    clubId: null,
    createdAt: createDate(-30, 8, 0),
    attendees: ['user-123', 'user-ppp'],
    interested: [],
    comments: [],
    isClass: true,
    recurring: 'weekly',
  }
  
  // Generate forum posts for events
  const forumPosts = {}
  Object.values(mockEvents).forEach((event) => {
    if (event.postedToForums && event.postedToForums.length > 0) {
      event.postedToForums.forEach((forumId) => {
        if (!forumPosts[forumId]) {
          forumPosts[forumId] = []
        }
        forumPosts[forumId].push({
          id: `event-post-${event.id}-${forumId}`,
          type: 'event',
          eventId: event.id,
          forumId,
          createdAt: event.createdAt,
        })
      })
    }
  })
  
  return { events: mockEvents, forumPosts }
}

export function EventsProvider({ children }) {
  // Initialize with mock events
  const { events: initialEvents, forumPosts: initialForumPosts } = generateMockEvents()
  
  // Events organized by ID
  const [events, setEvents] = useState(initialEvents)
  
  // User RSVPs: { eventId: 'going' | 'interested' | null }
  const [userRSVPs, setUserRSVPs] = useState({})
  
  // Forum posts for events: { forumId: [{ event post objects }] }
  const [eventForumPosts, setEventForumPosts] = useState(initialForumPosts)

  // Helper to generate recurring event instances
  const generateRecurringEvents = (baseEvent, recurringType, recurringEndDate) => {
    const events = []
    const startDate = new Date(baseEvent.startDate)
    const endDate = new Date(baseEvent.endDate)
    const duration = endDate - startDate
    const endRecurringDate = new Date(recurringEndDate)
    
    let currentDate = new Date(startDate)
    let eventIndex = 0
    
    while (currentDate <= endRecurringDate) {
      const eventStart = new Date(currentDate)
      const eventEnd = new Date(eventStart.getTime() + duration)
      
      const recurringEvent = {
        ...baseEvent,
        id: `${baseEvent.id}-recurring-${eventIndex}`,
        startDate: eventStart.toISOString(),
        endDate: eventEnd.toISOString(),
        isRecurring: true,
        recurringType,
        recurringIndex: eventIndex,
        parentEventId: baseEvent.id,
      }
      
      events.push(recurringEvent)
      
      // Calculate next occurrence
      if (recurringType === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1)
      } else if (recurringType === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7)
      } else if (recurringType === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
      
      eventIndex++
    }
    
    return events
  }

  // Create new event
  const createEvent = (eventData) => {
    const baseEventId = `event-${Date.now()}`
    const baseEvent = {
      ...eventData,
      id: baseEventId,
      createdAt: new Date().toISOString(),
      attendees: [],
      interested: [],
      comments: [],
    }
    
    const eventsToCreate = []
    
    // If recurring, generate all instances
    if (eventData.isRecurring && eventData.recurringType && eventData.recurringEndDate) {
      const recurringEvents = generateRecurringEvents(
        baseEvent,
        eventData.recurringType,
        eventData.recurringEndDate
      )
      eventsToCreate.push(...recurringEvents)
    } else {
      // Single event
      eventsToCreate.push(baseEvent)
    }
    
    // Add all events to state
    setEvents((prev) => {
      const updated = { ...prev }
      eventsToCreate.forEach((event) => {
        updated[event.id] = event
      })
      return updated
    })

    // Create forum posts if specified (only for first event or all if not recurring)
    if (eventData.postedToForums && eventData.postedToForums.length > 0) {
      eventData.postedToForums.forEach((forumId) => {
        setEventForumPosts((prev) => {
          const newPosts = eventsToCreate.map((event) => ({
            id: `event-post-${event.id}-${forumId}`,
            type: 'event',
            eventId: event.id,
            forumId,
            createdAt: event.createdAt,
          }))
          
          return {
            ...prev,
            [forumId]: [...newPosts, ...(prev[forumId] || [])],
          }
        })
      })
    }

    return baseEventId
  }

  // Get event by ID
  const getEvent = (eventId) => {
    return events[eventId] || null
  }

  // Get all events
  const getAllEvents = () => {
    return Object.values(events)
  }

  // Get events for a specific forum
  const getForumEventPosts = (forumId) => {
    const postIds = eventForumPosts[forumId] || []
    return postIds.map((post) => ({
      ...post,
      event: events[post.eventId],
    })).filter((post) => post.event) // Only return posts with valid events
  }

  // RSVP to event
  const rsvpToEvent = (eventId, userId, status) => {
    setEvents((prev) => {
      const event = prev[eventId]
      if (!event) return prev

      // Remove from both arrays first
      const attendees = (event.attendees || []).filter((id) => id !== userId)
      const interested = (event.interested || []).filter((id) => id !== userId)

      // Add to appropriate array
      if (status === 'going') {
        attendees.push(userId)
      } else if (status === 'interested') {
        interested.push(userId)
      }

      return {
        ...prev,
        [eventId]: {
          ...event,
          attendees,
          interested,
        },
      }
    })

    setUserRSVPs((prev) => ({
      ...prev,
      [eventId]: status,
    }))
  }

  // Get user's RSVP status
  const getUserRSVP = (eventId, userId) => {
    const event = events[eventId]
    if (!event) return null

    if ((event.attendees || []).includes(userId)) return 'going'
    if ((event.interested || []).includes(userId)) return 'interested'
    return null
  }

  // Get events user is attending
  const getUserEvents = (userId) => {
    return Object.values(events).filter((event) =>
      (event.attendees || []).includes(userId)
    )
  }

  // Delete event
  const deleteEvent = (eventId) => {
    setEvents((prev) => {
      const { [eventId]: deleted, ...rest } = prev
      return rest
    })

    // Remove forum posts
    setEventForumPosts((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((forumId) => {
        updated[forumId] = updated[forumId].filter(
          (post) => post.eventId !== eventId
        )
      })
      return updated
    })
  }

  return (
    <EventsContext.Provider
      value={{
        events,
        createEvent,
        getEvent,
        getAllEvents,
        getForumEventPosts,
        rsvpToEvent,
        getUserRSVP,
        getUserEvents,
        deleteEvent,
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export const useEventsContext = () => {
  const context = useContext(EventsContext)
  if (!context) {
    throw new Error('useEventsContext must be used within EventsProvider')
  }
  return context
}

