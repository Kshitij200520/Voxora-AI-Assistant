import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  Receipt,
  CheckSquare,
  Bell,
  History,
  Settings,
  Sparkles,
  Database,
  Brain,
  User,
  LogOut,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Voice Assistant', path: '/voice', icon: Mic, highlight: true },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Reminders', path: '/reminders', icon: Bell },
  { name: 'Activity History', path: '/activity', icon: History },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { health } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isDbConnected = health?.database?.connected;
  const isAiReady = health?.ai?.configured;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <aside className="w-64 bg-[#111827] border-r border-white/10 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-glow-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-lg text-white tracking-tight">VOXORA</h1>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">
              AI
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-none">Speak. Understand. Act.</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              {item.highlight && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Authenticated User Footer Bar */}
      {user && (
        <div className="px-3 py-3 border-t border-white/10 bg-[#0E1424]">
          <div className="flex items-center justify-between gap-2">
            <NavLink
              to="/profile"
              className="flex items-center gap-2.5 overflow-hidden group flex-1 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                {userInitials}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate block">
                    {user.fullName}
                  </span>
                  {user.isEmailVerified ? (
                    <span title="Verified Account">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    </span>
                  ) : (
                    <span title="Email Unverified">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 truncate block">{user.email}</span>
              </div>
            </NavLink>

            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* System Status Indicators in Footer */}
      <div className="p-3 border-t border-white/10 bg-[#0B0F19]/60 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-slate-500" /> Atlas
          </span>
          <span
            className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              isDbConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full ${
                isDbConnected ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            {isDbConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Brain className="w-3 h-3 text-slate-500" /> Groq AI
          </span>
          <span
            className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              isAiReady
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full ${
                isAiReady ? 'bg-indigo-400' : 'bg-amber-400'
              }`}
            />
            {isAiReady ? 'Ready' : 'No Key'}
          </span>
        </div>
      </div>
    </aside>
  );
};
