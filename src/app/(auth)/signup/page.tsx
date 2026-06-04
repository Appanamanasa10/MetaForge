'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Code2, Loader2, KeyRound, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    setInlineError(null);

    if (!email.trim() || !name.trim() || !password.trim()) {
      setInlineError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setInlineError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), password }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setInlineError(data.message || 'Registration failed.');
        return;
      }

      toast.success('Account created! Logging you in...');

      const loginRes = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        toast.error('Auto-login failed. Please sign in manually.');
        router.push('/login');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setInlineError(err.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 grid-bg flex flex-col items-center justify-center p-6 relative selection:bg-blue-500/30">

      {/* Decorative Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center transition-all group-hover:bg-blue-600/25">
              <Code2 className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              MetaForge
            </span>
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-slate-100 tracking-tight">Create your account</h1>
          <p className="mt-1.5 text-sm text-slate-400">Start building schema-driven applications today.</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-7 rounded-2xl shadow-2xl backdrop-blur-xl space-y-5 glass-panel">

          {/* Inline error banner */}
          {inlineError && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm animate-slide-down">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{inlineError}</span>
            </div>
          )}

          <form onSubmit={handleCredentialsSignUp} className="space-y-4">

            {/* Full Name */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                {errors?.name && <span className="text-[10px] font-medium text-red-400">{errors.name[0]}</span>}
              </div>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setInlineError(null); }}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${
                    errors?.name ? 'border-red-500/50' : 'border-slate-700 hover:border-slate-600'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                {errors?.email && <span className="text-[10px] font-medium text-red-400">{errors.email[0]}</span>}
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setInlineError(null); }}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${
                    errors?.email ? 'border-red-500/50' : 'border-slate-700 hover:border-slate-600'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                {errors?.password && <span className="text-[10px] font-medium text-red-400">{errors.password[0]}</span>}
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setInlineError(null); }}
                  disabled={loading}
                  className={`w-full pl-10 pr-11 py-2.5 rounded-xl border bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${
                    errors?.password ? 'border-red-500/50' : 'border-slate-700 hover:border-slate-600'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1.5">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          i <= Math.ceil(strength.score * 4 / 5)
                            ? strength.color
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] font-semibold ${
                    strength.color === 'bg-red-500' ? 'text-red-400'
                    : strength.color === 'bg-amber-500' ? 'text-amber-400'
                    : strength.color === 'bg-blue-500' ? 'text-blue-400'
                    : 'text-emerald-400'
                  }`}>
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20 mt-2"
            >
              {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Create Account
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
