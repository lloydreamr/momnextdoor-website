# Hybrid Appointment Booking System - Implementation Plan

## Executive Summary
A smart appointment booking system that combines intelligent scheduling with conversational elements, integrated with Domina's Google Calendar for seamless availability management.

## Core Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
├─────────────────────────────────────────────────────────┤
│          Smart Booking Interface Components              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Calendar View │  │Chat Assistant│  │Booking Form  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    API Layer (Node.js)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Appointment Booking Service              │  │
│  │  - Availability Check                            │  │
│  │  - Smart Suggestions                             │  │
│  │  - Booking Creation                              │  │
│  │  - Preference Learning                           │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  External Integrations                   │
│  ┌────────────────┐  ┌────────────────┐                │
│  │ Google Calendar │  │  Email Service │                │
│  │      API        │  │   (SendGrid)   │                │
│  └────────────────┘  └────────────────┘                │
├─────────────────────────────────────────────────────────┤
│                    Database (PostgreSQL)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Appointments │  │    Users     │  │ Preferences  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Phase 1: Foundation (Week 1-2)

### 1.1 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    preferred_times JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    google_event_id VARCHAR(255) UNIQUE,
    title VARCHAR(255) NOT NULL,
    meeting_type VARCHAR(50), -- 'consultation', 'follow-up', 'urgent'
    duration_minutes INTEGER DEFAULT 30,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    meeting_url VARCHAR(500),
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'rescheduled'
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    preferred_days JSONB, -- ["Monday", "Wednesday", "Friday"]
    preferred_time_slots JSONB, -- [{"start": "09:00", "end": "12:00"}]
    buffer_minutes INTEGER DEFAULT 15,
    advance_booking_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Booking patterns table (for ML/intelligence)
CREATE TABLE booking_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    day_of_week INTEGER,
    hour_of_day INTEGER,
    booking_count INTEGER DEFAULT 1,
    success_rate DECIMAL(3,2),
    avg_duration_minutes INTEGER,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 Google Calendar Integration

```javascript
// services/googleCalendar.js
class GoogleCalendarService {
    constructor() {
        this.auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URL
        );
    }

    async getAvailability(startDate, endDate) {
        // Fetch busy times from Google Calendar
        const calendar = google.calendar({ version: 'v3', auth: this.auth });
        const response = await calendar.freebusy.query({
            resource: {
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                items: [{ id: process.env.DOMINA_CALENDAR_ID }]
            }
        });
        return this.processAvailability(response.data);
    }

    async createEvent(appointmentData) {
        // Create calendar event
        const event = {
            summary: appointmentData.title,
            description: appointmentData.purpose,
            start: { dateTime: appointmentData.start },
            end: { dateTime: appointmentData.end },
            attendees: [{ email: appointmentData.userEmail }],
            conferenceData: {
                createRequest: { requestId: appointmentData.id }
            }
        };
        return await calendar.events.insert({
            calendarId: process.env.DOMINA_CALENDAR_ID,
            resource: event,
            conferenceDataVersion: 1
        });
    }
}
```

## Phase 2: Smart Scheduling Core (Week 3-4)

### 2.1 Availability Engine

```javascript
// services/smartScheduling.js
class SmartSchedulingService {
    async getSuggestedSlots(userId, requestedDate, duration = 30) {
        // 1. Get Domina's availability from Google Calendar
        const availability = await googleCalendar.getAvailability(
            startOfDay(requestedDate),
            endOfDay(requestedDate)
        );

        // 2. Get user's preferred times
        const userPrefs = await getUserPreferences(userId);

        // 3. Apply smart filters
        const slots = this.generateTimeSlots(availability, duration);
        const scoredSlots = this.scoreSlots(slots, userPrefs);

        // 4. Return top 5 suggestions
        return scoredSlots
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    scoreSlots(slots, preferences) {
        return slots.map(slot => {
            let score = 100;

            // Preferred time matching (+30 points)
            if (this.isPreferredTime(slot, preferences)) score += 30;

            // Buffer time compliance (+20 points)
            if (this.hasProperBuffer(slot)) score += 20;

            // Historical pattern matching (+25 points)
            if (this.matchesHistoricalPattern(slot)) score += 25;

            // Energy optimization (-10 for back-to-back)
            if (this.isBackToBack(slot)) score -= 10;

            return { ...slot, score };
        });
    }
}
```

### 2.2 Conversational Booking Assistant

```javascript
// components/BookingAssistant.jsx
const BookingAssistant = () => {
    const [messages, setMessages] = useState([
        { type: 'bot', text: "Hi! I can help you schedule time with Domina. When would you like to meet?" }
    ]);

    const handleUserInput = async (input) => {
        // Parse natural language input
        const intent = await parseBookingIntent(input);

        if (intent.type === 'DATE_REQUEST') {
            // Show available slots for requested date
            const slots = await getSmartSlots(intent.date);
            showSlotSuggestions(slots);
        } else if (intent.type === 'DURATION_REQUEST') {
            // Adjust duration preference
            updateBookingDuration(intent.duration);
        } else if (intent.type === 'PURPOSE_STATEMENT') {
            // Capture meeting purpose
            setMeetingPurpose(intent.purpose);
        }
    };

    return (
        <div className="booking-assistant">
            <div className="chat-window">
                {messages.map((msg, idx) => (
                    <Message key={idx} {...msg} />
                ))}
            </div>
            <div className="quick-actions">
                <button onClick={() => selectDate('tomorrow')}>
                    Tomorrow
                </button>
                <button onClick={() => selectDate('next-week')}>
                    Next Week
                </button>
                <button onClick={() => showCalendar()}>
                    Pick Date
                </button>
            </div>
        </div>
    );
};
```

## Phase 3: User Experience (Week 5-6)

### 3.1 Booking Flow UI

```jsx
// pages/BookAppointment.jsx
const BookAppointment = () => {
    const [step, setStep] = useState('SELECT_TYPE');
    const [booking, setBooking] = useState({});

    const steps = {
        SELECT_TYPE: <MeetingTypeSelector onSelect={handleTypeSelect} />,
        CHOOSE_TIME: <SmartTimeSelector booking={booking} onSelect={handleTimeSelect} />,
        ADD_DETAILS: <MeetingDetailsForm booking={booking} onSubmit={handleDetailsSubmit} />,
        CONFIRM: <BookingConfirmation booking={booking} onConfirm={handleConfirm} />
    };

    return (
        <div className="booking-container">
            <ProgressIndicator currentStep={step} />
            {steps[step]}
            <BookingAssistant context={booking} />
        </div>
    );
};
```

### 3.2 Smart Time Selector Component

```jsx
const SmartTimeSelector = ({ booking, onSelect }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [allSlots, setAllSlots] = useState([]);

    useEffect(() => {
        loadSmartSuggestions();
    }, [booking.date]);

    return (
        <div className="time-selector">
            <div className="suggested-times">
                <h3>🎯 Recommended Times</h3>
                <p>Based on your preferences and patterns</p>
                {suggestions.map(slot => (
                    <TimeSlot
                        key={slot.id}
                        {...slot}
                        recommended={true}
                        onClick={() => onSelect(slot)}
                    />
                ))}
            </div>

            <div className="all-times">
                <h3>All Available Times</h3>
                <CalendarGrid
                    slots={allSlots}
                    onSelect={onSelect}
                />
            </div>
        </div>
    );
};
```

## Phase 4: Intelligence & Optimization (Week 7-8)

### 4.1 Pattern Learning

```javascript
// services/patternLearning.js
class PatternLearningService {
    async updateUserPatterns(userId, appointment) {
        const dayOfWeek = appointment.scheduledStart.getDay();
        const hourOfDay = appointment.scheduledStart.getHours();

        // Update or create pattern record
        await db.query(`
            INSERT INTO booking_patterns
            (user_id, day_of_week, hour_of_day, booking_count)
            VALUES ($1, $2, $3, 1)
            ON CONFLICT (user_id, day_of_week, hour_of_day)
            DO UPDATE SET
                booking_count = booking_patterns.booking_count + 1,
                updated_at = NOW()
        `, [userId, dayOfWeek, hourOfDay]);
    }

    async getPredictedPreferences(userId) {
        const patterns = await db.query(`
            SELECT day_of_week, hour_of_day, booking_count
            FROM booking_patterns
            WHERE user_id = $1
            ORDER BY booking_count DESC
            LIMIT 10
        `, [userId]);

        return this.analyzePatterns(patterns);
    }
}
```

### 4.2 Automated Reminders & Follow-ups

```javascript
// jobs/reminderJob.js
const sendReminders = async () => {
    // Get appointments happening in next 24 hours
    const upcomingAppointments = await getUpcomingAppointments(24);

    for (const apt of upcomingAppointments) {
        if (!apt.reminderSent) {
            await sendEmail({
                to: apt.userEmail,
                template: 'appointment-reminder',
                data: {
                    userName: apt.userName,
                    meetingTime: formatTime(apt.scheduledStart),
                    meetingUrl: apt.meetingUrl,
                    purpose: apt.purpose
                }
            });

            await markReminderSent(apt.id);
        }
    }
};

// Schedule job to run every hour
cron.schedule('0 * * * *', sendReminders);
```

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Set up project structure and database
- [ ] Implement Google Calendar OAuth flow
- [ ] Create basic availability fetching
- [ ] Design API endpoints

### Week 3-4: Smart Scheduling
- [ ] Build availability engine
- [ ] Implement slot scoring algorithm
- [ ] Create preference learning system
- [ ] Add buffer time management

### Week 5-6: User Interface
- [ ] Design booking flow UI
- [ ] Build conversational assistant
- [ ] Create time selector components
- [ ] Implement responsive design

### Week 7-8: Intelligence & Polish
- [ ] Add pattern recognition
- [ ] Implement automated reminders
- [ ] Create analytics dashboard for Domina
- [ ] Add timezone handling
- [ ] Performance optimization
- [ ] User testing and refinement

## API Endpoints

```yaml
# Availability
GET /api/availability
  params:
    date: string (ISO date)
    duration: number (minutes)
    timezone: string
  response:
    suggestions: Array<TimeSlot>
    allSlots: Array<TimeSlot>

# Booking
POST /api/appointments
  body:
    userId: string
    startTime: datetime
    duration: number
    meetingType: string
    purpose: string
  response:
    appointment: Appointment
    calendarEvent: GoogleEvent

# User Preferences
GET /api/users/:id/preferences
PUT /api/users/:id/preferences

# Patterns
GET /api/users/:id/patterns
```

## Tech Stack

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **date-fns** - Date handling
- **React Query** - Data fetching

### Backend
- **Node.js + Express** - API server
- **PostgreSQL** - Database
- **Google Calendar API** - Calendar integration
- **SendGrid** - Email service
- **node-cron** - Job scheduling
- **JWT** - Authentication

### Infrastructure
- **Vercel** - Frontend hosting
- **Railway/Render** - Backend hosting
- **Supabase** - Database hosting
- **Redis** - Caching (optional)

## Key Features Summary

1. **Smart Time Suggestions**
   - AI-powered slot recommendations
   - Pattern-based learning
   - Timezone intelligent

2. **Conversational Booking**
   - Natural language understanding
   - Guided booking flow
   - Quick action buttons

3. **Calendar Integration**
   - Real-time availability
   - Automatic event creation
   - Meeting URL generation

4. **User Experience**
   - Mobile-responsive design
   - Progress tracking
   - Instant confirmations

5. **Automation**
   - Smart reminders
   - Pre-meeting preparation
   - Follow-up scheduling

## Success Metrics

- **Booking Completion Rate**: Target >80%
- **Time to Book**: Target <2 minutes
- **User Satisfaction**: Target >4.5/5
- **Scheduling Conflicts**: Target <1%
- **No-show Rate**: Target <5%

## Next Steps

1. **Technical Setup**
   - Initialize repository
   - Set up development environment
   - Configure Google Cloud project

2. **Design Phase**
   - Create detailed wireframes
   - Design component library
   - Plan user testing sessions

3. **Development Sprint**
   - Start with MVP features
   - Weekly iterations
   - Continuous deployment

This hybrid approach provides the best of both worlds - intelligent scheduling that saves time while maintaining a conversational, user-friendly experience.