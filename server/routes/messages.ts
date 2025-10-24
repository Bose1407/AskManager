// @ts-nocheck - Mongoose type inference issues
import { Router, Request, Response } from 'express';
import Message from '../models/Message';

const router = Router();

// Middleware to check authentication
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Get all messages
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const messages = await Message.find()
      .populate('sender', 'name email profilePhoto')
      .sort({ createdAt: 1 })
      .limit(100); // Limit to last 100 messages
    
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Pin/unpin message
router.patch('/:id/pin', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    const message = await Message.findByIdAndUpdate(
      id,
      { isPinned },
      { new: true }
    ).populate('sender', 'name email profilePhoto');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('message:pinned', message);
    }

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

export default router;
