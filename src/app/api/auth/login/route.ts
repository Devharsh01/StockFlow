import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.username, username),
      with: {
        role: true,
      },
    });

    if (!userRecord || !userRecord.active) {
      return NextResponse.json({ error: 'Invalid credentials or inactive user' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, userRecord.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const payload = {
      id: userRecord.id,
      roleId: userRecord.roleId,
      storeId: userRecord.storeId,
    };

    const accessToken = signJwt(payload, '7d'); // Long-lived as per PRD
    const refreshToken = signJwt(payload, '30d');

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        role: userRecord.role.name,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
