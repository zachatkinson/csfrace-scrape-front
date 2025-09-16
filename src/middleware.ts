import { defineMiddleware } from 'astro:middleware';
import { SecurityMiddleware, RateLimiter } from './middleware/security.ts';

export const onRequest = defineMiddleware(async (context, next) => {
  // Apply rate limiting
  const clientIp = context.clientAddress || 'unknown';
  const userAgent = context.request.headers.get('user-agent') || 'unknown';
  const identifier = `${clientIp}-${userAgent}`;
  
  if (!RateLimiter.isAllowed(identifier)) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + 900000)
      }
    });
  }
  
  // Add rate limit headers
  const remaining = RateLimiter.getRemainingRequests(identifier);
  (context.locals as any).rateLimitRemaining = remaining;
  
  // Apply security middleware
  return await SecurityMiddleware.handle(context, next);
});

// Export types for use in other files
export type { IRateLimitConfig } from './middleware/security.ts';