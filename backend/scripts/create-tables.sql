-- Database schema for MomNextDoor Booking System

-- Create database if not exists
-- CREATE DATABASE momnextdoor_booking;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'America/Edmonton',
    preferred_times JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    google_event_id VARCHAR(255) UNIQUE,
    confirmation_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    meeting_type VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    meeting_url VARCHAR(500),
    purpose TEXT,
    child_age VARCHAR(50),
    special_needs TEXT,
    status VARCHAR(50) DEFAULT 'confirmed',
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    follow_up_sent BOOLEAN DEFAULT FALSE,
    send_reminders BOOLEAN DEFAULT TRUE,
    add_to_calendar BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferred_days JSONB DEFAULT '[]',
    preferred_time_slots JSONB DEFAULT '[]',
    buffer_minutes INTEGER DEFAULT 15,
    advance_booking_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Booking patterns table (for ML/intelligence)
CREATE TABLE IF NOT EXISTS booking_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    booking_count INTEGER DEFAULT 1,
    success_rate DECIMAL(3,2),
    avg_duration_minutes INTEGER,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, day_of_week, hour_of_day)
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    cancelled_bookings INTEGER DEFAULT 0,
    no_show_bookings INTEGER DEFAULT 0,
    avg_booking_duration DECIMAL(5,2),
    popular_time_slots JSONB DEFAULT '[]',
    popular_meeting_types JSONB DEFAULT '{}',
    conversion_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Blocked time slots (for manual blocking)
CREATE TABLE IF NOT EXISTS blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    reason TEXT,
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation ON appointments(confirmation_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_booking_patterns_user ON booking_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_times ON blocked_slots(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_slots_updated_at BEFORE UPDATE ON blocked_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES
('appointment_confirmation', 'Appointment Confirmed - MomNextDoor',
'<h2>Your appointment is confirmed!</h2><p>Hi {{userName}},</p><p>Your {{meetingType}} with Domina is scheduled for {{dateTime}}.</p><p>Duration: {{duration}} minutes</p><p>Meeting Link: {{meetingUrl}}</p><p>Purpose: {{purpose}}</p><p>We look forward to speaking with you!</p>',
'Your appointment is confirmed!\n\nHi {{userName}},\n\nYour {{meetingType}} with Domina is scheduled for {{dateTime}}.\n\nDuration: {{duration}} minutes\nMeeting Link: {{meetingUrl}}\nPurpose: {{purpose}}\n\nWe look forward to speaking with you!',
'["userName", "meetingType", "dateTime", "duration", "meetingUrl", "purpose"]'::jsonb),

('appointment_reminder', 'Reminder: Your MomNextDoor Appointment Tomorrow',
'<h2>Appointment Reminder</h2><p>Hi {{userName}},</p><p>This is a friendly reminder about your {{meetingType}} with Domina tomorrow at {{time}}.</p><p>Meeting Link: {{meetingUrl}}</p><p>Please have ready any questions or topics you''d like to discuss.</p>',
'Appointment Reminder\n\nHi {{userName}},\n\nThis is a friendly reminder about your {{meetingType}} with Domina tomorrow at {{time}}.\n\nMeeting Link: {{meetingUrl}}\n\nPlease have ready any questions or topics you''d like to discuss.',
'["userName", "meetingType", "time", "meetingUrl"]'::jsonb),

('appointment_cancelled', 'Appointment Cancelled - MomNextDoor',
'<h2>Appointment Cancelled</h2><p>Hi {{userName}},</p><p>Your appointment scheduled for {{dateTime}} has been cancelled.</p><p>If you''d like to reschedule, please visit our booking page or call us at 780-904-1463.</p>',
'Appointment Cancelled\n\nHi {{userName}},\n\nYour appointment scheduled for {{dateTime}} has been cancelled.\n\nIf you''d like to reschedule, please visit our booking page or call us at 780-904-1463.',
'["userName", "dateTime"]'::jsonb)
ON CONFLICT (name) DO NOTHING;