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
// @ts-nocheck
const express_1 = require("express");
const passport_1 = __importDefault(require("../config/passport"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Google OAuth login (capture desired role in session if provided)
router.get('/google', (req, res, next) => {
    const role = req.query.role || 'employee';
    if (req.session) {
        req.session.oauthRole = role;
    }
    next();
}, passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
}));
// Google OAuth callback
router.get('/google/callback', passport_1.default.authenticate('google', {
    failureRedirect: '/login?error=auth_failed',
}), (req, res) => {
    // Ensure session is saved before redirecting
    if (req.session) {
        req.session.save(() => {
            res.redirect('/auth/success');
        });
    }
    else {
        res.redirect('/auth/success');
    }
});
// Get current authenticated user
router.get('/user', (req, res) => {
    if (req.isAuthenticated() && req.user) {
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                profilePhoto: req.user.profilePhoto,
            },
        });
    }
    else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});
// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});
// Local email/password signup
router.post('/signup', validation_1.validateSignup, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existing = await User_1.default.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res
                .status(409)
                .json({ message: 'An account with this email already exists' });
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        const newUser = await User_1.default.create({
            name,
            email: email.toLowerCase(),
            passwordHash: hash,
            role: ['manager', 'employee', 'admin'].includes(role || '')
                ? role
                : 'employee',
        });
        // Send welcome email (non-blocking)
        Promise.resolve().then(() => __importStar(require('../utils/email'))).then(({ sendEmail, emailTemplates }) => {
            const template = emailTemplates.welcome(newUser.name, 'Company Manager');
            sendEmail({
                to: newUser.email,
                subject: template.subject,
                html: template.html,
            }).catch((err) => console.error('Failed to send welcome email:', err));
        });
        req.login(newUser, (err) => {
            if (err)
                return res
                    .status(500)
                    .json({ message: 'Signup succeeded but login failed' });
            res.json({
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    profilePhoto: newUser.profilePhoto,
                },
            });
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Local email/password login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: 'Email and password are required' });
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase() }).select('+passwordHash');
        if (!user || !user.passwordHash) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        req.login(user, (err) => {
            if (err)
                return res.status(500).json({ message: 'Login failed' });
            res.json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profilePhoto: user.profilePhoto,
                },
            });
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map