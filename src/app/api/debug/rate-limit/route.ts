import { NextResponse } from "next/server"
import { client } from "@/lib/redis"

export async function GET(req: Request) {
  try {
    if (!client) {
      return NextResponse.json({ error: "Redis client ikke tilgjengelig" }, { status: 503 })
    }

    const url = new URL(req.url)
    const ip = url.searchParams.get("ip") || "127.0.0.1"
    const email = url.searchParams.get("email")

    const results = {
      ip: {
        key: `password_reset:${ip}`,
        value: await client.get(`password_reset:${ip}`),
      },
      email: email ? {
        key: `email_limit:${email}`,
        value: await client.get(`email_limit:${email}`),
      } : null,
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: "Feil ved henting av rate limit data" }, { status: 500 })
  }
} 