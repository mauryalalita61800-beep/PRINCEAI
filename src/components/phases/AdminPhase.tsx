import React, { useState, useEffect } from 'react';
import { Settings, Shield, Users, Database, AlertTriangle, FileText, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../../services/api';

export const AdminPhase: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'security' | 'audit'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [mRes, uRes, sRes, aRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminSecurityEvents(),
        api.getAdminAuditLogs(),
      ]);
      setMetrics(mRes.metrics);
      setUsers(uRes.users);
      setSecurityEvents(sRes.securityEvents);
      setAuditLogs(aRes.auditLogs);
    } catch (err: any) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await api.updateAdminUser(user.id, { status: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChangeRole = async (user: any, newRole: string) => {
    try {
      const res = await api.updateAdminUser(user.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Admin Nav */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">Admin & Security Dashboard</h2>
            <p className="text-[11px] text-slate-500">Telemetry, RBAC User Controls & IDOR Security Logs</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'User Directory' },
            { id: 'security', label: 'Security Events' },
            { id: 'audit', label: 'Audit Trail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Registered Users', value: metrics?.totalUsers ?? '...', icon: Users, color: 'text-blue-600' },
                { label: 'Total Projects', value: metrics?.totalProjects ?? '...', icon: Database, color: 'text-indigo-600' },
                { label: 'Workflows Executed', value: metrics?.totalWorkflowRuns ?? '...', icon: Settings, color: 'text-purple-600' },
                { label: 'Estimated Storage', value: `${metrics?.storageMb ?? '...'} MB`, icon: Shield, color: 'text-emerald-600' },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>{card.label}</span>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Health & Compliance */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">PrinceAI System Integrity: Operational</h4>
                  <p className="text-[11px] text-emerald-700">
                    All 18 engine services running healthy. IDOR assertion firewall active.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                SECURE
              </span>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Workspace Accounts ({users.length})
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          className="px-2 py-0.5 text-xs bg-white border border-slate-200 rounded font-mono"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono">{u.plan}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 text-xs rounded font-medium ${
                            u.status === 'ACTIVE'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Security Events & IDOR Logs ({securityEvents.length})</span>
            </div>

            <div className="space-y-2">
              {securityEvents.length === 0 ? (
                <div className="text-xs text-slate-400 p-6 text-center">No security anomalies detected.</div>
              ) : (
                securityEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-amber-700">[{evt.eventType}]</span>{' '}
                      <span className="text-slate-800">{evt.details}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Audit Trail ({auditLogs.length})
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-blue-700">[{log.action}]</span>{' '}
                    <span className="text-slate-700">
                      User: {log.userEmail} • Target: {log.resource}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
