# Manager Ask - Real-Time Manager Dashboard

A full-stack manager productivity dashboard with Google OAuth authentication, MongoDB Atlas database, and real-time updates via Socket.io.

## 🚀 Features Implemented

### ✅ Authentication
- Google OAuth 2.0 integration
- Session-based authentication with MongoDB session store
- Protected routes with role-based access control

### ✅ Real-Time Features
- Socket.io integration for live updates
- Real-time chat with online status
- Live task updates across all connected clients
- Real-time leave approval notifications

### ✅ Backend (Express + MongoDB)
- MongoDB Atlas connection with Mongoose
- RESTful API endpoints for tasks, messages, and leaves
- Passport.js authentication strategy
- Session management with connect-mongo

### ✅ Frontend (React + Socket.io)
- Socket.io client integration
- Real-time data synchronization
- Google OAuth login flow
- Context-based state management

## 📋 Setup Instructions

### 1. MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your database user credentials

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - User Type: External
   - App name: Manager Ask
   - Add your email
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8080/api/auth/google/callback`
7. Copy Client ID and Client Secret

### 3. Environment Variables

Update `.env` file with your credentials:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/manager-ask?retryWrites=true&w=majority

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-random-string-here

# Server Config
NODE_ENV=development
PORT=8080
CLIENT_URL=http://localhost:8080
```

### 4. Install & Run

```bash
# Install dependencies (already done)
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:8080`

## 🎯 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment

### Messages
- `GET /api/messages` - Get messages
- `PATCH /api/messages/:id/pin` - Pin/unpin message

### Leaves
- `GET /api/leaves` - Get leave requests
- `POST /api/leaves` - Create leave request
- `PATCH /api/leaves/:id/approve` - Approve leave
- `PATCH /api/leaves/:id/reject` - Reject leave

## 🔌 Socket.io Events

### Client → Server
- `user:online` - User comes online
- `message:send` - Send chat message
- `message:typing` - User is typing
- `message:stop-typing` - User stopped typing

### Server → Client
- `users:online` - Updated list of online users
- `message:new` - New chat message
- `message:pinned` - Message pinned/unpinned
- `user:typing` - User typing indicator
- `user:stop-typing` - User stopped typing
- `task:created` - New task created
- `task:updated` - Task updated
- `task:status-changed` - Task status changed
- `task:deleted` - Task deleted
- `task:comment-added` - Comment added to task
- `leave:created` - New leave request
- `leave:approved` - Leave approved
- `leave:rejected` - Leave rejected

## 📁 Project Structure

```
server/
├── config/
│   └── passport.ts          # Passport Google OAuth strategy
├── db/
│   └── connection.ts        # MongoDB connection
├── models/
│   ├── User.ts             # User model
│   ├── Task.ts             # Task model
│   ├── Message.ts          # Message model
│   └── Leave.ts            # Leave model
├── routes/
│   ├── auth.ts             # Authentication routes
│   ├── tasks.ts            # Task CRUD + real-time
│   ├── messages.ts         # Message routes
│   └── leaves.ts           # Leave management
├── types/
│   └── global.d.ts         # TypeScript declarations
└── index.ts                # Express + Socket.io setup

client/
├── contexts/
│   ├── AuthContext.tsx     # Google OAuth auth
│   └── SocketContext.tsx   # Socket.io connection
├── pages/
│   ├── Login.tsx           # Google OAuth login
│   ├── DashboardTasks.tsx  # Real-time tasks
│   ├── DashboardChat.tsx   # Real-time chat
│   └── DashboardLeaves.tsx # Leave management
└── App.tsx                 # App with Socket provider
```

## 🔧 Next Steps

1. **Set up your MongoDB Atlas cluster** (5 minutes)
2. **Configure Google OAuth credentials** (10 minutes)
3. **Update `.env` file** with your credentials
4. **Restart the dev server**: `pnpm dev`
5. **Test Google OAuth login** at http://localhost:8080/login
6. **Test real-time features** by opening multiple browser tabs

## 🐛 Troubleshooting

### "MONGODB_URI not defined"
→ Make sure you've updated `.env` with your MongoDB Atlas connection string

### "Google OAuth error"
→ Check that:
- Client ID and Secret are correct
- Redirect URI matches in Google Console
- Google+ API is enabled

### Socket.io not connecting
→ Check browser console for WebSocket errors
→ Make sure server is running on port 8080

### Session not persisting
→ Clear browser cookies and try again
→ Check MongoDB connection is active

## 📝 Default User Roles

After first login with Google:
- Default role: `employee`
- To make yourself a `manager` or `admin`, update the user document in MongoDB

## 🎉 You're Ready!

Once you've configured MongoDB and Google OAuth, you'll have a fully functional real-time manager dashboard with authentication, task management, chat, and leave tracking!
