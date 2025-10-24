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
// @ts-nocheck - Mongoose type inference issues
const express_1 = require("express");
const Leave_1 = __importDefault(require("../models/Leave"));
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};
// Get all leave requests
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const leaves = await Leave_1.default.find()
            .populate('employee', 'name email profilePhoto')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json({ leaves });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});
// Create new leave request
router.post('/', isAuthenticated, validation_1.validateLeave, async (req, res) => {
    try {
        const { startDate, endDate, type, reason, daysRequested } = req.body;
        const currentUser = req.user;
        const leave = await Leave_1.default.create({
            employee: currentUser._id,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type,
            reason,
            daysRequested,
            status: 'Pending',
        });
        const populatedLeave = await Leave_1.default.findById(leave._id)
            .populate('employee', 'name email profilePhoto');
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('leave:created', populatedLeave);
        }
        // Send email notification to managers (non-blocking)
        Promise.resolve().then(() => __importStar(require('../utils/email'))).then(async ({ sendEmail, emailTemplates }) => {
            try {
                const User = require('../models/User').default;
                const managers = await User.find({ role: { $in: ['manager', 'admin'] } }).select('email name');
                const template = emailTemplates.leaveRequestSubmitted(currentUser.name, 'Manager', type, new Date(startDate).toLocaleDateString(), new Date(endDate).toLocaleDateString(), reason);
                managers.forEach((manager) => {
                    sendEmail({
                        to: manager.email,
                        subject: template.subject,
                        html: template.html.replace('Manager', manager.name),
                    }).catch(err => console.error('Failed to send leave notification:', err));
                });
            }
            catch (err) {
                console.error('Failed to notify managers:', err);
            }
        });
        res.status(201).json({ leave: populatedLeave });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create leave request' });
    }
});
// Approve leave
router.patch('/:id/approve', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        // Check if user is manager or admin
        if (user.role !== 'manager' && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to approve leaves' });
        }
        const leave = await Leave_1.default.findByIdAndUpdate(id, {
            status: 'Approved',
            reviewedBy: user._id,
            reviewedAt: new Date(),
        }, { new: true })
            .populate('employee', 'name email profilePhoto')
            .populate('reviewedBy', 'name email');
        if (!leave) {
            return res.status(404).json({ error: 'Leave not found' });
        }
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('leave:approved', leave);
        }
        // Send approval email to employee (non-blocking)
        Promise.resolve().then(() => __importStar(require('../utils/email'))).then(({ sendEmail, emailTemplates }) => {
            const template = emailTemplates.leaveStatusUpdate(leave.employee.name, 'approved', leave.type, leave.startDate.toLocaleDateString(), leave.endDate.toLocaleDateString());
            sendEmail({
                to: leave.employee.email,
                subject: template.subject,
                html: template.html,
            }).catch(err => console.error('Failed to send approval email:', err));
        });
        res.json({ leave });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to approve leave' });
    }
});
// Reject leave
router.patch('/:id/reject', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        // Check if user is manager or admin
        if (user.role !== 'manager' && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to reject leaves' });
        }
        const leave = await Leave_1.default.findByIdAndUpdate(id, {
            status: 'Rejected',
            reviewedBy: user._id,
            reviewedAt: new Date(),
        }, { new: true })
            .populate('employee', 'name email profilePhoto')
            .populate('reviewedBy', 'name email');
        if (!leave) {
            return res.status(404).json({ error: 'Leave not found' });
        }
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('leave:rejected', leave);
        }
        // Send rejection email to employee (non-blocking)
        Promise.resolve().then(() => __importStar(require('../utils/email'))).then(({ sendEmail, emailTemplates }) => {
            const template = emailTemplates.leaveStatusUpdate(leave.employee.name, 'rejected', leave.type, leave.startDate.toLocaleDateString(), leave.endDate.toLocaleDateString());
            sendEmail({
                to: leave.employee.email,
                subject: template.subject,
                html: template.html,
            }).catch(err => console.error('Failed to send rejection email:', err));
        });
        res.json({ leave });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to reject leave' });
    }
});
exports.default = router;
//# sourceMappingURL=leaves.js.map