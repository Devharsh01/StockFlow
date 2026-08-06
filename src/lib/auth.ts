import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export type JwtPayload = {
  id: string;
  roleId: string;
  storeId: string;
};

export function signJwt(payload: JwtPayload, expiresIn: string = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}
