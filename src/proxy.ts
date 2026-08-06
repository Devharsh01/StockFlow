import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth';

// Only protect API routes for now, exclude auth routes
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') && pathname !== '/api/auth/login' && pathname !== '/api/auth/refresh') {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwt(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Pass the payload down (Next.js middleware doesn't allow mutating request object easily for API routes,
    // usually we just set headers)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.id);
    requestHeaders.set('x-role-id', decoded.roleId);
    requestHeaders.set('x-store-id', decoded.storeId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
