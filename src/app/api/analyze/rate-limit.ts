import { headers } from 'next/headers';

// Simple in-memory store for rate limiting
// Note: This is per-instance storage. For production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

export async function checkRateLimit(): Promise<{ success: boolean }> {
  // Get client IP
  const headersList = await headers();
  
  // Try to get the real IP from various headers
  const ip = 
    headersList.get('x-real-ip') ?? 
    headersList.get('x-forwarded-for')?.split(',')[0] ??
    headersList.get('x-vercel-forwarded-for')?.split(',')[0] ??
    'unknown';
  
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE;

  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.timestamp < windowStart) {
      rateLimitStore.delete(key);
    }
  }

  // Get existing rate limit data
  const rateLimitInfo = rateLimitStore.get(ip);

  if (!rateLimitInfo) {
    // First request in the window
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return { success: true };
  }

  if (rateLimitInfo.timestamp < windowStart) {
    // New window
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return { success: true };
  }

  if (rateLimitInfo.count >= MAX_REQUESTS) {
    // Rate limit exceeded
    return { success: false };
  }

  // Increment counter
  rateLimitInfo.count += 1;
  return { success: true };
}
