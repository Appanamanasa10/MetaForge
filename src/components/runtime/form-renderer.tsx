'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FieldDefinition } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';

interface FormRendererProps {
  fields: FieldDefinition[];
  defaultValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  isLoading?: boolean;
  submitLabel?: string;
  serverErrors?: Record<string, string[]>;
}

// Compile a dynamic Zod schema from JSON field definitions
function buildDynamicZodSchema(fields: FieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case 'number':
        schema = z.coerce.number({
          invalid_type_error: `${field.name} must be a number`,
        });
        break;
      case 'email':
        schema = z.string().email('Must be a valid email address');
        break;
      case 'checkbox':
        schema = z.boolean();
        break;
      case 'date':
        schema = z.string().min(1, 'Date is required').refine((val) => !isNaN(Date.parse(val)), {
          message: 'Must be a valid date',
        });
        break;
      case 'text':
      case 'textarea':
      case 'select':
        schema = z.string();
        break;
      default:
        // Unknown type: create an optional field to prevent forms from crashing
        schema = z.any().optional();
        break;
    }

    if (field.required) {
      if (field.type !== 'checkbox' && field.type !== 'number' && field.type !== 'date') {
        schema = (schema as z.ZodString).min(1, `${field.name} is required`);
      }
    } else {
      // Allow optional fields to be empty, null, or undefined
      schema = schema.optional().nullable().or(z.literal(''));
    }

    shape[field.name] = schema;
  });

  return z.object(shape);
}

export default function FormRenderer({
  fields = [],
  defaultValues = {},
  onSubmit,
  isLoading = false,
  submitLabel = 'Submit',
  serverErrors,
}: FormRendererProps) {
  // 1. Build Zod schema dynamically
  const formSchema = buildDynamicZodSchema(fields);

  // 2. Initialize React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: fields.reduce((acc, field) => {
      // Provide fallback defaults based on types
      const userVal = defaultValues[field.name];
      if (userVal !== undefined) {
        acc[field.name] = userVal;
      } else if (field.defaultValue !== undefined) {
        acc[field.name] = field.defaultValue;
      } else {
        acc[field.name] = field.type === 'checkbox' ? false : '';
      }
      return acc;
    }, {} as Record<string, any>),
  });

  // 3. Bind server-side errors if passed from API responses
  useEffect(() => {
    if (serverErrors) {
      Object.entries(serverErrors).forEach(([key, messages]) => {
        setError(key as any, {
          type: 'server',
          message: Array.isArray(messages) ? messages[0] : String(messages),
        });
      });
    }
  }, [serverErrors, setError]);

  const onFormSubmit = (data: Record<string, any>) => {
    // Sanitize empty strings to undefined for optional fields
    const sanitized: Record<string, any> = {};
    fields.forEach((f) => {
      const val = data[f.name];
      if (val === '' && !f.required) {
        sanitized[f.name] = null;
      } else {
        sanitized[f.name] = val;
      }
    });
    onSubmit(sanitized);
  };

  const supportedTypes = ['text', 'textarea', 'email', 'number', 'select', 'checkbox', 'date'];

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {fields.length === 0 && (
        <div className="text-center py-6 text-slate-500">
          No fields defined in this schema. Add fields in the editor.
        </div>
      )}

      {fields.map((field) => {
        const errorMsg = errors[field.name]?.message as string | undefined;

        // Gracefully display Unsupported Component for unknown field types without crashing
        if (!supportedTypes.includes(field.type)) {
          return (
            <div key={field.name} className="flex flex-col space-y-1.5 p-4 rounded-lg border border-red-500/20 bg-red-950/10 text-red-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Field: {field.name}</span>
              <span className="text-sm font-medium">Unsupported Component: &ldquo;{field.type}&rdquo;</span>
            </div>
          );
        }

        return (
          <div key={field.name} className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor={field.name} className="text-sm font-medium text-slate-300">
                {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                {field.required && <span className="text-blue-500 ml-0.5">*</span>}
              </label>
              {errorMsg && (
                <span className="text-xs font-medium text-red-400 flex items-center space-x-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{errorMsg}</span>
                </span>
              )}
            </div>

            {/* Render field matching type */}
            {field.type === 'textarea' && (
              <textarea
                id={field.name}
                rows={3}
                placeholder={field.placeholder || `Enter ${field.name}...`}
                className={`w-full px-3.5 py-2 rounded-lg border bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errorMsg ? 'border-red-500/50' : 'border-slate-800 hover:border-slate-700'
                }`}
                {...register(field.name)}
              />
            )}

            {field.type === 'select' && (
              <select
                id={field.name}
                className={`w-full px-3.5 py-2 rounded-lg border bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errorMsg ? 'border-red-500/50' : 'border-slate-800 hover:border-slate-700'
                }`}
                {...register(field.name)}
              >
                <option value="">Select option...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center space-x-3 py-1.5">
                <input
                  type="checkbox"
                  id={field.name}
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950 accent-blue-600"
                  {...register(field.name)}
                />
                <span className="text-sm text-slate-400">
                  {field.placeholder || `Check if true`}
                </span>
              </div>
            )}

            {field.type !== 'textarea' && field.type !== 'select' && field.type !== 'checkbox' && (
              <input
                id={field.name}
                type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                step={field.type === 'number' ? 'any' : undefined}
                placeholder={field.placeholder || `Enter ${field.name}...`}
                className={`w-full px-3.5 py-2 rounded-lg border bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errorMsg ? 'border-red-500/50' : 'border-slate-800 hover:border-slate-700'
                }`}
                {...register(field.name)}
              />
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-white disabled:opacity-50 transition-all duration-150 cursor-pointer shadow-lg shadow-blue-500/20"
      >
        {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
        {submitLabel}
      </button>
    </form>
  );
}
