/**
 * MomNextDoor Booking System - Backend Server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

// Import routes
const appointmentRoutes = require('./routes/appointments');
const availabilityRoutes = require('./routes/availability');
const assistantRoutes = require('./routes/assistant');
const adminRoutes = require('./routes/admin');

// Import services
const { initializeGoogleCalendar } = require('./services/googleCalendar');
const { runReminderJob } = require('./jobs/reminderJob');
const { runAnalyticsJob } = require('./jobs/analyticsJob');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // Logging

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.API_RATE_WINDOW || 15) * 60 * 1000, // 15 minutes
    max: process.env.API_RATE_LIMIT || 100,
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// API Routes
app.use('/api/bookings', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/admin', adminRoutes);

// Smart suggestions endpoint
app.post('/api/smart-suggestions', async (req, res) => {
    try {
        const { date, duration, preferences, timezone } = req.body;

        // Import smart scheduling service
        const { getSmartSuggestions } = require('./services/smartScheduling');

        const suggestions = await getSmartSuggestions(date, duration, preferences, timezone);

        res.json(suggestions);
    } catch (error) {
        console.error('Error getting smart suggestions:', error);
        res.status(500).json({ error: 'Failed to get smart suggestions' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500,
            timestamp: new Date().toISOString()
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            status: 404,
            path: req.path
        }
    });
});

// Initialize services
async function initializeServices() {
    try {
        console.log('Initializing services...');

        // Initialize Google Calendar (optional - skip if not configured)
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            try {
                await initializeGoogleCalendar();
                console.log('✓ Google Calendar initialized');
            } catch (error) {
                console.log('⚠ Google Calendar not configured (optional):', error.message);
            }
        } else {
            console.log('⚠ Google Calendar not configured (optional)');
        }

        // Initialize database (optional for demo)
        try {
            const { initializeDatabase } = require('./config/database');
            await initializeDatabase();
            console.log('✓ Database connected');
        } catch (error) {
            console.log('⚠ Database not configured (using in-memory storage)');
        }

        // Schedule cron jobs
        scheduleCronJobs();
        console.log('✓ Cron jobs scheduled');

        console.log('All services initialized successfully');
    } catch (error) {
        console.error('Failed to initialize services:', error);
        // Don't exit in development mode
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}

// Schedule cron jobs
function scheduleCronJobs() {
    // Send reminders every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running reminder job...');
        await runReminderJob();
    });

    // Generate analytics report daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('Running analytics job...');
        await runAnalyticsJob();
    });

    // Clean up old appointments weekly
    cron.schedule('0 3 * * 0', async () => {
        console.log('Running cleanup job...');
        const { runCleanupJob } = require('./jobs/cleanupJob');
        await runCleanupJob();
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, async () => {
        console.log(`\n🚀 MomNextDoor Booking API Server`);
        console.log(`📍 Running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}\n`);

        // Initialize services after server starts
        await initializeServices();
    });
}

module.exports = app;