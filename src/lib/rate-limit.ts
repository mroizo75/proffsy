import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible'
import { getRedisClient } from './redis'

let passwordResetLimiter: RateLimiterRedis | RateLimiterMemory | null = null
let emailLimiter: RateLimiterRedis | RateLimiterMemory | null = null

async function initializeLimiters() {
  if (passwordResetLimiter && emailLimiter) return

  const redisClient = await getRedisClient()

  if (redisClient) {
    // Bruk Redis-basert rate limiting
    passwordResetLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'password_reset',
      points: 5,
      duration: 3600,
      blockDuration: 3600,
      inMemoryBlockOnConsumed: 5,
    })

    emailLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'email_limit',
      points: 3,
      duration: 3600,
      blockDuration: 3600,
      inMemoryBlockOnConsumed: 3,
    })
  } else {
    // Fallback til in-memory rate limiting
    
    passwordResetLimiter = new RateLimiterMemory({
      keyPrefix: 'password_reset',
      points: 5,
      duration: 3600,
      blockDuration: 3600,
    })

    emailLimiter = new RateLimiterMemory({
      keyPrefix: 'email_limit',
      points: 3,
      duration: 3600,
      blockDuration: 3600,
    })
  }
}

export async function getPasswordResetLimiter() {
  await initializeLimiters()
  return passwordResetLimiter!
}

export async function getEmailLimiter() {
  await initializeLimiters()
  return emailLimiter!
}

// Hjelpefunksjon for å sjekke gjenværende forsøk
export async function getRemainingAttempts(key: string, limiter: RateLimiterRedis | RateLimiterMemory) {
  try {
    const res = await limiter.get(key)
    return res ? Math.max(0, limiter.points - res.consumedPoints) : limiter.points
  } catch {
    return 0
  }
} 