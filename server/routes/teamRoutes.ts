import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { TeamMember, TeamInvitation, TeamComment } from '../types';

export const teamRouter = Router();

// GET /api/team/members
teamRouter.get('/members', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const teamId = (req.query.teamId as string) || 'team_default';
  const members = db.getTeamMembers(teamId);
  return res.json({ members });
});

// POST /api/team/invite
teamRouter.post('/invite', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, role = 'CONTRIBUTOR', teamId = 'team_default' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Invited email is required.' });
    }

    const token = 'inv_' + crypto.randomBytes(16).toString('hex');
    const invitation: TeamInvitation = {
      id: 'ti_' + crypto.randomBytes(6).toString('hex'),
      teamId,
      token,
      role,
      invitedEmail: email.toLowerCase().trim(),
      createdBy: req.user!.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      status: 'PENDING',
    };

    db.saveTeamInvitation(invitation);
    db.addTeamActivity({
      id: 'act_' + crypto.randomBytes(6).toString('hex'),
      teamId,
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'invited',
      target: email,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      invitation,
      inviteUrl: `/team/join?token=${token}`,
      message: 'Invitation token generated successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create invitation.' });
  }
});

// POST /api/team/invitations/accept
teamRouter.post('/invitations/accept', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Invitation token is required.' });
  }

  const invitation = db.findInvitationByToken(token);
  if (!invitation) {
    return res.status(404).json({ error: 'Invalid or expired invitation token.' });
  }

  if (new Date(invitation.expiresAt).getTime() < Date.now()) {
    invitation.status = 'REVOKED';
    db.saveTeamInvitation(invitation);
    return res.status(400).json({ error: 'This invitation has expired.' });
  }

  // Check if user is already in team
  const existingMembers = db.getTeamMembers(invitation.teamId);
  const alreadyMember = existingMembers.find((m) => m.userId === req.user!.id);

  if (!alreadyMember) {
    const newMember: TeamMember = {
      id: 'tm_' + crypto.randomBytes(6).toString('hex'),
      teamId: invitation.teamId,
      userId: req.user!.id,
      role: invitation.role,
      email: req.user!.email,
      name: req.user!.name,
      joinedAt: new Date().toISOString(),
    };
    db.addTeamMember(newMember);
  }

  invitation.status = 'ACCEPTED';
  db.saveTeamInvitation(invitation);

  db.addTeamActivity({
    id: 'act_' + crypto.randomBytes(6).toString('hex'),
    teamId: invitation.teamId,
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'joined team',
    target: invitation.teamId,
    timestamp: new Date().toISOString(),
  });

  return res.json({ message: 'Successfully joined team workspace.', teamId: invitation.teamId });
});

// DELETE /api/team/members/:id
teamRouter.delete('/members/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const ok = db.removeTeamMember(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Member not found.' });
  }
  return res.json({ message: 'Team member removed.' });
});

// GET /api/team/activity
teamRouter.get('/activity', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const teamId = (req.query.teamId as string) || 'team_default';
  const activities = db.getTeamActivities(teamId);
  return res.json({ activities });
});

// GET /api/team/comments/:projectId
teamRouter.get('/comments/:projectId', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const comments = db.getTeamComments(req.params.projectId);
  return res.json({ comments });
});

// POST /api/team/comments
teamRouter.post('/comments', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { projectId, content } = req.body;
  if (!projectId || !content || !content.trim()) {
    return res.status(400).json({ error: 'Project ID and comment content are required.' });
  }

  const comment: TeamComment = {
    id: 'com_' + crypto.randomBytes(6).toString('hex'),
    projectId,
    userId: req.user!.id,
    userName: req.user!.name,
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };

  db.addTeamComment(comment);
  return res.status(201).json({ comment });
});
