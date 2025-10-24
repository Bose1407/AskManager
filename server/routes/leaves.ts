// @ts-nocheck - Mongoose type inference issues
import { Router, Request, Response } from 'express';
import Leave from '../models/Leave';
import { validateLeave } from '../middleware/validation';

const router = Router();

// Middleware to check authentication
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Get all leave requests
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const leaves = await Leave.find()
      .populate('employee', 'name email profilePhoto')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ leaves });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// Create new leave request
router.post('/', isAuthenticated, validateLeave, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, reason, daysRequested } = req.body;
    const currentUser = req.user as any;
    
    const leave = await Leave.create({
      employee: currentUser._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      reason,
      daysRequested,
      status: 'Pending',
    });

    const populatedLeave = await Leave.findById(leave._id)
      .populate('employee', 'name email profilePhoto');

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('leave:created', populatedLeave);
    }

    // Send email notification to managers (non-blocking)
    import('../utils/email').then(async ({ sendEmail, emailTemplates }) => {
      try {
        const User = require('../models/User').default;
        const managers = await User.find({ role: { $in: ['manager', 'admin'] } }).select('email name');
        
        const template = emailTemplates.leaveRequestSubmitted(
          currentUser.name,
          'Manager',
          type,
          new Date(startDate).toLocaleDateString(),
          new Date(endDate).toLocaleDateString(),
          reason
        );

        managers.forEach((manager: any) => {
          sendEmail({
            to: manager.email,
            subject: template.subject,
            html: template.html.replace('Manager', manager.name),
          }).catch(err => console.error('Failed to send leave notification:', err));
        });
      } catch (err) {
        console.error('Failed to notify managers:', err);
      }
    });

    res.status(201).json({ leave: populatedLeave });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// Approve leave
router.patch('/:id/approve', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;

    // Check if user is manager or admin
    if (user.role !== 'manager' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to approve leaves' });
    }

    const leave = await Leave.findByIdAndUpdate(
      id,
      {
        status: 'Approved',
        reviewedBy: user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    )
      .populate('employee', 'name email profilePhoto')
      .populate('reviewedBy', 'name email');

    if (!leave) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('leave:approved', leave);
    }

    // Send approval email to employee (non-blocking)
    import('../utils/email').then(({ sendEmail, emailTemplates }) => {
      const template = emailTemplates.leaveStatusUpdate(
        leave.employee.name,
        'approved',
        leave.type,
        leave.startDate.toLocaleDateString(),
        leave.endDate.toLocaleDateString()
      );
      
      sendEmail({
        to: leave.employee.email,
        subject: template.subject,
        html: template.html,
      }).catch(err => console.error('Failed to send approval email:', err));
    });

    res.json({ leave });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve leave' });
  }
});

// Reject leave
router.patch('/:id/reject', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;

    // Check if user is manager or admin
    if (user.role !== 'manager' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to reject leaves' });
    }

    const leave = await Leave.findByIdAndUpdate(
      id,
      {
        status: 'Rejected',
        reviewedBy: user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    )
      .populate('employee', 'name email profilePhoto')
      .populate('reviewedBy', 'name email');

    if (!leave) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('leave:rejected', leave);
    }

    // Send rejection email to employee (non-blocking)
    import('../utils/email').then(({ sendEmail, emailTemplates }) => {
      const template = emailTemplates.leaveStatusUpdate(
        leave.employee.name,
        'rejected',
        leave.type,
        leave.startDate.toLocaleDateString(),
        leave.endDate.toLocaleDateString()
      );
      
      sendEmail({
        to: leave.employee.email,
        subject: template.subject,
        html: template.html,
      }).catch(err => console.error('Failed to send rejection email:', err));
    });

    res.json({ leave });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject leave' });
  }
});

export default router;
