'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Code2, Loader2, KeyRound, Mail, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [sandboxEmail, setSandboxEmail] = useState('');
  const [sandboxName, setSandboxName] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const isDev = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    const errorType = searchParams.get('error');
    if (errorType) {
      if (errorType === 'CredentialsSignin') {
        setInlineError('Invalid email or password. Please try again.');
      } else if (errorType === 'SessionRequired') {
        setInlineError('Your session has expired. Please log in again.');
      } else {
        setInlineError(`Authentication error: ${errorType}`);
      }
    }
  }, [searchParams]);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (!email.trim() || !password.trim()) {
      setInlineError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (res?.error) {
        setInlineError('Invalid email or password. Please check your credentials.');
      } else {
        toast.success('Welcome back to MetaForge!');
        const destination = searchParams.get('callbackUrl') || '/dashboard';
        window.location.href = destination;
      }
    } catch (err) {
      setInlineError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxEmail.trim()) {
      toast.error('Sandbox email is required.');
      return;
    }
    setSandboxLoading(true);
    try {
      const res = await signIn('sandbox', {
        email: sandboxEmail.trim(),
        name: sandboxName.trim() || 'Sandbox Explorer',
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || 'Sandbox login failed.');
      } else {
        toast.success('Logged in to Developer Sandbox!');
        const destination = searchParams.get('callbackUrl') || '/dashboard';
        window.location.href = destination;
      }
    } catch (err) {
      toast.error('An unexpected error occurred during Sandbox login.');
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 grid-bg flex flex-col items-center justify-center p-6 relative selection:bg-blue-500/30">

      {/* Decorative Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -z-10 pointer-events-none" />

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
          <h1 className="mt-5 text-2xl font-bold text-slate-100 tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-400">Sign in to your account to continue.</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-7 rounded-2xl shadow-2xl backdrop-blur-xl space-y-5 glass-panel">

          {/* Inline error banner */}
          {inlineError && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm animate-slide-down">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{inlineError}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setInlineError(null); }}
                  disabled={loading || sandboxLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-600 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setInlineError(null); }}
                  disabled={loading || sandboxLoading}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-600 transition-all text-sm"
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
            </div>

            <button
              type="submit"
              disabled={loading || sandboxLoading}
              className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20 mt-2"
            >
              {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Sign In
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Create Account
            </Link>
          </p>

          {/* Developer Sandbox Section */}
          {isDev && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-slate-800" />
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-slate-900/50 px-2">
                  Dev Sandbox
                </span>
                <div className="flex-1 border-t border-slate-800" />
              </div>

              <form onSubmit={handleSandboxSignIn} className="space-y-3 bg-amber-950/10 p-4 rounded-xl border border-amber-900/30">
                <p className="text-[10px] text-amber-600/80 font-semibold">Bypass auth — auto-registers on first use</p>
                <div className="flex flex-col space-y-1">
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-600" />
                    <input
                      id="sandboxEmail"
                      type="email"
                      placeholder="sandbox@metaforge.io"
                      value={sandboxEmail}
                      onChange={(e) => setSandboxEmail(e.target.value)}
                      disabled={loading || sandboxLoading}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="relative">
                    <User className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-600" />
                    <input
                      id="sandboxName"
                      type="text"
                      placeholder="Display Name (optional)"
                      value={sandboxName}
                      onChange={(e) => setSandboxName(e.target.value)}
                      disabled={loading || sandboxLoading}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || sandboxLoading}
                  className="w-full inline-flex justify-center items-center px-3 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {sandboxLoading && <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5 text-slate-800" />}
                  Quick Sandbox Login
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
