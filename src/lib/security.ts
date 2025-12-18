import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { Severity } from "@prisma/client"
import { client } from './redis'

interface SecurityEvent {
  eventType: string
  severity: Severity
  email?: string
  details?: any
  ip: string
  userAgent?: string
}

export async function logSecurityEvent({
  eventType,
  severity,
  email,
  details,
  ip,
  userAgent,
}: SecurityEvent) {
  try {
    // Logg hendelsen i databasen
    await prisma.securityLog.create({
      data: {
        eventType,
        severity,
        email,
        details,
        ip,
        userAgent,
      },
    })

    // For kritiske hendelser, lagre i Redis for rask tilgang
    if (client && (severity === "CRITICAL" || severity === "ALERT")) {
      const key = `security:${ip}:${eventType}`
      await client.setEx(key, 3600, JSON.stringify({ timestamp: Date.now(), ...details }))
    }

    // Send varsling for kritiske hendelser
    if (severity === "CRITICAL") {
      await sendSecurityAlert({ eventType, email, ip, details })
    }
  } catch (error) {
    console.error("Failed to log security event:", error)
  }
}

// Sjekk for mistenkelige mønstre
export async function checkSuspiciousActivity(ip: string, email?: string) {
  try {
    // Sjekk antall feilede innloggingsforsøk siste time
    const failedLogins = await prisma.securityLog.count({
      where: {
        ip,
        eventType: "LOGIN_FAILED",
        timestamp: {
          gte: new Date(Date.now() - 3600000), // Siste time
        },
      },
    })

    // Sjekk antall passord-reset forsøk
    const resetAttempts = await prisma.securityLog.count({
      where: {
        ip,
        eventType: "RESET_ATTEMPTED",
        timestamp: {
          gte: new Date(Date.now() - 3600000),
        },
      },
    })

    // Sjekk om IP-en er kjent for mistenkelig aktivitet
    const suspiciousIP = client ? await client.get(`suspicious:ip:${ip}`) : null

    return {
      isSuspicious: failedLogins > 5 || resetAttempts > 3 || !!suspiciousIP,
      failedLogins,
      resetAttempts,
      knownSuspicious: !!suspiciousIP,
    }
  } catch (error) {
    console.error("Failed to check suspicious activity:", error)
    return { isSuspicious: false }
  }
}

// Hjelpefunksjon for å sende varsler
async function sendSecurityAlert({ eventType, email, ip, details }: Partial<SecurityEvent>) {
  // Her kan du implementere din egen varslingslogikk (e-post, Slack, etc.)
  console.log(`SECURITY ALERT: ${eventType} from ${ip}${email ? ` for ${email}` : ''}`)
  // TODO: Implementer faktisk varsling
}

// Hjelpefunksjon for å hente request info
export async function getRequestInfo() {
  const headersList = await headers()
  return {
    ip: headersList.get("x-forwarded-for") ?? "127.0.0.1",
    userAgent: headersList.get("user-agent"),
  }
} 