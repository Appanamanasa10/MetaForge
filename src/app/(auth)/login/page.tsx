'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Code2, Loader2, KeyRound, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Credentials login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Sandbox login state
  const [sandboxEmail, setSandboxEmail] = useState('');
  const [sandboxName, setSandboxName] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Check if we are running in development mode
  const isDev = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    const errorType = searchParams.get('error');
    if (errorType) {
      if (errorType === 'CredentialsSignin') {
        toast.error('Invalid email or password. Please try again.');
      } else if (errorType === 'SessionRequired') {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(`Authentication error: ${errorType}`);
      }
    }
  }, [searchParams]);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password.');
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
        toast.error(res.error || 'Login failed. Please check credentials.');
      } else {
        toast.success('Welcome back to MetaForge!');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error('An unexpected error occurred during login.');
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
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error('An unexpected error occurred during Sandbox login.');
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative selection:bg-blue-500/30">
      
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-850 p-8 rounded-2xl shadow-xl backdrop-blur-xl space-y-6 glass-panel">
        
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500">
            <Code2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Welcome to MetaForge</h2>
          <p className="text-sm text-slate-400">Build applications from configuration.</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-550" />
              <input
                id="email"
                type="email"
                placeholder="developer@metaforge.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || sandboxLoading}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-750 transition-all text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-slate-455 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-550" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || sandboxLoading}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-750 transition-all text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || sandboxLoading}
            className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-650 hover:bg-blue-600 text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            Sign In
          </button>
        </form>

        {/* Redirect to signup */}
        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-400 hover:underline font-semibold">
            Create Account
          </Link>
        </p>

        {/* Developer Sandbox Section (Dev Environment Only) */}
        {isDev && (
          <div className="space-y-4 pt-4 border-t border-slate-850">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-850"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-950 px-2.5 text-amber-500 font-bold tracking-wider">
                  Developer Sandbox Bypass
                </span>
              </div>
            </div>

            <form onSubmit={handleSandboxSignIn} className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              <div className="flex flex-col space-y-1">
                <label htmlFor="sandboxEmail" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Sandbox Email (Auto-registers)
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-600" />
                  <input
                    id="sandboxEmail"
                    type="email"
                    placeholder="sandbox@metaforge.io"
                    value={sandboxEmail}
                    onChange={(e) => setSandboxEmail(e.target.value)}
                    disabled={loading || sandboxLoading}
                    className="w-full pl-9 pr-3 py-1.5 rounded border border-slate-850 bg-slate-900 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="sandboxName" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-600" />
                  <input
                    id="sandboxName"
                    type="text"
                    placeholder="Dev Explorer"
                    value={sandboxName}
                    onChange={(e) => setSandboxName(e.target.value)}
                    disabled={loading || sandboxLoading}
                    className="w-full pl-9 pr-3 py-1.5 rounded border border-slate-850 bg-slate-900 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || sandboxLoading}
                className="w-full inline-flex justify-center items-center px-3 py-2 rounded text-xs font-bold bg-amber-650 hover:bg-amber-600 text-slate-950 transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {sandboxLoading && <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5 text-slate-950" />}
                Quick Login
              </button>
            </form>
          </div>
        )}
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
