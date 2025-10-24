import { Request, Response, NextFunction } from 'express';

// Sanitize string input (remove dangerous characters, trim whitespace)
export const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 5000); // Limit length
};

// Validate task creation/update
export const validateTask = (req: Request, res: Response, next: NextFunction) => {
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
  req.body.title = sanitizeString(title);
  if (description) {
    req.body.description = sanitizeString(description);
  }

  next();
};

// Validate task status update
export const validateTaskStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;

  const validStatuses = ['Todo', 'In Progress', 'Review', 'Completed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (Todo, In Progress, Review, or Completed)' });
  }

  next();
};

// Validate task comment
export const validateComment = (req: Request, res: Response, next: NextFunction) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment content is required' });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Comment must be less than 2000 characters' });
  }

  req.body.content = sanitizeString(content);
  next();
};

// Validate leave request
export const validateLeave = (req: Request, res: Response, next: NextFunction) => {
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

  req.body.reason = sanitizeString(reason);
  next();
};

// Validate chat message
export const validateMessage = (req: Request, res: Response, next: NextFunction) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required' });
  }
  if (content.length > 5000) {
    return res.status(400).json({ error: 'Message must be less than 5000 characters' });
  }

  req.body.content = sanitizeString(content);
  next();
};

// Validate signup
export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
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

  req.body.name = sanitizeString(name);
  req.body.email = email.toLowerCase().trim();

  next();
};
