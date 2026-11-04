import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const { updateUser, refreshUser } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function verify() {
      if (!token) {
        setIsLoading(false);
        setMessage('Verification token is missing from the URL.');
        return;
      }

      try {
        const res = await authService.verifyEmail(token);
        if (mounted) {
          if (res.success) {
            setIsSuccess(true);
            setMessage(res.message || 'Your email address has been verified!');
            updateUser({ isEmailVerified: true });
            refreshUser();
          } else {
            setIsSuccess(false);
            setMessage(res.message || 'Email verification failed.');
          }
        }
      } catch (err: any) {
        if (mounted) {
          setIsSuccess(false);
          setMessage(err.message || 'Invalid or expired verification token.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    verify();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white shadow-lg shadow-emerald-600/30 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Email Verification</h1>
          <p className="text-xs text-slate-400 mt-1">Activating automated voice & reminder email dispatches</p>
        </div>

        <div className="bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/50 text-center">
          {isLoading ? (
            <div className="py-8">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">Verifying your registered email address...</p>
            </div>
          ) : isSuccess ? (
            <div className="py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Email Verified Successfully!</h2>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                {message} Automated email alerts for all your voice and scheduled reminders are now enabled.
              </p>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/30"
              >
                Go to VOXORA Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="py-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Verification Failed</h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                {message || 'The verification link is invalid or has expired.'}
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/settings"
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-all"
                >
                  Request New Verification Link in Settings
                </Link>
                <Link
                  to="/login"
                  className="text-xs text-slate-400 hover:text-slate-200 mt-2"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

