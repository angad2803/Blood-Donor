# Blood Donor Next.js App

A full-stack blood donation platform built with Next.js 14, MongoDB, and Tailwind CSS. This application connects blood donors with patients in need, featuring real-time location matching, offer management, and admin controls.

## 🚀 Features

- **User Authentication**: Secure JWT-based login and registration
- **Blood Request Management**: Create and manage blood donation requests
- **Smart Matching**: Location-based donor matching with blood type compatibility
- **Offer System**: Send, accept, and manage donation offers
- **Real-time Messaging**: Chat functionality for donors and requesters
- **Admin Panel**: User management and system oversight
- **Responsive Design**: Modern glassmorphism UI with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Styling**: Tailwind CSS, Custom CSS for glassmorphism effects
- **Icons & Components**: Lucide React, Swiper.js

## 📦 Installation

1. **Clone and navigate to the project**:

   ```bash
   cd nextjs-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your MongoDB connection string and JWT secret:

   ```
   MONGODB_URI=mongodb://localhost:27017/blood_donor_nextjs
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   ```

4. **Start MongoDB** (make sure MongoDB is running on your system)

5. **Run the development server**:

   ```bash
   npm run dev
   ```

6. **Open your browser**: Navigate to `http://localhost:3000` (or the port shown in terminal)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
nextjs-app/
├── src/
│   ├── app/                    # App Router pages and layouts
│   │   ├── api/               # API routes (backend logic)
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── user/          # User management endpoints
│   │   │   ├── request/       # Blood request endpoints
│   │   │   ├── offer/         # Offer management endpoints
│   │   │   ├── match/         # Matching and discovery endpoints
│   │   │   ├── message/       # Chat messaging endpoints
│   │   │   ├── admin/         # Admin panel endpoints
│   │   │   └── donors/        # Donor listing endpoints
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── dashboard/         # Main dashboard
│   │   └── create-request/    # Blood request creation
│   ├── components/            # Reusable React components
│   ├── context/              # React context providers
│   ├── lib/                  # Utility libraries
│   ├── models/               # MongoDB models
│   └── api/                  # API client configuration
└── public/                   # Static assets
```

## 🔐 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Management

- `GET /api/user/me` - Get current user
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/location` - Update user location

### Blood Requests

- `POST /api/request/create` - Create blood request
- `GET /api/request/all` - Get all active requests

### Offers

- `POST /api/offer/send` - Send offer to requester
- `GET /api/offer/request/[requestId]` - Get offers for a request
- `POST /api/offer/accept/[offerId]` - Accept an offer
- `GET /api/offer/my-offers` - Get user's sent offers
- `GET /api/offer/accepted` - Get accepted offers

### Matching & Discovery

- `GET /api/match` - Find compatible blood requests
- `GET /api/match/nearby` - Find nearby requests with distance filtering

### Messaging

- `GET /api/message/[requestId]` - Get messages for a request
- `POST /api/message/[requestId]` - Send message to a request chat

### Admin (requires admin privileges)

- `GET /api/admin/check-admin` - Check admin status
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/[userId]` - Delete a user

### Other

- `GET /api/donors` - Get list of donors (with filtering)

## 🎨 UI Components

The app features a modern glassmorphism design with:

- Semi-transparent cards with backdrop blur
- Gradient backgrounds
- Smooth animations and transitions
- Responsive layout for all screen sizes
- Loading spinners and error handling

## 🔧 Configuration

### MongoDB Models

- **User**: Stores user information, blood group, location, coordinates
- **BloodRequest**: Blood donation requests with urgency levels
- **Offer**: Donation offers linking donors to requests
- **Message**: Chat messages for request discussions

### Authentication

- JWT-based authentication with automatic token refresh
- Session storage for tab-specific sessions
- Fallback to localStorage for persistent sessions
- Automatic logout on token expiration

### Admin Features

- Simple email-based admin detection (customizable)
- User management and deletion
- System oversight capabilities

## 🚀 Deployment

For production deployment:

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Set production environment variables**:
   - Update MongoDB URI for production
   - Use a strong JWT secret
   - Set NODE_ENV=production

3. **Deploy to your preferred platform**:
   - Vercel (recommended for Next.js)
   - Netlify
   - DigitalOcean App Platform
   - AWS/Azure/GCP

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🔮 Future Enhancements

- Email notifications for offers and matches
- Real-time chat with Socket.io
- Push notifications
- Advanced location services with maps
- Hospital/medical facility integration
- Blood bank inventory management
- Appointment scheduling
- Rating and review system

---

**Note**: This is a migration from the original Vite/React frontend with separate Express backend to a unified Next.js full-stack application. All core functionality has been preserved and optimized for easier deployment and maintenance.
