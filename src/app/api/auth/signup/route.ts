import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      const formattedErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!formattedErrors[path]) formattedErrors[path] = [];
        formattedErrors[path].push(err.message);
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Validation Failed',
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    const { email, name, password } = validationResult.data;
    const lowerEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: lowerEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Failed',
          errors: { email: ['Email address is already registered. Please log in.'] },
        },
        { status: 400 }
      );
    }

    // Hash password using bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user record
    const user = await db.user.create({
      data: {
        email: lowerEmail,
        name: name.trim(),
        passwordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('[SIGNUP_POST]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to complete registration' },
      { status: 500 }
    );
  }
}
