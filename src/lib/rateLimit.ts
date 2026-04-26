import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  agent: { requests: 50, windowMs: 60000 },
  manager: { requests: 100, windowMs: 60000 },
  admin: { requests: 500, windowMs: 60000 },
  default: { requests: 30, windowMs: 60000 },
};

export function checkRateLimit(request: NextRequest, role: string = 'agent'): { allowed: boolean; remaining: number; resetIn: number } {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
  
  const limits = RATE_LIMITS[role] || RATE_LIMITS.default;
  const key = `${ip}:${role}`;
  const now = Date.now();
  
  const entry = store[key];
  
  if (!entry || now > entry.resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + limits.windowMs,
    };
    return {
      allowed: true,
      remaining: limits.requests - 1,
      resetIn: limits.windowMs,
    };
  }
  
  if (entry.count >= limits.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }
  
  entry.count++;
  
  return {
    allowed: true,
    remaining: limits.requests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

export function rateLimitMiddleware(request: NextRequest, role: string) {
  const { allowed, remaining, resetIn } = checkRateLimit(request, role);
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', retryAfter: Math.ceil(resetIn / 1000) },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }
  
  return null;
}