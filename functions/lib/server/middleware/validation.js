"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSignup = exports.validateMessage = exports.validateLeave = exports.validateComment = exports.validateTaskStatus = exports.validateTask = exports.sanitizeString = void 0;
// Sanitize string input (remove dangerous characters, trim whitespace)
const sanitizeString = (str) => {
    if (!str || typeof str !== 'string')
        return '';
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .slice(0, 5000); // Limit length
};
exports.sanitizeString = sanitizeString;
// Validate task creation/update
const validateTask = (req, res, next) => {
    const { title, description, status, priority, dueDate } = req.body;
    // Title validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Task title is required' });
    }
    if (title.length > 200) {
        return res.status(400).json({ error: 'Task title must be less than 200 characters' });
    }
    // Description validation (optional but must be string if provided)
    if (description !== undefined && typeof description !== 'string') {
        return res.status(400).json({ error: 'Task description must be a string' });
    }
    if (description && description.length > 5000) {
        return res.status(400).json({ error: 'Task description must be less than 5000 characters' });
    }
    // Status validation (if provided) - matches Task model enum
    const validStatuses = ['Todo', 'In Progress', 'Review', 'Completed'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid task status. Must be: Todo, In Progress, Review, or Completed' });
    }
    // Priority validation (if provided) - matches Task model enum
    const validPriorities = ['Low', 'Medium', 'High'];
    if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid task priority. Must be: Low, Medium, or High' });
    }
    // Due date validation (if provided)
    if (dueDate) {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) {
            return res.status(400).json({ error: 'Invalid due date format' });
        }
    }
    // Sanitize string inputs
    req.body.title = (0, exports.sanitizeString)(title);
    if (description) {
        req.body.description = (0, exports.sanitizeString)(description);
    }
    next();
};
exports.validateTask = validateTask;
// Validate task status update
const validateTaskStatus = (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ['Todo', 'In Progress', 'Review', 'Completed'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Valid status is required (Todo, In Progress, Review, or Completed)' });
    }
    next();
};
exports.validateTaskStatus = validateTaskStatus;
// Validate task comment
const validateComment = (req, res, next) => {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
    }
    if (content.length > 2000) {
        return res.status(400).json({ error: 'Comment must be less than 2000 characters' });
    }
    req.body.content = (0, exports.sanitizeString)(content);
    next();
};
exports.validateComment = validateComment;
// Validate leave request
const validateLeave = (req, res, next) => {
    const { type, startDate, endDate, reason } = req.body;
    // Type validation
    const validTypes = ['sick', 'vacation', 'personal', 'other'];
    if (!type || !validTypes.includes(type)) {
        return res.status(400).json({ error: 'Valid leave type is required (sick, vacation, personal, other)' });
    }
    // Date validation
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
    }
    if (end < start) {
        return res.status(400).json({ error: 'End date must be after start date' });
    }
    // Reason validation
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Leave reason is required' });
    }
    if (reason.length > 1000) {
        return res.status(400).json({ error: 'Leave reason must be less than 1000 characters' });
    }
    req.body.reason = (0, exports.sanitizeString)(reason);
    next();
};
exports.validateLeave = validateLeave;
// Validate chat message
const validateMessage = (req, res, next) => {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
    }
    if (content.length > 5000) {
        return res.status(400).json({ error: 'Message must be less than 5000 characters' });
    }
    req.body.content = (0, exports.sanitizeString)(content);
    next();
};
exports.validateMessage = validateMessage;
// Validate signup
const validateSignup = (req, res, next) => {
    const { name, email, password } = req.body;
    // Name validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (name.length > 100) {
        return res.status(400).json({ error: 'Name must be less than 100 characters' });
    }
    // Email validation
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    // Password validation
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (password.length > 100) {
        return res.status(400).json({ error: 'Password must be less than 100 characters' });
    }
    req.body.name = (0, exports.sanitizeString)(name);
    req.body.email = email.toLowerCase().trim();
    next();
};
exports.validateSignup = validateSignup;
//# sourceMappingURL=validation.js.map