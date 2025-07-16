# 🩸 Blood Donor Platform

A comprehensive blood donation management system connecting donors with hospitals and patients in need. Built with modern web technologies and designed for scalability, real-time communication, and efficient blood request management.

## 🌟 Features

- 🏥 **Real-time Blood Request Management** - Hospitals can create and manage blood requests
- 🎯 **Smart Donor Matching** - Automatic matching based on blood type, location, and availability
- 💬 **Live Chat System** - Real-time communication between donors and hospitals
- 🤖 **AI-Enhanced Messaging** - Gemini AI integration for message enhancement, translation, and suggestions
- 🌙 **Dark Mode Support** - Complete dark/light theme switching with smooth transitions
- 📧 **Email & SMS Notifications** - Automated alerts for urgent requests and updates
- 📍 **GPS-based Location Services** - Location-aware donor matching and routing
- 🔐 **OAuth Authentication** - Secure login with Google OAuth integration
- ⚡ **Queue-based Processing** - Asynchronous processing for scalability
- 📊 **Admin Dashboard** - Queue monitoring and system management
- 📱 **Mobile-responsive Design** - Works seamlessly on all devices

## 🏗️ Architecture

### 🎨 Frontend (Client/)

- ⚛️ **React 19** - Modern React with latest features
- ⚡ **Vite 6** - Fast build tool and development server
- 🛣️ **React Router 7** - Client-side routing
- 🎨 **Chakra UI 3** - Component library for consistent UI
- 🎯 **Tailwind CSS 4** - Utility-first CSS framework
- � **Zustand** - Lightweight state management for theme and app state
- �🔌 **Socket.io Client** - Real-time communication
- 📡 **Axios** - HTTP client for API requests
- 🔔 **React Toastify** - Toast notifications
- 🤖 **AI Integration** - Gemini API for enhanced messaging

### 🖥️ Backend (Server/)

- 🚀 **Node.js** with **Express 5** - Server framework
- 🗄️ **MongoDB** with **Mongoose** - Database and ODM
- 🔌 **Socket.io** - Real-time WebSocket communication
- 🔑 **JWT** - JSON Web Token authentication
- 🛡️ **Passport.js** - Authentication middleware with Google OAuth
- 📋 **BullMQ** - Redis-based message queue system
- 📧 **SendGrid** - Email service integration
- 📮 **Nodemailer** - Email sending with SMTP fallback
- 🤖 **Google Gemini AI** - AI-powered message enhancement and translation

### 🏗️ Infrastructure & DevOps

- 🔴 **Redis** - Message broker and caching
- 🐳 **Docker Compose** - Container orchestration
- 🔍 **ESLint** - Code linting and formatting
- 🔄 **Nodemon** - Development server auto-restart

## 📦 Tech Stack

### 🚀 Core Technologies

| Category                  | Technology | Version | Purpose                       |
| ------------------------- | ---------- | ------- | ----------------------------- |
| **🎨 Frontend Framework** | React      | 19.1.0  | UI library                    |
| **⚡ Build Tool**         | Vite       | 6.3.5   | Fast development and building |
| **🖥️ Backend Framework**  | Express    | 5.1.0   | Server framework              |
| **🗄️ Database**           | MongoDB    | -       | NoSQL database                |
| **📋 ODM**                | Mongoose   | 8.15.1  | MongoDB object modeling       |
| **📬 Message Queue**      | BullMQ     | 5.56.0  | Job queue processing          |
| **🔴 Cache/Broker**       | Redis      | latest  | In-memory data store          |

### 🎨 UI & Styling

| Technology       | Version | Purpose           |
| ---------------- | ------- | ----------------- |
| 🎯 Chakra UI     | 3.20.0  | Component library |
| 🌊 Tailwind CSS  | 4.1.8   | Utility-first CSS |
| 🎭 Framer Motion | 12.16.0 | Animation library |
| 💅 Emotion       | 11.14.0 | CSS-in-JS         |
| 🐻 Zustand       | 5.0.2   | State management  |

### 🤖 AI & Intelligence

| Technology       | Version   | Purpose                           |
| ---------------- | --------- | --------------------------------- |
| 🧠 Google Gemini | 1.5-flash | Message enhancement & translation |
| 🎯 AI Services   | Custom    | Intelligent message suggestions   |

### 📡 Communication & Real-time

| Technology        | Version | Purpose                 |
| ----------------- | ------- | ----------------------- |
| 🔌 Socket.io      | 4.8.1   | Real-time communication |
| 📡 Axios          | 1.9.0+  | HTTP client             |
| 🔔 React Toastify | 11.0.5  | Notifications           |

### 🔐 Authentication & Security

| Technology          | Version | Purpose                   |
| ------------------- | ------- | ------------------------- |
| 🛡️ Passport.js      | 0.7.0   | Authentication middleware |
| 🔑 JWT              | 9.0.2   | Token-based auth          |
| 🔒 bcryptjs         | 3.0.2   | Password hashing          |
| 🌐 Google OAuth 2.0 | 2.0.0   | Social authentication     |

### 📧 Email & Communication

| Technology    | Version | Purpose            |
| ------------- | ------- | ------------------ |
| 📨 SendGrid   | 8.1.5   | Email service      |
| 📮 Nodemailer | 7.0.3   | SMTP email sending |

### 🛠️ Development Tools

| Technology      | Version | Purpose             |
| --------------- | ------- | ------------------- |
| 🔍 ESLint       | 9.25.0  | Code linting        |
| 🔄 Nodemon      | 3.1.10  | Development server  |
| 🎨 PostCSS      | 8.5.4   | CSS processing      |
| 🚀 Autoprefixer | 10.4.21 | CSS vendor prefixes |

## 🚀 Quick Start

### 📋 Prerequisites

- 🟢 **Node.js 18+**
- 🍃 **MongoDB**
- 🔴 **Redis**
- 📂 **Git**

### 🔧 Installation

1. **📥 Clone the repository**

   ```bash
   git clone <repository-url>
   cd Blood_Donor
   ```

2. **📦 Install dependencies**

   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd Client
   npm install

   # Install server dependencies
   cd ../Server
   npm install
   ```

3. **⚙️ Set up environment variables**

   Create `.env` file in the Server directory:

   ```env
   # 🗄️ Database
   MONGODB_URI=mongodb://localhost:27017/blooddonor

   # 🔑 JWT
   JWT_SECRET=your_jwt_secret_here

   # 🌐 Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # 📨 SendGrid
   SENDGRID_API_KEY=your_sendgrid_api_key

   # 📧 Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password

   # 🤖 Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key

   # 🔴 Redis
   REDIS_URL=redis://localhost:6379

   # 🖥️ Server Configuration
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

4. **🐳 Start Redis (using Docker)**

   ```bash
   docker-compose up -d
   ```

5. **🚀 Start the development servers**

   Terminal 1 (Server):

   ```bash
   cd Server
   npm run dev
   ```

   Terminal 2 (Client):

   ```bash
   cd Client
   npm run dev
   ```

6. **🌐 Access the application**
   - 🎨 Frontend: http://localhost:5173
   - 🖥️ Backend: http://localhost:5000
   - 📊 Queue Dashboard: http://localhost:5000/admin/queues

## 📁 Project Structure

```
Blood_Donor/
├── Client/                     # React frontend application
│   ├── components/            # Organized feature-based components
│   │   ├── admin/            # Admin management components
│   │   ├── auth/             # Authentication components
│   │   ├── chat/             # Chat & messaging components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── maps/             # Location & mapping components
│   │   ├── requests/         # Blood request components
│   │   └── ui/               # Reusable UI components
│   ├── pages/                # Organized feature-based pages
│   │   ├── admin/            # Admin pages
│   │   ├── auth/             # Authentication pages
│   │   ├── chat/             # Chat pages
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── requests/         # Request management pages
│   │   └── testing/          # Development testing pages
│   ├── config/               # Configuration files
│   ├── context/              # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # Zustand state stores
│   ├── services/             # API and external services
│   ├── utils/                # Utility functions
│   └── public/               # Static assets
├── Server/                    # Express backend application
│   ├── routes/               # API route handlers
│   ├── models/               # MongoDB/Mongoose models
│   ├── middleware/           # Express middleware
│   ├── config/               # Configuration files
│   ├── queues/               # BullMQ queue configuration
│   ├── utils/                # Server utility functions
│   ├── scripts/              # Development & maintenance scripts
│   └── tests/                # Test files
├── scripts/                  # Deployment & build scripts
├── docs/                     # Project documentation
├── docker-compose.yml        # Docker services configuration
└── README.md                 # This file
```

## 🔧 Development

### 📝 Scripts

**🎨 Client:**

- `npm run dev` - 🚀 Start development server
- `npm run build` - 📦 Build for production
- `npm run lint` - 🔍 Run ESLint
- `npm run preview` - 👀 Preview production build

**🖥️ Server:**

- `npm run dev` - 🔄 Start development server with nodemon

### 🎯 Key Features Implementation

#### 🤖 AI-Enhanced Messaging

- 🧠 **Google Gemini integration** for intelligent message enhancement
- 🌍 **Multi-language translation** for donor-hospital communication
- 💡 **Smart suggestions** for improving message clarity and tone
- 🎯 **Context-aware responses** based on blood donation scenarios
- ✨ **Message polishing** for professional communication

#### 🌙 Dark Mode & Theming

- 🌓 **Complete dark/light mode** with system preference detection
- 🐻 **Zustand state management** for persistent theme preferences
- 🎨 **Smooth transitions** with coordinated animations
- 📱 **Responsive design** optimized for both themes
- ⚡ **Performance optimized** theme switching

#### 🔄 Message Queue System

- 📬 **BullMQ** with Redis for asynchronous processing
- 🎯 **4 specialized queues**: urgent requests, donor matching, email, SMS
- 📊 **Bull Board dashboard** for monitoring at `/admin/queues`
- 🔁 **Automatic retry logic** with exponential backoff

#### 📧 Email System

- 📨 **SendGrid integration** for production
- 📮 **Gmail SMTP fallback** for development
- 🎨 **Rich HTML templates** for various notifications
- ✅ **Email verification** and welcome emails
- 🚨 **Urgent donor alerts** and response notifications

#### 💬 Real-time Chat

- 🔌 **Socket.io** for real-time communication
- 🏠 **Multi-room chat** between donors and hospitals
- 🟢 **Online status indicators**
- 💾 **Message persistence** with MongoDB

#### 🗺️ Location Services

- 📍 **GPS-based matching** for nearby donors
- 🧭 **Route calculation** and directions
- 📱 **Location capture** and validation
- 🔒 **Privacy-focused** location handling

#### 🔐 Authentication

- 🔑 **JWT-based authentication**
- 🌐 **Google OAuth 2.0** integration
- 👥 **Role-based access** (Donor/Hospital)
- 🔄 **Session management** with automatic refresh

## 🚀 Deployment

### 🌐 Production Environment Variables

Ensure all environment variables are set for production:

- 🗄️ Database connection strings
- 🔑 API keys (SendGrid, Google OAuth)
- 🔴 Redis connection details
- 🔐 JWT secrets
- 🌍 CORS origins

### 🔨 Build Commands

```bash
# 📦 Build client for production
cd Client
npm run build

# 🚀 Start production server
cd Server
npm start
```

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:

- 📧 **[Email Setup Guide](docs/Email-Setup-Guide.md)** - Email service configuration
- 🗺️ **[ArcGIS Setup Guide](docs/ArcGIS-Setup-Guide.md)** - Mapping service setup
- 🐳 **[Docker Troubleshooting](docs/docker-troubleshoot.md)** - Docker issues and solutions
- 💬 **[Chat Integration Summary](docs/CHAT_INTEGRATION_SUMMARY.md)** - Real-time chat implementation
- 📬 **[Message Queue Integration](docs/MESSAGE_QUEUE_INTEGRATION_SUMMARY.md)** - Queue system details
- 🏥 **[Hospital Management](docs/HOSPITAL_MANAGEMENT_SUMMARY.md)** - Hospital features overview
- 📨 **[Email Features](docs/Email-Features-Summary.md)** - Email system capabilities
- ⚡ **[Quick Offer Feature](docs/QUICK_OFFER_FEATURE.md)** - Quick donation offers
- 🤖 **[AI Integration](docs/AI_CHATBOT_INTEGRATION_FINAL.md)** - Gemini AI implementation
- 🌙 **[Dark Mode Implementation](docs/POLISH_IMPROVEMENTS_SUMMARY.md)** - Theme system details

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- 📚 Check the documentation in the `docs/` folder
- 🔧 Review the troubleshooting guides
- 🐛 Open an issue in the repository

## 🙏 Acknowledgments

- 🚀 Built with modern web technologies
- 📈 Designed for scalability and real-time performance
- 👥 Focused on user experience and system reliability
- 🛡️ Implements industry best practices for security and data handling

---

**Blood Donor Platform** - Connecting donors with those in need, powered by technology. 🩸❤️
