import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, hashPassword } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../types';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newUser: User = {
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash: hashPassword(password),
      role: 'USER',
      plan: 'FREE',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    };

    db.createUser(newUser);
    db.logAudit({
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'USER_REGISTERED',
      resource: 'users',
    });

    const token = `prince_tok_${newUser.id}_${crypto.randomBytes(16).toString('hex')}`;

    const { passwordHash, ...safeUser } = newUser;
    return res.status(201).json({
      user: safeUser,
      token,
      message: 'Account registered successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      db.logSecurityEvent({
        ip: req.ip || 'unknown',
        eventType: 'LOGIN_FAIL',
        details: `Failed login attempt for non-existent email: ${email}`,
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact administrator.' });
    }

    const hashed = hashPassword(password);
    if (user.passwordHash !== hashed) {
      db.logSecurityEvent({
        userId: user.id,
        ip: req.ip || 'unknown',
        eventType: 'LOGIN_FAIL',
        details: `Incorrect password attempt for user: ${email}`,
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = `prince_tok_${user.id}_${crypto.randomBytes(16).toString('hex')}`;

    db.logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      resource: 'auth',
    });

    const { passwordHash, ...safeUser } = user;
    return res.json({
      user: safeUser,
      token,
      message: 'Logged in successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { passwordHash, ...safeUser } = req.user;
  return res.json({ user: safeUser });
});

// POST /api/auth/logout
authRouter.post('/logout', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    db.logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'USER_LOGOUT',
      resource: 'auth',
    });
  }
  return res.json({ message: 'Logged out successfully.' });
});
