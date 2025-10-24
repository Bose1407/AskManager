"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
exports.setupSocketIO = setupSocketIO;
// @ts-nocheck - Mongoose type inference issues
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const passport_1 = __importDefault(require("./config/passport"));
const connection_1 = __importDefault(require("./db/connection"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const demo_1 = require("./routes/demo");
const auth_1 = __importDefault(require("./routes/auth"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const messages_1 = __importDefault(require("./routes/messages"));
const leaves_1 = __importDefault(require("./routes/leaves"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const Message_1 = __importDefault(require("./models/Message"));
const User_1 = __importDefault(require("./models/User"));
const Notification_1 = __importDefault(require("./models/Notification"));
function createServer() {
    const app = (0, express_1.default)();
    // Connect to MongoDB
    (0, connection_1.default)().catch(console.error);
    // Security middleware - Helmet (FREE)
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Allow Vite dev server
        crossOriginEmbedderPolicy: false,
    }));
    // Rate limiting - Prevent brute force attacks (FREE)
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', limiter);
    // Stricter rate limit for auth routes
    const authLimiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts
        message: 'Too many login attempts, please try again later.',
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/signup', authLimiter);
    // CORS
    app.use((0, cors_1.default)({
        origin: process.env.CLIENT_URL || 'http://localhost:8080',
        credentials: true,
    }));
    // Body parsing with limits
    app.use(express_1.default.json({ limit: '10mb' })); // Prevent large payloads
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Additional security headers
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
    // Session configuration
    const sessionMiddleware = (0, express_session_1.default)({
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        store: connect_mongo_1.default.create({
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
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    // Example API routes
    app.get("/api/ping", (_req, res) => {
        var _a;
        const ping = (_a = process.env.PING_MESSAGE) !== null && _a !== void 0 ? _a : "ping";
        res.json({ message: ping });
    });
    app.get("/api/demo", demo_1.handleDemo);
    // Auth routes
    app.use("/api/auth", auth_1.default);
    // Protected routes
    app.use("/api/tasks", tasks_1.default);
    app.use("/api/messages", messages_1.default);
    app.use("/api/leaves", leaves_1.default);
    // User management routes
    const usersRoutes = require("./routes/users").default;
    app.use("/api/users", usersRoutes);
    // Notifications routes
    app.use("/api/notifications", notifications_1.default);
    return app;
}
function setupSocketIO(io, app) {
    // Store io instance in app for routes to access
    app.set('io', io);
    // Track online users with full details
    const onlineUsers = new Map(); // socketId -> user object
    const userSockets = new Map(); // userId -> Set of socketIds
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        // User joins with their ID and details
        socket.on('user:online', async (userId) => {
            try {
                // Fetch user details from database
                const user = await User_1.default.findById(userId).select('name email profilePhoto role');
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
                    userSockets.get(userId).add(socket.id);
                    // Get unique users online
                    const uniqueUsers = new Map();
                    onlineUsers.forEach((user) => {
                        uniqueUsers.set(user._id, user);
                    });
                    // Broadcast online users list
                    io.emit('users:online', Array.from(uniqueUsers.values()));
                }
            }
            catch (error) {
                console.error('Failed to fetch user details:', error);
            }
        });
        // Chat: send message
        socket.on('message:send', async (data) => {
            try {
                // Validate message content
                if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
                    return; // Silently ignore invalid messages
                }
                if (data.content.length > 5000) {
                    return; // Silently ignore messages that are too long
                }
                const sanitizedContent = data.content.trim().replace(/[<>]/g, '').slice(0, 5000);
                const message = await Message_1.default.create({
                    sender: data.userId,
                    content: sanitizedContent,
                    isPinned: false,
                });
                const populatedMessage = await Message_1.default.findById(message._id)
                    .populate('sender', 'name email profilePhoto');
                io.emit('message:new', populatedMessage);
                // Create notifications for all online users except the sender
                const onlineUserIds = Array.from(new Set(Array.from(onlineUsers.values()).map(u => u._id)));
                const notificationPromises = onlineUserIds
                    .filter(userId => userId !== data.userId)
                    .map(userId => Notification_1.default.create({
                    user: userId,
                    type: 'message',
                    title: `New message from ${populatedMessage.sender.name}`,
                    message: sanitizedContent.length > 50 ? sanitizedContent.slice(0, 50) + '...' : sanitizedContent,
                    link: '/dashboard/chat',
                }));
                await Promise.all(notificationPromises);
                // Emit notification event to online users
                onlineUserIds
                    .filter(userId => userId !== data.userId)
                    .forEach(async (userId) => {
                    const notification = await Notification_1.default.findOne({ user: userId }).sort({ createdAt: -1 });
                    if (notification) {
                        io.emit('notification:new', notification);
                    }
                });
            }
            catch (error) {
                console.error('Failed to send message:', error);
            }
        });
        // Chat: typing indicator
        socket.on('message:typing', (data) => {
            socket.broadcast.emit('user:typing', data);
        });
        socket.on('message:stop-typing', (data) => {
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
            const uniqueUsers = new Map();
            onlineUsers.forEach((user) => {
                uniqueUsers.set(user._id, user);
            });
            io.emit('users:online', Array.from(uniqueUsers.values()));
            console.log('User disconnected:', socket.id);
        });
    });
}
//# sourceMappingURL=index.js.map