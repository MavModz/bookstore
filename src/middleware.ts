import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that should be public (accessible without authentication)
const publicPaths = ['/signin', '/signup', '/reset-password', '/favicon.ico'];

// Define paths that should redirect to dashboard if user is already authenticated
const authPaths = ['/signin', '/signup', '/reset-password'];

// Define paths that should be excluded from middleware processing
const excludedPaths = [
  '/_next',
  '/api',
  '/images',
  '/icons',
  '/fonts'
];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for excluded paths
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  const hasValidToken = !!token;
  
  console.log(`Middleware: Path=${pathname}, HasToken=${hasValidToken}`);
  
  // Check if path is an authentication page (signin, signup, etc.)
  const isAuthPage = authPaths.some(path => pathname === path || pathname === `${path}/`);
  
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (hasValidToken && isAuthPage) {
    console.log("Middleware: Authenticated user accessing auth page, redirecting to dashboard");
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If path is public, allow access regardless of authentication
  if (publicPaths.some(path => pathname === path || pathname === `${path}/`)) {
    console.log("Middleware: Accessing public page, allowing access");
    return NextResponse.next();
  }
  
  // For protected routes, check if user is authenticated
  if (!hasValidToken) {
    console.log("Middleware: Unauthenticated user accessing protected route, redirecting to signin");
    // Redirect to signin page with return URL
    const redirectUrl = new URL('/signin', request.url);
    redirectUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // User is authenticated and accessing a protected route, allow access
  console.log("Middleware: Authenticated user accessing protected route, allowing access");
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication API routes)
     * 2. /_next/* (Next.js internals)
     * 3. /fonts/* (static font files)
     * 4. /icons/* (static icon files)
     * 5. /images/* (static image files)
     * 6. /favicon.ico, /site.webmanifest (browser requests)
     */
    '/((?!api/auth|_next/static|_next/image|fonts|icons|images|favicon.ico|site.webmanifest).*)',
  ],
} 