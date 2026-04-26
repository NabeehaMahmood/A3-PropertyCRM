import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from './jwt';

export function getCurrentUser(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}