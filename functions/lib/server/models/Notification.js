"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['message', 'task', 'leave', 'system'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String,
    },
}, {
    timestamps: true,
});
// Index for faster queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
exports.default = mongoose_1.default.models.Notification || mongoose_1.default.model('Notification', notificationSchema);
//# sourceMappingURL=Notification.js.map