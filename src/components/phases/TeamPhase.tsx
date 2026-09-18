import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MessageCircle, Activity, Shield, Check, Trash2, Send } from 'lucide-react';
import { api } from '../../services/api';
import { TeamMember } from '../../types';

export const TeamPhase: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CONTRIBUTOR');
  const [inviteResult, setInviteResult] = useState<{ token: string; url: string } | null>(null);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const [mRes, aRes, cRes] = await Promise.all([
        api.getTeamMembers(),
        api.getTeamActivity(),
        api.getTeamComments('proj_shared_default'),
      ]);
      setMembers(mRes.members || []);
      setActivities(aRes.activities || []);
      setComments(cRes.comments || []);
    } catch (err) {
      console.error('Failed to load team data', err);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const res = await api.inviteTeamMember(inviteEmail.trim(), inviteRole);
      setInviteResult({
        token: res.invitation.token,
        url: `${window.location.origin}${res.inviteUrl}`,
      });
      setInviteEmail('');
      loadTeamData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSimulateAcceptInvite = async (token: string) => {
    try {
      await api.acceptTeamInvite(token);
      alert('Invitation accepted! User added to workspace.');
      setInviteResult(null);
      loadTeamData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.postTeamComment('proj_shared_default', newComment.trim());
      setComments([...comments, res.comment]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Team Roster & Invitations */}
      <div className="w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Team Roster</h3>
          </div>

          <form onSubmit={handleSendInvite} className="space-y-2">
            <input
              type="email"
              placeholder="Colleague's work email..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
            />
            <div className="flex gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="flex-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="VIEWER">Viewer (Read-only)</option>
                <option value="CONTRIBUTOR">Contributor (Edit)</option>
                <option value="EDITOR">Editor (Manage)</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0"
              >
                Invite
              </button>
            </div>
          </form>

          {inviteResult && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1.5">
              <div className="font-bold text-blue-900 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Single-Use Token Created</span>
              </div>
              <p className="font-mono text-[10px] break-all text-slate-600">{inviteResult.token}</p>
              <button
                onClick={() => handleSimulateAcceptInvite(inviteResult.token)}
                className="w-full py-1 text-[11px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Simulate Acceptance
              </button>
            </div>
          )}
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-slate-900">{m.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{m.email}</div>
              </div>
              <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed & Team Discussion */}
      <div className="flex-1 flex flex-col h-full bg-white divide-y divide-slate-200 overflow-hidden">
        {/* Activity Feed */}
        <div className="h-64 p-4 flex flex-col overflow-hidden bg-slate-50/30">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Workspace Activity Stream</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {activities.length === 0 ? (
              <div className="text-xs text-slate-400 py-4">No recent team activities.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs flex justify-between">
                  <span>
                    <strong className="text-slate-800">{act.userName}</strong> {act.action}{' '}
                    <code className="text-blue-600">{act.target}</code>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Project Comments Thread */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Project Collaboration Thread</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {comments.map((com) => (
              <div key={com.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">{com.userName}</span>
                  <span className="text-slate-400 font-mono">
                    {new Date(com.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-slate-700">{com.content}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Leave a project comment or architectural feedback..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Comment</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
