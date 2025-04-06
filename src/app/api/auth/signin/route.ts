import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getCookieOptions() {
  // In production (Vercel), use more secure cookie settings
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/'
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Login successful' },
      { status: 200 }
    );

    // Set cookie with token
    response.cookies.set('token', token, getCookieOptions());

    return response;
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 