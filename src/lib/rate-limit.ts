import { RateLimiterRedis } from 'rate-limiter-flexible'
import { client } from './redis'

// 5 forsøk per 1 time per IP
export const passwordResetLimiter = new RateLimiterRedis({
  storeClient: client,
  keyPrefix: 'password_reset',
  points: 5, // Antall forsøk
  duration: 3600, // 1 time i sekunder
  blockDuration: 3600, // Blokkering i 1 time etter for mange forsøk
  inMemoryBlockOnConsumed: 5, // Blokker etter 5 forsøk
})

// 3 forsøk per 1 time per e-post
export const emailLimiter = new RateLimiterRedis({
  storeClient: client,
  keyPrefix: 'email_limit',
  points: 3,
  duration: 3600,
  blockDuration: 3600,
  inMemoryBlockOnConsumed: 3, // Blokker etter 3 forsøk
})

// Hjelpefunksjon for å sjekke gjenværende forsøk
export async function getRemainingAttempts(key: string, limiter: RateLimiterRedis) {
  try {
    const res = await limiter.get(key)
    return res ? Math.max(0, limiter.points - res.consumedPoints) : limiter.points
  } catch {
    return 0
  }
} 