"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const Notification_1 = __importDefault(require("../models/Notification"));
const router = (0, express_1.Router)();
// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};
// GET /api/notifications - Get all notifications for current user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const notifications = await Notification_1.default.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ notifications });
    }
    catch (error) {
        console.error('Failed to fetch notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', isAuthenticated, async (req, res) => {
    try {
        const notification = await Notification_1.default.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json({ notification });
    }
    catch (error) {
        console.error('Failed to mark notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', isAuthenticated, async (req, res) => {
    try {
        await Notification_1.default.updateMany({ user: req.user._id, read: false }, { read: true });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});
// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const notification = await Notification_1.default.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Failed to delete notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map