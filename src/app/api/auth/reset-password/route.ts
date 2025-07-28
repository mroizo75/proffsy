import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/mail" // Vi må lage denne
import { getPasswordResetLimiter, getEmailLimiter, getRemainingAttempts } from "@/lib/rate-limit"
import { logSecurityEvent, checkSuspiciousActivity, getRequestInfo } from "@/lib/security"

export async function POST(req: Request) {
  try {
    const { ip, userAgent } = await getRequestInfo()
    const { email } = await req.json()

    // Sjekk for mistenkelig aktivitet
    const suspiciousCheck = await checkSuspiciousActivity(ip, email)
    if (suspiciousCheck.isSuspicious) {
      await logSecurityEvent({
        eventType: "SUSPICIOUS_RESET_ATTEMPT",
        severity: "ALERT",
        email,
        ip,
        userAgent: userAgent || undefined,
        details: suspiciousCheck,
      })
      
      return NextResponse.json(
        { message: "For mange forsøk. Vennligst prøv igjen senere." },
        { status: 429 }
      )
    }

    // Sjekk IP-basert rate limiting
    const passwordLimiter = await getPasswordResetLimiter()
    try {
      await passwordLimiter.consume(ip)
    } catch (error: any) {
      const remainingTime = error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000 / 60) : 60
      
      await logSecurityEvent({
        eventType: "RATE_LIMIT_EXCEEDED",
        severity: "WARNING",
        email,
        ip,
        userAgent: userAgent || undefined,
        details: { type: "IP_LIMIT", remainingTime },
      })

      return NextResponse.json(
        { 
          message: `For mange forsøk. Vennligst vent ${remainingTime} minutter før du prøver igjen.`,
          remainingTime,
        },
        { status: 429 }
      )
    }

    // Sjekk e-post-basert rate limiting
    const emailLimiterInstance = await getEmailLimiter()
    try {
      await emailLimiterInstance.consume(email)
    } catch (error: any) {
      const remainingTime = error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000 / 60) : 60
      
      return NextResponse.json(
        { 
          message: `For mange tilbakestillingsforespørsler for denne e-postadressen. Vennligst vent ${remainingTime} minutter.`,
          remainingTime,
        },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Vi returnerer samme melding uavhengig av om brukeren eksisterer
    // for å unngå e-post enumeration
    if (!user) {
      return NextResponse.json(
        { message: "Hvis e-postadressen eksisterer, vil du motta en e-post med instruksjoner" },
        { status: 200 }
      )
    }

    // Slett eventuelle eksisterende tokens for denne brukeren
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    })

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 3600000) // 1 time

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    })

    await sendPasswordResetEmail(email, token)

    return NextResponse.json(
      { message: "Hvis e-postadressen eksisterer, vil du motta en e-post med instruksjoner" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json(
      { message: "Noe gikk galt. Prøv igjen senere." },
      { status: 500 }
    )
  }
} 