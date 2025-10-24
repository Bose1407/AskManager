// @ts-nocheck - Mongoose type inference issues
import { Router, Request, Response } from 'express';
import Task from '../models/Task';
import { validateTask, validateTaskStatus, validateComment } from '../middleware/validation';

const router = Router();

// Middleware to check authentication
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Middleware to check if user can modify task
const canModifyTask = async (req: Request, res: Response, next: Function) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Allow if: assigned to task, created the task, or is manager/admin
    const isAssignee = task.assignee?.toString() === user._id.toString();
    const isCreator = task.createdBy?.toString() === user._id.toString();
    const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';
    
    if (isAssignee || isCreator || isManagerOrAdmin) {
      return next();
    }
    
    return res.status(403).json({ error: 'Not authorized to modify this task' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify permissions' });
  }
};

// Middleware to check manager/admin role
const isManagerOrAdmin = (req: Request, res: Response, next: Function) => {
  const user = req.user as any;
  if (user.role === 'manager' || user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Requires manager or admin role' });
};

// Get all tasks
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find()
      .populate('assignee', 'name email profilePhoto')
      .populate('createdBy', 'name email')
      .populate('comments.userId', 'name profilePhoto')
      .sort({ createdAt: -1 });
    
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create new task
router.post('/', isAuthenticated, validateTask, async (req: Request, res: Response) => {
  try {
    const { title, description, priority, status, dueDate, assignee } = req.body;
    
    const task = await Task.create({
      title,
      description,
      priority,
      status: status || 'Todo',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignee: assignee || undefined,
      createdBy: (req.user as any)._id,
      comments: [],
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email profilePhoto')
      .populate('createdBy', 'name email');

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('task:created', populatedTask);
    }

    res.status(201).json({ task: populatedTask });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', isAuthenticated, validateTask, canModifyTask, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, dueDate, assignee } = req.body;

    const task = await Task.findByIdAndUpdate(
      id,
      {
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignee: assignee || undefined,
      },
      { new: true }
    )
      .populate('assignee', 'name email profilePhoto')
      .populate('createdBy', 'name email')
      .populate('comments.userId', 'name profilePhoto');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('task:updated', task);
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task status (for Kanban drag & drop)
router.patch('/:id/status', isAuthenticated, validateTaskStatus, canModifyTask, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('assignee', 'name email profilePhoto')
      .populate('createdBy', 'name email')
      .populate('comments.userId', 'name profilePhoto');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('task:status-changed', { taskId: id, status });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Delete task (only manager/admin can delete)
router.delete('/:id', isAuthenticated, isManagerOrAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('task:deleted', { id });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Add comment to task
router.post('/:id/comments', isAuthenticated, validateComment, canModifyTask, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.comments.push({
      userId: (req.user as any)._id,
      content,
      createdAt: new Date(),
    });

    await task.save();

    const populatedTask = await Task.findById(id)
      .populate('assignee', 'name email profilePhoto')
      .populate('createdBy', 'name email')
      .populate('comments.userId', 'name profilePhoto');

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('task:comment-added', populatedTask);
    }

    res.json({ task: populatedTask });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
