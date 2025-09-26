# MomNextDoor Appointment Booking System

## Overview

A comprehensive appointment booking system with Google Calendar integration, smart scheduling, and conversational booking assistant.

## Features

### Frontend Features
- **Smart Booking Flow**: 4-step intuitive booking process
- **Conversational Assistant**: AI-powered chat interface for natural booking
- **Calendar Integration**: Real-time availability from Google Calendar
- **Smart Time Suggestions**: AI recommends optimal appointment times
- **Mobile Responsive**: Works seamlessly on all devices
- **Time Zone Support**: Automatic timezone detection and conversion
- **Preference Learning**: System learns user preferences over time

### Backend Features
- **Google Calendar Sync**: Direct integration with Domina's calendar
- **Smart Scheduling Engine**: Pattern-based slot recommendations
- **Email Notifications**: Automated confirmations and reminders
- **Analytics Dashboard**: Track booking patterns and metrics
- **Rate Limiting**: API protection and security
- **Database Storage**: PostgreSQL for reliability

## Project Structure

```
momnextdoor/
├── index.html                 # Main website
├── booking.html              # Booking system interface
├── css/
│   ├── main.css             # Main styles
│   └── booking.css          # Booking system styles
├── js/
│   └── booking/
│       ├── booking-main.js      # Main initialization
│       ├── booking-flow.js      # Step flow controller
│       ├── booking-calendar.js  # Calendar component
│       ├── booking-assistant.js # Chat assistant
│       └── booking-api.js       # API client
├── backend/
│   ├── server.js            # Express server
│   ├── package.json         # Dependencies
│   ├── .env.example         # Environment variables template
│   ├── config/
│   │   └── database.js      # Database configuration
│   ├── services/
│   │   ├── googleCalendar.js    # Google Calendar integration
│   │   └── smartScheduling.js   # Smart scheduling algorithms
│   ├── routes/              # API endpoints
│   ├── models/              # Data models
│   └── scripts/
│       └── create-tables.sql # Database schema
└── docs/
    ├── appointment-booking-implementation-plan.md
    └── brainstorming-appointment-booking.md
```

## Setup Instructions

### Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v13 or higher)
3. **Google Cloud Account** with Calendar API enabled
4. **SendGrid Account** (for emails) or SMTP credentials

### Step 1: Clone and Install

```bash
# Clone the repository
git clone [repository-url]
cd momnextdoor

# Install backend dependencies
cd backend
npm install
```

### Step 2: Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE momnextdoor_booking;
```

2. Run the schema script:
```bash
psql -U [username] -d momnextdoor_booking -f backend/scripts/create-tables.sql
```

### Step 3: Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Set authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Download credentials and save client ID and secret

#### Get Refresh Token:
```bash
# Use Google's OAuth playground or the provided script
node backend/scripts/get-google-token.js
```

### Step 4: Environment Configuration

1. Copy environment template:
```bash
cd backend
cp .env.example .env
```

2. Update `.env` with your credentials:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=momnextdoor_booking
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
DOMINA_CALENDAR_ID=domina@gmail.com

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=appointments@momnextdoor.ca

# Frontend
FRONTEND_URL=http://localhost:8080
```

### Step 5: Start the System

1. Start backend server:
```bash
cd backend
npm run dev  # Development mode
# or
npm start    # Production mode
```

2. Start frontend (using any static server):
```bash
# From project root
python3 -m http.server 8080
# or
npx serve .
# or
live-server
```

3. Access the system:
- Main site: http://localhost:8080
- Booking system: http://localhost:8080/booking.html
- API health check: http://localhost:3000/health

## Deployment

### Option 1: Traditional Hosting

#### Frontend (Static Files)
- **GitHub Pages**: Push to gh-pages branch
- **Netlify**: Connect GitHub repo, auto-deploy on push
- **Vercel**: Import project, deploy with one click
- **AWS S3 + CloudFront**: Upload static files to S3

#### Backend (Node.js API)
- **Heroku**:
  ```bash
  heroku create momnextdoor-api
  heroku addons:create heroku-postgresql:hobby-dev
  git push heroku main
  ```
- **Railway**: One-click deploy with PostgreSQL
- **Render**: Free tier available, auto-deploy from GitHub
- **DigitalOcean App Platform**: $5/month starter

### Option 2: Docker Deployment

1. Build Docker image:
```bash
docker build -t momnextdoor-booking .
```

2. Run with Docker Compose:
```bash
docker-compose up
```

### Option 3: Full Cloud Setup (Recommended)

1. **Frontend**: Vercel or Netlify (free)
2. **Backend**: Railway or Render ($7-20/month)
3. **Database**: Supabase PostgreSQL (free tier)
4. **Domain**: Connect custom domain

## Configuration

### Update Frontend API URL

In `js/booking/booking-api.js`, update the base URL:
```javascript
this.baseURL = 'https://api.momnextdoor.ca/api'; // Your production API URL
```

### CORS Configuration

Update `backend/server.js` CORS settings:
```javascript
app.use(cors({
    origin: 'https://momnextdoor.ca', // Your domain
    credentials: true
}));
```

## Testing

### Manual Testing Checklist

- [ ] Book appointment with each meeting type
- [ ] Test timezone conversion
- [ ] Verify email notifications
- [ ] Test calendar sync
- [ ] Check mobile responsiveness
- [ ] Test booking assistant responses
- [ ] Verify smart suggestions
- [ ] Test cancellation flow
- [ ] Check reminder system

### API Testing

```bash
# Test availability
curl -X POST http://localhost:3000/api/availability \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-15", "duration": 30}'

# Test booking creation
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "meetingType": "consultation",
    "startTime": "2025-01-15T10:00:00Z",
    "userName": "Test User",
    "userEmail": "test@example.com"
  }'
```

## Monitoring & Maintenance

### Daily Tasks
- Check appointment confirmations
- Monitor error logs
- Verify calendar sync

### Weekly Tasks
- Review analytics dashboard
- Check booking patterns
- Update blocked time slots

### Monthly Tasks
- Database backup
- Performance review
- Update email templates

## Security Considerations

1. **API Rate Limiting**: Configured at 100 requests per 15 minutes
2. **Input Validation**: All inputs sanitized with Joi
3. **SQL Injection Protection**: Parameterized queries
4. **XSS Protection**: Helmet.js security headers
5. **HTTPS Required**: Enforce SSL in production
6. **Environment Variables**: Never commit `.env` file

## Troubleshooting

### Common Issues

1. **Google Calendar not syncing**
   - Verify refresh token is valid
   - Check Calendar API is enabled
   - Confirm calendar ID is correct

2. **Emails not sending**
   - Verify SendGrid API key
   - Check from email is verified
   - Review email templates in database

3. **Database connection errors**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Ensure database exists

4. **Time zone issues**
   - Confirm server timezone setting
   - Check client timezone detection
   - Verify date-fns-tz configuration

## Support

For issues or questions:
- Technical Support: [your-email]
- Documentation: See `/docs` folder
- API Documentation: http://localhost:3000/api-docs (if swagger is added)

## Future Enhancements

- [ ] Video consultation integration
- [ ] SMS reminders
- [ ] Recurring appointments
- [ ] Multiple provider support
- [ ] Payment processing
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] Webhook integrations
- [ ] Multi-language support
- [ ] Waiting list feature

## License

Private and confidential. All rights reserved.

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Developed for**: MomNextDoor Special Needs Care