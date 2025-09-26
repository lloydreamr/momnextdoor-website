# MomNextDoor - Professional Cleaning Services

A modern, responsive website for MomNextDoor professional cleaning services with an integrated online booking system.

## 🚀 Features

- **Online Booking System**: Real-time availability checking and appointment scheduling
- **Mobile-First Design**: Fully responsive across all devices
- **Professional Services**: House cleaning, deep cleaning, move-in/out, office cleaning
- **Accessibility Focused**: WCAG 2.1 compliant for all users
- **Performance Optimized**: Fast loading with optimized assets
- **SEO Optimized**: Structured data and semantic HTML for search visibility
- **Contact Forms**: Validated forms with email notifications
- **Business Hours**: Dynamic display with timezone support

## 🛠 Local Development

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Git

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/momnextdoor.git
cd momnextdoor
```

2. **Backend Setup**
```bash
cd backend
npm install
npm start  # Runs on http://localhost:3000
```

3. **Frontend Setup** (new terminal)
```bash
python3 -m http.server 8081
# Access at http://localhost:8081
```

## 💻 Technologies Used

**Frontend:**
- HTML5 with semantic markup
- CSS3 with modern features (Grid, Flexbox, Custom Properties)
- Vanilla JavaScript (ES6+ modules)
- Responsive design with mobile-first approach

**Backend:**
- Node.js & Express.js
- PostgreSQL (optional, in-memory for demo)
- RESTful API architecture
- JWT authentication (optional)

## 🌐 Deployment

### GitHub Pages (Frontend)
**Live Site**: https://yourusername.github.io/momnextdoor/

Automatically deployed via GitHub Actions on push to main branch.

### Backend Options
- **Heroku**: With Postgres addon
- **Render**: Free tier available
- **Railway**: One-click deploy
- **Vercel**: Serverless functions

## 🧪 Testing

```bash
cd backend
npm test  # Run test suite
```

**Test Coverage:**
- API endpoint tests
- Form validation tests
- Availability checking tests
- UI component tests

## 📁 Project Structure

```
momnextdoor/
├── backend/              # Node.js backend API
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── __tests__/       # Test files
│   └── server.js        # Express server
├── css/                 # Stylesheets
├── js/                  # Frontend JavaScript
│   ├── booking/         # Booking system
│   ├── core/           # Core utilities
│   └── features/       # Feature modules
├── images/             # Images and icons
├── pages/              # Additional pages
└── index.html         # Main landing page
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push to branch (`git push origin feature/NewFeature`)
5. Open Pull Request

## 📞 Contact

**MomNextDoor Professional Cleaning**
- 📱 Phone: (555) 123-4567
- 📧 Email: contact@momnextdoor.com
- 🌐 Website: https://momnextdoor.com
- 📍 Service Area: Greater Metropolitan Area

---

Built with ❤️ for MomNextDoor