// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (token bucket per IP)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_API = 60;           // max requests per window for /api/*
const RATE_LIMIT_PAGES = 200;        // max requests per window for pages

type Bucket = { tokens: number; lastRefill: number; blocked: number };
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

function getRemainingTokens(ip: string, limit: number): number {
    const key = `${ip}:${limit}`;
    const bucket = buckets.get(key);
    if (!bucket) return limit;
    const now = Date.now();
    if (now - bucket.lastRefill >= RATE_LIMIT_WINDOW_MS) return limit;
    return bucket.tokens;
}

function isRateLimited(ip: string, limit: number): boolean {
    cleanupBuckets();
    const now = Date.now();
    const key = `${ip}:${limit}`;
    let bucket = buckets.get(key);

    if (!bucket) {
        bucket = { tokens: limit - 1, lastRefill: now, blocked: 0 };
        buckets.set(key, bucket);
        return false;
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    if (elapsed >= RATE_LIMIT_WINDOW_MS) {
        bucket.tokens = limit - 1;
        bucket.lastRefill = now;
        bucket.blocked = 0;
        return false;
    }

    if (bucket.tokens > 0) {
        bucket.tokens--;
        return false;
    }

    bucket.blocked++;
    return true; // no tokens left
}

function getBlockedCount(ip: string, limit: number): number {
    const key = `${ip}:${limit}`;
    return buckets.get(key)?.blocked ?? 0;
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------
function timestamp(): string {
    return new Date().toISOString();
}

/** Compact structured log line visible in `docker compose logs -f` */
function logRequest(
    level: 'INFO' | 'WARN' | 'BLOCK',
    method: string,
    path: string,
    status: number,
    ip: string,
    durationMs: number,
    extra?: string,
) {
    const parts = [
        `[${timestamp()}]`,
        `[${level.padEnd(5)}]`,
        `${method.padEnd(4)}`,
        `${status}`,
        `${path}`,
        `${durationMs}ms`,
        `ip=${ip}`,
    ];
    if (extra) parts.push(extra);
    console.log(parts.join(' '));
}

// ---------------------------------------------------------------------------
// Suspicious pattern detection
// ---------------------------------------------------------------------------
const SUSPICIOUS_PATTERNS = [
    /\.\.\/|\.\.\\/, // path traversal
    /\.(php|asp|aspx|jsp|cgi|env|git|sql|bak|old|orig|config|ini|log)$/i,
    /wp-(admin|login|content|includes)/i, // WordPress probes
    /(xmlrpc|eval-stdin|shell|cmd|exec|phpinfo|phpmyadmin)/i,
    /<script|javascript:|data:text\/html/i, // XSS attempts
    /\x00/, // null byte injection
];

function isSuspicious(path: string, userAgent: string, ip: string): string | null {
    for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(path)) return `suspicious_path:${pattern.source}`;
    }
    // Blank or missing user-agent is common for bots/scanners,
    // but exempt internal/localhost requests (server calling itself).
    const isInternal = ip === '::1' || ip === '127.0.0.1' || ip.endsWith('::ffff:127.0.0.1');
    if (!isInternal && (!userAgent || userAgent.length < 5)) return 'no_user_agent';
    return null;
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
    const start = Date.now();
    const { pathname } = request.nextUrl;
    const method = request.method;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? '';

    // --- Suspicious request detection ---
    const suspiciousReason = isSuspicious(pathname, userAgent, ip);
    if (suspiciousReason) {
        const duration = Date.now() - start;
        logRequest('WARN', method, pathname, 403, ip, duration,
            `reason=${suspiciousReason} ua="${userAgent.slice(0, 80)}"`);
        return new NextResponse('Forbidden', {
            status: 403,
            headers: SECURITY_HEADERS,
        });
    }

    // --- Rate limiting ---
    const isApi = pathname.startsWith('/api/');
    const limit = isApi ? RATE_LIMIT_API : RATE_LIMIT_PAGES;

    if (isRateLimited(ip, limit)) {
        const duration = Date.now() - start;
        const blockedCount = getBlockedCount(ip, limit);
        logRequest('BLOCK', method, pathname, 429, ip, duration,
            `rate_limited blocked_count=${blockedCount}`);
        return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
                'Retry-After': '60',
                ...SECURITY_HEADERS,
            },
        });
    }

    // --- Continue with security headers ---
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }

    // --- Log the request ---
    const duration = Date.now() - start;
    const remaining = getRemainingTokens(ip, limit);
    logRequest('INFO', method, pathname, 200, ip, duration,
        `tokens=${remaining}/${limit}`);

    return response;
}

export const config = {
    // Apply to all routes except static files and Next.js internals
    matcher: [
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
