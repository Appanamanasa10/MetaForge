'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Code2, Loader2, KeyRound, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    if (!email.trim() || !name.trim() || !password.trim()) {
      toast.error('All fields are required.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // 1. Submit signup request to backend signup route
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.message || 'Registration failed.');
      }

      toast.success('Registration successful! Logging in...');

      // 2. Auto-login after successful registration
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
      toast.error(err.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative selection:bg-blue-500/30">
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-850 p-8 rounded-2xl shadow-xl backdrop-blur-xl space-y-6 glass-panel">
        
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500">
            <Code2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Create Account</h2>
          <p className="text-sm text-slate-400">Instantly sign up to build applications.</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleCredentialsSignUp} className="space-y-4">
          
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="name" className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
                Full Name
              </label>
              {errors?.name && (
                <span className="text-[10px] font-medium text-red-400">{errors.name[0]}</span>
              )}
            </div>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-550" />
              <input
                id="name"
                type="text"
                placeholder="Developer Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-750 transition-all text-sm ${
                  errors?.name ? 'border-red-500/50' : 'border-slate-800'
                }`}
                required
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="email" className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
                Email Address
              </label>
              {errors?.email && (
                <span className="text-[10px] font-medium text-red-400">{errors.email[0]}</span>
              )}
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-550" />
              <input
                id="email"
                type="email"
                placeholder="developer@metaforge.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-750 transition-all text-sm ${
                  errors?.email ? 'border-red-500/50' : 'border-slate-800'
                }`}
                required
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-semibold text-slate-455 uppercase tracking-wider">
                Password
              </label>
              {errors?.password && (
                <span className="text-[10px] font-medium text-red-400">{errors.password[0]}</span>
              )}
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-550" />
              <input
                id="password"
                type="password"
                placeholder="•••••••• (Min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-slate-950 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-750 transition-all text-sm ${
                  errors?.password ? 'border-red-500/50' : 'border-slate-800'
                }`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-650 hover:bg-blue-600 text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            Register &amp; Login
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
