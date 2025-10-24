// @ts-nocheck - Mongoose type inference issues
import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "./config/passport";
import connectDB from "./db/connection";
import { Server as SocketServer } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { handleDemo } from "./routes/demo";
import authRoutes from "./routes/auth";
import tasksRoutes from "./routes/tasks";
import messagesRoutes from "./routes/messages";
import leavesRoutes from "./routes/leaves";
import notificationsRoutes from "./routes/notifications";
import Message from "./models/Message";
import User from "./models/User";
import Notification from "./models/Notification";

export function createServer() {
  const app = express();

  // Connect to MongoDB
  connectDB().catch(console.error);

  // Security middleware - Helmet (FREE)
  app.use(helmet({
    contentSecurityPolicy: false, // Allow Vite dev server
    crossOriginEmbedderPolicy: false,
  }));

  // Rate limiting - Prevent brute force attacks (FREE)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Stricter rate limit for auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again later.',
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/signup', authLimiter);

  // CORS
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    credentials: true,
  }));

  // Body parsing with limits
  app.use(express.json({ limit: '10mb' })); // Prevent large payloads
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Session configuration
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || '',
      touchAfter: 24 * 3600, // lazy session update
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  });

  app.use(sessionMiddleware);

  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.use("/api/auth", authRoutes);

  // Protected routes
  app.use("/api/tasks", tasksRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/leaves", leavesRoutes);
  
  // User management routes
  const usersRoutes = require("./routes/users").default;
  app.use("/api/users", usersRoutes);
  
  // Notifications routes
  app.use("/api/notifications", notificationsRoutes);

  return app;
}

export function setupSocketIO(io: SocketServer, app: express.Application) {
  // Store io instance in app for routes to access
  app.set('io', io);

  // Track online users with full details
  const onlineUsers = new Map<string, any>(); // socketId -> user object
  const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their ID and details
    socket.on('user:online', async (userId: string) => {
      try {
        // Fetch user details from database
        const user = await User.findById(userId).select('name email profilePhoto role');
        
        if (user) {
          const userInfo = {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            profilePhoto: user.profilePhoto,
            role: user.role,
          };

          // Store user info by socket ID
          onlineUsers.set(socket.id, userInfo);
          
          // Track all sockets for this user (multi-device support)
          if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
          }
          userSockets.get(userId)!.add(socket.id);

          // Get unique users online
          const uniqueUsers = new Map<string, any>();
          onlineUsers.forEach((user) => {
            uniqueUsers.set(user._id, user);
          });

          // Broadcast online users list
          io.emit('users:online', Array.from(uniqueUsers.values()));
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    });

    // Chat: send message
    socket.on('message:send', async (data: { content: string; userId: string }) => {
      try {
        // Validate message content
        if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
          return; // Silently ignore invalid messages
        }
        if (data.content.length > 5000) {
          return; // Silently ignore messages that are too long
        }

        const sanitizedContent = data.content.trim().replace(/[<>]/g, '').slice(0, 5000);

        const message = await Message.create({
          sender: data.userId,
          content: sanitizedContent,
          isPinned: false,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email profilePhoto');

        io.emit('message:new', populatedMessage);

        // Create notifications for all online users except the sender
        const onlineUserIds = Array.from(new Set(Array.from(onlineUsers.values()).map(u => u._id)));
        const notificationPromises = onlineUserIds
          .filter(userId => userId !== data.userId)
          .map(userId => 
            Notification.create({
              user: userId,
              type: 'message',
              title: `New message from ${populatedMessage.sender.name}`,
              message: sanitizedContent.length > 50 ? sanitizedContent.slice(0, 50) + '...' : sanitizedContent,
              link: '/dashboard/chat',
            })
          );
        
        await Promise.all(notificationPromises);
        
        // Emit notification event to online users
        onlineUserIds
          .filter(userId => userId !== data.userId)
          .forEach(async (userId) => {
            const notification = await Notification.findOne({ user: userId }).sort({ createdAt: -1 });
            if (notification) {
              io.emit('notification:new', notification);
            }
          });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    });

    // Chat: typing indicator
    socket.on('message:typing', (data: { userId: string; userName: string }) => {
      socket.broadcast.emit('user:typing', data);
    });

    socket.on('message:stop-typing', (data: { userId: string }) => {
      socket.broadcast.emit('user:stop-typing', data);
    });

    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      
      if (user) {
        const userId = user._id;
        
        // Remove this socket from user's socket set
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          
          // If user has no more sockets, remove from userSockets
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
        }
      }
      
      onlineUsers.delete(socket.id);
      
      // Get unique users still online
      const uniqueUsers = new Map<string, any>();
      onlineUsers.forEach((user) => {
        uniqueUsers.set(user._id, user);
      });
      
      io.emit('users:online', Array.from(uniqueUsers.values()));
      console.log('User disconnected:', socket.id);
    });
  });
}
