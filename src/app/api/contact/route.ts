import { NextResponse } from "next/server"
import { z } from "zod"
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Verifiser reCAPTCHA
async function verifyRecaptcha(token: string) {
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  })
  
  const data = await response.json()
  return data.success
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Verifiser reCAPTCHA
    const isValidRecaptcha = await verifyRecaptcha(body.recaptchaToken)
    if (!isValidRecaptcha) {
      return new NextResponse("Invalid reCAPTCHA", { status: 400 })
    }

    // Send e-post via Resend
    await resend.emails.send({
      from: 'noreply@proffsy.no',
      to: 'ordre@amento.no',
      subject: `Kontaktskjema: ${body.subject}`,
      html: `
        <h2>Ny henvendelse fra kontaktskjema</h2>
        <p><strong>Navn:</strong> ${body.name}</p>
        <p><strong>E-post:</strong> ${body.email}</p>
        <p><strong>Telefon:</strong> ${body.phone || 'Ikke oppgitt'}</p>
        <p><strong>Emne:</strong> ${body.subject}</p>
        <p><strong>Melding:</strong></p>
        <p>${body.message}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CONTACT_ERROR]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 