"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};
// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Admin access required' });
};
// GET /api/users - Get all users (admin only)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await User_1.default.find({})
            .select('name email role profilePhoto createdAt')
            .sort({ createdAt: -1 });
        res.json({ users });
    }
    catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// PATCH /api/users/:id/role - Update user role (admin only)
router.patch('/:id/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['employee', 'manager', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        // Prevent user from changing their own role
        if (id === req.user._id.toString()) {
            return res.status(403).json({ error: 'Cannot change your own role' });
        }
        const user = await User_1.default.findByIdAndUpdate(id, { role }, { new: true }).select('name email role profilePhoto');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Failed to update user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map