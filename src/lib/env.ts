import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required',
  }).min(1, 'DATABASE_URL cannot be empty'),
  
  NEXTAUTH_URL: z.string({
    required_error: 'NEXTAUTH_URL is required',
  }).url('NEXTAUTH_URL must be a valid URL'),
  
  NEXTAUTH_SECRET: z.string({
    required_error: 'NEXTAUTH_SECRET is required',
  }).min(16, 'NEXTAUTH_SECRET must be at least 16 characters for security'),
  
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// We only run validation on the server side
const isServer = typeof window === 'undefined';

let envData: z.infer<typeof envSchema> | null = null;

if (isServer) {
  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    const formatted = result.error.format();
    console.error('❌ Environment validation failed:');
    Object.entries(formatted).forEach(([key, val]) => {
      if (key !== '_errors') {
        const errors = (val as any)._errors;
        if (errors && errors.length > 0) {
          console.error(`   - ${key}: ${errors.join(', ')}`);
        }
      }
    });
    
    // We throw a descriptive error to stop runtime execution with invalid config
    throw new Error('Database and Authentication environment variables are misconfigured. Please check logs for details.');
  }

  envData = result.data;
}

export const env = envData!;
