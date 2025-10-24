"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const passport_1 = __importDefault(require("../../server/config/passport"));
const connection_1 = __importDefault(require("../../server/db/connection"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = __importDefault(require("../../server/routes/auth"));
const tasks_1 = __importDefault(require("../../server/routes/tasks"));
const messages_1 = __importDefault(require("../../server/routes/messages"));
const leaves_1 = __importDefault(require("../../server/routes/leaves"));
const notifications_1 = __importDefault(require("../../server/routes/notifications"));
const users_1 = __importDefault(require("../../server/routes/users"));
const app = (0, express_1.default)();
(0, connection_1.default)().catch(console.error);
app.use((0, helmet_1.default)({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const sessionMiddleware = (0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({ mongoUrl: process.env.MONGODB_URI || '' }),
    cookie: { maxAge: 604800000, httpOnly: true, secure: true, sameSite: 'none' }
});
app.use(sessionMiddleware);
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.get("/ping", (_, res) => res.json({ message: "pong" }));
app.use("/auth", auth_1.default);
app.use("/tasks", tasks_1.default);
app.use("/messages", messages_1.default);
app.use("/leaves", leaves_1.default);
app.use("/users", users_1.default);
app.use("/notifications", notifications_1.default);
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map