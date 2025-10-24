"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck - Mongoose type inference issues
const express_1 = require("express");
const Message_1 = __importDefault(require("../models/Message"));
const router = (0, express_1.Router)();
// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};
// Get all messages
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const messages = await Message_1.default.find()
            .populate('sender', 'name email profilePhoto')
            .sort({ createdAt: 1 })
            .limit(100); // Limit to last 100 messages
        res.json({ messages });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// Pin/unpin message
router.patch('/:id/pin', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { isPinned } = req.body;
        const message = await Message_1.default.findByIdAndUpdate(id, { isPinned }, { new: true }).populate('sender', 'name email profilePhoto');
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('message:pinned', message);
        }
        res.json({ message });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update message' });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map