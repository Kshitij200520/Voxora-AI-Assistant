import React, { useEffect } from 'react';
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
  X,
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { health } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isDbConnected = health?.database?.connected;
  const isAiReady = health?.ai?.configured;

  const handleLogout = async () => {
    if (onClose) onClose();
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111827]">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-glow-primary shrink-0">
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

        {/* Mobile Close Button (visible only inside mobile drawer) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110 shrink-0" />
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
        <div className="px-3 py-3 border-t border-white/10 bg-[#0E1424] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <NavLink
              to="/profile"
              onClick={() => {
                if (onClose) onClose();
              }}
              className="flex items-center gap-2.5 overflow-hidden group flex-1 hover:opacity-90 transition-opacity min-w-0"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                {userInitials}
              </div>
              <div className="truncate min-w-0">
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* System Status Indicators in Footer */}
      <div className="p-3 border-t border-white/10 bg-[#0B0F19]/60 space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-slate-500 shrink-0" /> Atlas
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
            <Brain className="w-3 h-3 text-slate-500 shrink-0" /> Groq AI
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
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (>= lg) */}
      <aside className="hidden lg:flex w-64 border-r border-white/10 flex-col shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Slide-out Drawer (< lg) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Dark Backdrop Overlay */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Slide-out Drawer Panel */}
        <aside
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-white/10 shadow-2xl transition-transform duration-300 ease-in-out z-50 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
};
