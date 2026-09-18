import React from 'react';
import { Sparkles, ShieldCheck, Download, CheckCircle2, User, LogOut } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activePhase: string;
  user?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenTesting?: () => void;
  onOpenSystemTest?: () => void;
  onLogout?: () => void;
  onSwitchRole?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePhase,
  user = null,
  onOpenAuth,
  onOpenTesting,
  onOpenSystemTest,
  onLogout,
  onSwitchRole,
}) => {
  const handleOpenTesting = onOpenTesting || onOpenSystemTest || (() => {});
  return (
    <header id="princeai-navbar" className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-sm text-white font-bold text-lg tracking-tight">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">PrinceAI</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                Phase 1–18 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">All-in-One Autonomous GenAI Platform</p>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 hidden md:block mx-1" />

        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="text-slate-400">Active Module:</span>
          <span className="capitalize font-semibold text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
            {activePhase.replace('-', ' ')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Verification & Testing button */}
        <button
          id="btn-nav-run-tests"
          onClick={handleOpenTesting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
          title="Run Phase 1 to 18 verification tests and generate complete ZIP"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verify & Export ZIP</span>
        </button>

        {/* Direct Download ZIP */}
        <a
          id="btn-nav-download-zip"
          href="/api/system/download-zip"
          download="PrinceAI_Phase18_TestingComplete.zip"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-2xs"
          title="Download PrinceAI_Phase18_TestingComplete.zip"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download ZIP</span>
        </a>

        <div className="h-5 w-[1px] bg-slate-200 mx-1" />

        {/* User Account / Role switcher */}
        {user ? (
          <div className="flex items-center gap-2">
            <button
              id="btn-user-role-badge"
              onClick={onSwitchRole}
              title={`Logged in as ${user.email}. Click to toggle Admin/User persona.`}
              className="flex items-center gap-2 px-2.5 py-1 text-xs rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <div className="font-semibold text-slate-800 text-[11px] leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{user.role}</div>
              </div>
            </button>
            <button
              id="btn-logout"
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="btn-login"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
