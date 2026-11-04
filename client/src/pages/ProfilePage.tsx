import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import {
  User,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resend verification
  const [isResending, setIsResending] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      const res = await userService.updateProfile({
        fullName: fullName.trim(),
        timezone,
      });

      if (res.success && res.data) {
        updateUser(res.data);
        setProfileMessage({ type: 'success', text: 'Profile details saved successfully.' });
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await userService.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setVerificationFeedback(null);
    try {
      const res = await authService.resendVerification();
      setVerificationFeedback(res.message || 'Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setVerificationFeedback(err.message || 'Failed to send verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">User Profile & Account</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details, email status, and security settings
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-600/30">
              {user?.fullName
                ?.split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{user?.fullName || 'User'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {user?.email}
                </span>
                {user?.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" />
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          {!user?.isEmailVerified && (
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {isResending ? 'Sending...' : 'Resend Verification'}
            </button>
          )}
        </div>

        {verificationFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
            {verificationFeedback}
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal Information</h3>

          {profileMessage && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email (Read-Only)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2 bg-[#080C14] border border-white/5 rounded-xl text-sm text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Asia/Kolkata"
                required
                className="w-full px-3.5 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">Used to format voice commands and reminder triggers</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingProfile ? 'Saving...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <KeyRound className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Security & Password</h2>
        </div>

        {passwordMessage && (
          <div
            className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-xs ${
              passwordMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password (min 8)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

