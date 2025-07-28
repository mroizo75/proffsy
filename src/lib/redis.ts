import { createClient } from 'redis'

let client: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  // Returner null hvis Redis ikke er konfigurert
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    console.warn('Redis not configured, skipping Redis features')
    return null
  }

  if (!client) {
    try {
      client = createClient({
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT)
        }
      })

      client.on('error', err => console.log('Redis Client Error', err))
      await client.connect()
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      client = null
      return null
    }
  }

  return client
}

// Fallback export for backwards compatibility
export { client } 