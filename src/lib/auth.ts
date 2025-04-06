import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Extract token from cookie string
 */
export function extractTokenFromCookieString(cookieStr: string): string | null {
  if (!cookieStr) return null;
  
  const tokenMatch = cookieStr.match(/token=([^;]*)/);
  return tokenMatch ? tokenMatch[1] : null;
}

/**
 * Get JWT token from request
 */
export function getTokenFromRequest(req?: NextRequest): string | null {
  if (!req) return null;
  
  // First try to get from cookies object
  try {
    const token = req.cookies.get('token')?.value;
    if (token) return token;
  } catch (e) {
    console.error('Error getting token from cookies:', e);
  }
  
  // Fallback to cookie header parsing
  try {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      return extractTokenFromCookieString(cookieHeader);
    }
  } catch (e) {
    console.error('Error extracting token from cookie header:', e);
  }
  
  // If no token found
  return null;
}

// Verify JWT token
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Get token payload without verification (for debugging)
export function decodeToken(token: string) {
  try {
    return jwt.decode(token) as { id: string; email: string; role: string } | null;
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}

// Create secure cookie string for token
export function createSecureCookieString(token: string): string {
  const cookieValue = `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24}`;
  return IS_PRODUCTION ? `${cookieValue}; Secure` : cookieValue;
}

export interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

/**
 * Get the authenticated user from the request token
 */
export async function getAuthUser(req?: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify token
    const decoded = verify(token, JWT_SECRET) as DecodedToken;
    
    // Connect to database
    await dbConnect();
    
    // Find user by email
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return null;
    }
    
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Check if the user has admin privileges
 */
export function isAdmin(user: { role: string } | null) {
  return user?.role === 'admin';
}

/**
 * Check if the user has vendor privileges
 */
export function isVendor(user: { role: string } | null) {
  return user?.role === 'vendor';
}

/**
 * Handle unauthorized access in API routes
 */
export function unauthorized() {
  return NextResponse.json(
    { success: false, message: 'Unauthorized' },
    { status: 401 }
  );
}

/**
 * Create a protected API route handler
 */
export function createProtectedRoute(handler: Function) {
  return async (req: NextRequest) => {
    const user = await getAuthUser(req);
    
    if (!user) {
      return unauthorized();
    }
    
    return handler(req, user);
  };
} 