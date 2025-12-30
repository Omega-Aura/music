# 🎵 Realtime Spotify Clone

A full-stack music streaming application with real-time features, built with the MERN stack and modern web technologies. This project replicates core Spotify functionality including music playback, social features, admin dashboard, and cross-device synchronization.

## ✨ Features

### 🎶 Core Music Features
- **Music Streaming**: High-quality audio playback with Cloudinary integration
- **Album & Song Management**: Browse albums, playlists, and individual tracks
- **Search Functionality**: Search for songs, albums, and artists
- **Audio Player Controls**: Play, pause, skip, volume control, and progress tracking
- **Playlist Management**: Create and manage custom playlists

### 👥 Social Features
- **Real-time Chat**: Live messaging with Socket.io integration
- **Friends Activity**: See what your friends are listening to in real-time
- **Emoji Reactions**: React to messages with emoji picker
- **User Profiles**: View and manage user profiles

### 🔐 Authentication & Authorization
- **Clerk Authentication**: Secure user authentication with OAuth support
- **Protected Routes**: Role-based access control
- **Admin Dashboard**: Dedicated admin panel for content management

### 📱 Advanced Features
- **Cross-Device Playback**: Sync playback across multiple devices
- **Device Management**: Control and switch between connected devices
- **Real-time Synchronization**: WebSocket-powered live updates
- **Greeting Service**: Automated scheduled greetings
- **Statistics Dashboard**: Track app usage and user engagement

### 🎨 UI/UX
- **Responsive Design**: Mobile-first, fully responsive interface
- **Dark Mode**: Eye-friendly dark theme
- **Modern UI Components**: Built with Radix UI and Tailwind CSS
- **Smooth Animations**: Polished transitions and interactions
- **Toast Notifications**: Real-time feedback for user actions

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Radix UI** - Accessible UI components
- **Lucide React** - Icon library
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Emoji Picker React** - Emoji selection

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - WebSocket server
- **Clerk Express** - Authentication
- **Cloudinary** - Media storage and CDN
- **Node Cron** - Scheduled tasks
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controller/      # Route controllers
│   │   ├── routes/          # API routes
│   │   ├── models/          # MongoDB schemas
│   │   ├── middleware/      # Custom middleware
│   │   ├── lib/             # Utilities (DB, Socket, Cloudinary)
│   │   ├── services/        # Business logic
│   │   ├── seeds/           # Database seeders
│   │   └── index.js         # Server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── layout/          # Layout components
│   │   ├── stores/          # Zustand state stores
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helper functions
│   │   ├── lib/             # Libraries & configs
│   │   └── App.tsx          # Root component
│   ├── public/              # Static assets
│   └── package.json
│
└── package.json             # Root package file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Cloudinary account
- Clerk account

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the `frontend` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000/api
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd realtime-spotify-clone
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Seed the database** (optional)
```bash
cd backend
npm run seed:albums
npm run seed:songs
```

4. **Start the development servers**

In one terminal (Backend):
```bash
cd backend
npm run dev
```

In another terminal (Frontend):
```bash
cd frontend
npm run dev
```

5. **Open your browser**
```
Frontend: http://localhost:5173
Backend: http://localhost:5000
```

## 📦 Build for Production

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## 🎯 API Routes

### Authentication
- `POST /api/auth/callback` - Authentication callback

### Users
- `GET /api/users` - Get all users
- `GET /api/users/me` - Get current user
- `GET /api/users/:userId` - Get user by ID

### Songs
- `GET /api/songs` - Get all songs
- `GET /api/songs/:id` - Get song by ID
- `GET /api/songs/featured` - Get featured songs
- `GET /api/songs/trending` - Get trending songs

### Albums
- `GET /api/albums` - Get all albums
- `GET /api/albums/:id` - Get album by ID
- `GET /api/albums/:id/songs` - Get songs in album

### Player
- `POST /api/player/state` - Update playback state
- `GET /api/player/state/:userId` - Get user's playback state

### Devices
- `POST /api/devices/register` - Register a device
- `GET /api/devices` - Get user's devices
- `POST /api/devices/transfer` - Transfer playback

### Admin (Protected)
- `POST /api/admin/songs` - Upload song
- `POST /api/admin/albums` - Create album
- `DELETE /api/admin/songs/:id` - Delete song
- `DELETE /api/admin/albums/:id` - Delete album

### Stats
- `GET /api/stats` - Get platform statistics

### Health
- `GET /api/health` - Health check
- `GET /api/ws-info` - WebSocket connection info

## 🔌 WebSocket Events

### Client → Server
- `user_connected` - User connection with device info
- `send_message` - Send chat message
- `playback_update` - Sync playback state
- `device_state_change` - Device state update

### Server → Client
- `user_connected` - User online notification
- `user_disconnected` - User offline notification
- `receive_message` - New chat message
- `activity_update` - Friends activity update
- `playback_sync` - Playback synchronization
- `device_command` - Device control command

## 🧪 Available Scripts

### Root Directory
- `npm run build` - Build the entire project
- `npm start` - Start production server

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed:songs` - Seed songs data
- `npm run seed:albums` - Seed albums data

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Inspired by Spotify's user interface and functionality
- Built with modern web development best practices
- Uses industry-standard libraries and frameworks

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ and lots of ☕
