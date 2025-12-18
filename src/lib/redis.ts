import { createClient } from 'redis'

let client: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  // Returner null hvis Redis ikke er konfigurert
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
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

      client.on('error', () => {})
      await client.connect()
    } catch (error) {
      client = null
      return null
    }
  }

  return client
}

// Fallback export for backwards compatibility
export { client } 