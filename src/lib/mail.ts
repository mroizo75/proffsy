import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, '')
  const resetUrl = `${baseUrl}/reset-password/${token}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Tilbakestill ditt passord",
    html: `
      <h1>Tilbakestill passord</h1>
      <p>Klikk på lenken nedenfor for å tilbakestille ditt passord:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Lenken er gyldig i 1 time.</p>
      <p>Hvis du ikke ba om å tilbakestille passordet ditt, kan du ignorere denne e-posten.</p>
    `,
  })
} 