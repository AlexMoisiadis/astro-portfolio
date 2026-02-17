// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (token bucket per IP)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_API = 60;           // max requests per window for /api/*
const RATE_LIMIT_PAGES = 200;        // max requests per window for pages

type Bucket = { tokens: number; lastRefill: number };
const buckets = new Map<string, Bucket>();

// Periodically clean up stale buckets (every 5 minutes)
let lastCleanup = Date.now();
function cleanupBuckets() {
    const now = Date.now();
    if (now - lastCleanup < 300_000) return;
    lastCleanup = now;
    for (const [key, bucket] of buckets) {
        if (now - bucket.lastRefill > RATE_LIMIT_WINDOW_MS * 2) {
            buckets.delete(key);
        }
    }
}

function isRateLimited(ip: string, limit: number): boolean {
    cleanupBuckets();
    const now = Date.now();
    const key = `${ip}:${limit}`;
    let bucket = buckets.get(key);

    if (!bucket) {
        bucket = { tokens: limit - 1, lastRefill: now };
        buckets.set(key, bucket);
        return false;
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    if (elapsed >= RATE_LIMIT_WINDOW_MS) {
        bucket.tokens = limit - 1;
        bucket.lastRefill = now;
        return false;
    }

    if (bucket.tokens > 0) {
        bucket.tokens--;
        return false;
    }

    return true; // no tokens left
}

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
const SECURITY_HEADERS: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js needs inline scripts
        "style-src 'self' 'unsafe-inline'",                   // Tailwind injects inline styles
        "img-src 'self' data: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; '),
};

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? 'unknown';

    // Rate limiting
    const isApi = pathname.startsWith('/api/');
    const limit = isApi ? RATE_LIMIT_API : RATE_LIMIT_PAGES;

    if (isRateLimited(ip, limit)) {
        return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
                'Retry-After': '60',
                ...SECURITY_HEADERS,
            },
        });
    }

    // Continue with security headers
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }

    return response;
}

export const config = {
    // Apply to all routes except static files and Next.js internals
    matcher: [
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
