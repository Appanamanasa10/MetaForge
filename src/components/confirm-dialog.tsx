'use client';

import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-red-500/10 border border-red-500/20 text-red-400',
      button: 'bg-red-600 hover:bg-red-500 shadow-red-500/20',
    },
    warning: {
      icon: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20',
    },
    info: {
      icon: 'bg-blue-500/10 border border-blue-500/20 text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl glass-panel relative p-6 space-y-5">
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${styles.icon}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-100">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-400 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-800 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 cursor-pointer ${styles.button}`}
          >
            {isLoading && <Loader2 className="animate-spin mr-1.5 h-4 w-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
