"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck - Mongoose type inference issues
const express_1 = require("express");
const Task_1 = __importDefault(require("../models/Task"));
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};
// Middleware to check if user can modify task
const canModifyTask = async (req, res, next) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const user = req.user;
        const task = await Task_1.default.findById(id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Allow if: assigned to task, created the task, or is manager/admin
        const isAssignee = ((_a = task.assignee) === null || _a === void 0 ? void 0 : _a.toString()) === user._id.toString();
        const isCreator = ((_b = task.createdBy) === null || _b === void 0 ? void 0 : _b.toString()) === user._id.toString();
        const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';
        if (isAssignee || isCreator || isManagerOrAdmin) {
            return next();
        }
        return res.status(403).json({ error: 'Not authorized to modify this task' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to verify permissions' });
    }
};
// Middleware to check manager/admin role
const isManagerOrAdmin = (req, res, next) => {
    const user = req.user;
    if (user.role === 'manager' || user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Requires manager or admin role' });
};
// Get all tasks
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task_1.default.find()
            .populate('assignee', 'name email profilePhoto')
            .populate('createdBy', 'name email')
            .populate('comments.userId', 'name profilePhoto')
            .sort({ createdAt: -1 });
        res.json({ tasks });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
// Create new task
router.post('/', isAuthenticated, validation_1.validateTask, async (req, res) => {
    try {
        const { title, description, priority, status, dueDate, assignee } = req.body;
        const task = await Task_1.default.create({
            title,
            description,
            priority,
            status: status || 'Todo',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            assignee: assignee || undefined,
            createdBy: req.user._id,
            comments: [],
        });
        const populatedTask = await Task_1.default.findById(task._id)
            .populate('assignee', 'name email profilePhoto')
            .populate('createdBy', 'name email');
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('task:created', populatedTask);
        }
        res.status(201).json({ task: populatedTask });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});
// Update task
router.put('/:id', isAuthenticated, validation_1.validateTask, canModifyTask, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, status, dueDate, assignee } = req.body;
        const task = await Task_1.default.findByIdAndUpdate(id, {
            title,
            description,
            priority,
            status,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            assignee: assignee || undefined,
        }, { new: true })
            .populate('assignee', 'name email profilePhoto')
            .populate('createdBy', 'name email')
            .populate('comments.userId', 'name profilePhoto');
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('task:updated', task);
        }
        res.json({ task });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});
// Update task status (for Kanban drag & drop)
router.patch('/:id/status', isAuthenticated, validation_1.validateTaskStatus, canModifyTask, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const task = await Task_1.default.findByIdAndUpdate(id, { status }, { new: true })
            .populate('assignee', 'name email profilePhoto')
            .populate('createdBy', 'name email')
            .populate('comments.userId', 'name profilePhoto');
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('task:status-changed', { taskId: id, status });
        }
        res.json({ task });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update task status' });
    }
});
// Delete task (only manager/admin can delete)
router.delete('/:id', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task_1.default.findByIdAndDelete(id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('task:deleted', { id });
        }
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
// Add comment to task
router.post('/:id/comments', isAuthenticated, validation_1.validateComment, canModifyTask, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const task = await Task_1.default.findById(id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        task.comments.push({
            userId: req.user._id,
            content,
            createdAt: new Date(),
        });
        await task.save();
        const populatedTask = await Task_1.default.findById(id)
            .populate('assignee', 'name email profilePhoto')
            .populate('createdBy', 'name email')
            .populate('comments.userId', 'name profilePhoto');
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('task:comment-added', populatedTask);
        }
        res.json({ task: populatedTask });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map