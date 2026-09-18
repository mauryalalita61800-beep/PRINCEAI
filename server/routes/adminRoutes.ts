import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest, requireRole } from '../middleware/auth';

export const adminRouter = Router();

// Enforce ADMIN or SUPER_ADMIN on all admin routes
adminRouter.use(authenticateUser, requireRole(['ADMIN', 'SUPER_ADMIN']));

// GET /api/admin/metrics
adminRouter.get('/metrics', (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getStats();
  const storageMb = Math.round((stats.totalDocuments * 1.5 + stats.totalProjects * 2.2 + 10) * 10) / 10;

  return res.json({
    metrics: {
      ...stats,
      storageMb,
      systemStatus: 'OPERATIONAL',
      activeContainers: 1,
      apiHealth: 'HEALTHY',
    },
  });
});

// GET /api/admin/users
adminRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().map((u) => {
    const { passwordHash, ...safe } = u;
    return safe;
  });
  return res.json({ users });
});

// PATCH /api/admin/users/:id
adminRouter.patch('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  const { status, role, plan } = req.body;
  const targetId = req.params.id;

  const targetUser = db.findUserById(targetId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Only SUPER_ADMIN can change user roles to ADMIN or SUPER_ADMIN
  if (role && req.user!.role !== 'SUPER_ADMIN') {
    db.logSecurityEvent({
      userId: req.user!.id,
      ip: req.ip || 'unknown',
      eventType: 'ROLE_UNAUTHORIZED',
      details: `Non-super-admin attempted to change role for user ${targetUser.email}`,
    });
    return res.status(403).json({ error: 'Only SUPER_ADMIN can modify user roles.' });
  }

  const updates: any = {};
  if (status && (status === 'ACTIVE' || status === 'SUSPENDED')) {
    updates.status = status;
  }
  if (role && ['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    updates.role = role;
  }
  if (plan && ['FREE', 'PRO', 'ADMIN'].includes(plan)) {
    updates.plan = plan;
  }

  const updated = db.updateUser(targetId, updates);
  db.logAudit({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'ADMIN_USER_UPDATE',
    resource: targetId,
    metadata: updates,
  });

  const { passwordHash, ...safe } = updated!;
  return res.json({ user: safe });
});

// GET /api/admin/security-events
adminRouter.get('/security-events', (req: AuthenticatedRequest, res: Response) => {
  const events = db.getSecurityEvents();
  return res.json({ securityEvents: events });
});

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  return res.json({ auditLogs: logs });
});
