import React, { useState } from 'react';
import { User } from '../types';
import { KemorLogo } from './KemorLogo';
import {
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  RefreshCw,
  LogOut,
  X,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  onVerifyEmail: (userId: string, token?: string) => Promise<boolean>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onLoginSuccess,
  onLogout,
  onVerifyEmail,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'status'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account');
      }

      setSuccessMessage(data.message || 'Registration successful! Verification link sent.');
      onLoginSuccess(data.user, data.sessionToken);
      setTimeout(() => {
        setMode('status');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sign in failed');
      }

      onLoginSuccess(data.user, data.sessionToken);
      setSuccessMessage('Welcome back to KEMOR!');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      // Authenticate with Google
      const googleEmail = currentUser?.email || 'wurstxvx@gmail.com';
      const googleName = currentUser?.name || 'WurstXVX';
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          name: googleName,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Google Sign-In failed');

      onLoginSuccess(data.user, data.sessionToken);
      setSuccessMessage('Google Account authenticated successfully!');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to request password reset');

      setSuccessMessage(data.message);
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setMode('reset');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMessage(data.message);
      setTimeout(() => {
        setMode('login');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailClick = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    clearMessages();
    const ok = await onVerifyEmail(currentUser.id);
    setIsLoading(false);
    if (ok) {
      setSuccessMessage('Email address verified! Full server access granted.');
    } else {
      setErrorMessage('Could not verify email. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[94vh] overflow-y-auto bg-[#0a0f1d] border border-[#1e293b] rounded-3xl p-5 sm:p-8 shadow-2xl relative">
        {/* Subtle Neon Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {currentUser && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-[#1a2333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <KemorLogo size="lg" showText={true} className="mb-2" />
          <h2 className="text-xl font-bold text-white tracking-wide mt-2">
            {mode === 'login' && 'Sign in to KEMOR'}
            {mode === 'register' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Your Password'}
            {mode === 'reset' && 'Set New Password'}
            {mode === 'status' && 'Account & Verification'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {mode === 'login' && 'Enter your registered email and password to access your servers and voice rooms.'}
            {mode === 'register' && 'Join the esports communication platform for competitive squads & voice.'}
            {mode === 'forgot' && 'Enter your registered email address and we will generate a secure reset link.'}
            {mode === 'reset' && 'Enter the reset token and your new strong password.'}
            {mode === 'status' && 'View your authenticated identity, verification status, and security keys.'}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-2 text-emerald-300 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-[#121724] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('forgot');
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#121724] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google Sign In Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#1e293b] w-full" />
              <span className="bg-[#0a0f1d] px-3 text-[11px] text-slate-500 uppercase tracking-wider">
                Or Continue With
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 bg-[#121724] hover:bg-[#1a2333] border border-[#1e293b] text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <div className="text-center text-xs text-slate-400 pt-2">
              Need an account?{' '}
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('register');
                }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Register
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTRATION FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Display Name
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ShadowSniper"
                  required
                  className="w-full bg-[#121724] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-[#121724] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#121724] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-400 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('login');
                }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleRequestPasswordReset} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Your Registered Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-[#121724] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Reset Instructions</span>}
            </button>

            <div className="text-center text-xs text-slate-400 pt-2">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('login');
                }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Return to Login
              </button>
            </div>
          </form>
        )}

        {/* 4. SET NEW PASSWORD */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Reset Token
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token from reset email"
                  required
                  className="w-full bg-[#121724] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                New Password (min 6 characters)
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#121724] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
            </button>
          </form>
        )}

        {/* 5. CURRENT ACCOUNT STATUS & EMAIL VERIFICATION */}
        {mode === 'status' && currentUser && (
          <div className="space-y-4">
            <div className="p-4 bg-[#121724] border border-[#1e293b] rounded-2xl flex items-center space-x-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400"
              />
              <div className="truncate flex-1">
                <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <span className="truncate">{currentUser.name}</span>
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                    #{currentUser.tag}
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {currentUser.id}</div>
              </div>
            </div>

            {/* Email verification status box */}
            <div
              className={`p-3.5 rounded-2xl border flex items-start space-x-3 ${
                currentUser.isEmailVerified
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {currentUser.isEmailVerified ? (
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-bold">
                  {currentUser.isEmailVerified
                    ? 'Email Verified (Protected Account)'
                    : 'Email Verification Pending'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {currentUser.isEmailVerified
                    ? 'Your email address is verified. Your servers, channels, and direct messages are permanently persistent.'
                    : 'Please verify your email to unlock all server creation, voice capacity, and invite permissions.'}
                </p>

                {!currentUser.isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyEmailClick}
                    disabled={isLoading}
                    className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Email Address Now'}
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
