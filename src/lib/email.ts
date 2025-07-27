import nodemailer from 'nodemailer'
import { render } from '@react-email/render'
import OrderConfirmationEmail from '@/emails/order-confirmation'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendOrderConfirmation(order: any) {
  const emailHtml = render(OrderConfirmationEmail({ order }))

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: order.customerEmail,
    subject: `Ordrebekreftelse - ${order.orderId}`,
    html: emailHtml,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    throw error
  }
} 