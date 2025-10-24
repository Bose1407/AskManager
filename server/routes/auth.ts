// @ts-nocheck
import { Router } from 'express';
import passport from '../config/passport';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { validateSignup } from '../middleware/validation';

const router = Router();

// Google OAuth login (capture desired role in session if provided)
router.get(
  '/google',
  (req, res, next) => {
    const role = (req.query.role as string) || 'employee';
    if (req.session) {
      req.session.oauthRole = role;
    }
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login?error=auth_failed',
  }),
  (req, res) => {
    // Ensure session is saved before redirecting
    if (req.session) {
      req.session.save(() => {
        res.redirect('/auth/success');
      });
    } else {
      res.redirect('/auth/success');
    }
  }
);

// Get current authenticated user
router.get('/user', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      user: {
        id: (req.user as any)._id,
        name: (req.user as any).name,
        email: (req.user as any).email,
        role: (req.user as any).role,
        profilePhoto: (req.user as any).profilePhoto,
      },
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Local email/password signup
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role?: string;
    };

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'An account with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hash,
      role: ['manager', 'employee', 'admin'].includes(role || '')
        ? role
        : 'employee',
    });

    // Send welcome email (non-blocking)
    import('../utils/email').then(({ sendEmail, emailTemplates }) => {
      const template = emailTemplates.welcome(
        newUser.name,
        'Company Manager'
      );
      sendEmail({
        to: newUser.email,
        subject: template.subject,
        html: template.html,
      }).catch((err) =>
        console.error('Failed to send welcome email:', err)
      );
    });

    req.login(newUser, (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: 'Signup succeeded but login failed' });
      res.json({
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          profilePhoto: newUser.profilePhoto,
        },
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Local email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: 'Login failed' });
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhoto: user.profilePhoto,
        },
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
