import Link from 'next/link';
import { Code2, ArrowRight, Table, Layers, Zap, ShieldCheck, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Decorative gradient overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>

      {/* Header bar */}
      <header className="px-6 lg:px-8 h-16 flex items-center justify-between border-b border-slate-900 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center space-x-2">
          <Code2 className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            MetaForge
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 text-center max-w-4xl mx-auto py-20 lg:py-32">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-950/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="h-3.5 w-3.5" />
          <span>Schema-Driven App Builder</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Build applications <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            from configuration.
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl">
          Instantly convert JSON configurations into working full-stack runtimes complete with validation, forms, tables, CSV imports, and automation workflows.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all group cursor-pointer"
          >
            Create Your Application
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-200 transition-all cursor-pointer hover:border-slate-700"
          >
            Developer Sandbox
          </Link>
        </div>
      </section>

      {/* Feature section */}
      <section className="border-t border-slate-900 bg-slate-950/20 py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-200">Production-Ready Architecture</h2>
            <p className="mt-3 text-slate-400">Everything you need to compile configurations into responsive application runtimes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/10 glass-panel">
              <Layers className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-200">Dynamic Forms</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Compile schemas to React Hook Form with Zod validation. Supports email, select options, dates, and safe fallback error states.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/10 glass-panel">
              <Table className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-200">Interactive Tables</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Table views automatically mapped from columns, supporting full-text keyword search, pagination, and multi-field custom sorting.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/10 glass-panel">
              <Zap className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-200">Workflow Automation</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Establish trigger actions (e.g. RECORD_CREATED) that parse template strings and auto-generate audit logs or notifications.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/10 glass-panel">
              <Database className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-200">CSV Import</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Map column names to schema properties, preview mapped records, validate rows, check duplicates, and batch import.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/10 glass-panel">
              <ShieldCheck className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-200">Secure Authentication</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Securely persist application data under individual user accounts using secure email credentials and sandbox accounts for rapid development.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/10 glass-panel">
              <Code2 className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-200">Schema Validation</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Integrated JSON editor validation protects runtime from invalid configurations, keeping the application online and running.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} MetaForge. All rights reserved.</p>
      </footer>
    </div>
  );
}
