import { NextResponse } from 'next/server';
import { verifyJwt, signJwt, JwtPayload } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    const decoded = verifyJwt(refreshToken);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const payload: JwtPayload = {
      id: decoded.id,
      roleId: decoded.roleId,
      storeId: decoded.storeId,
    };

    // Issue new tokens
    const newAccessToken = signJwt(payload, '7d');
    const newRefreshToken = signJwt(payload, '30d');

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
