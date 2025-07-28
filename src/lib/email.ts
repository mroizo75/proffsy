import nodemailer from 'nodemailer'
import { render } from '@react-email/render'
import OrderConfirmationEmail from '@/emails/order-confirmation'
// import OrderShippedEmail from '@/emails/order-shipped'
// import OrderDeliveredEmail from '@/emails/order-delivered'
// import OrderDeliveryFailedEmail from '@/emails/order-delivery-failed'
import { ShippingStatus } from '@prisma/client'

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
  const emailHtml = await render(OrderConfirmationEmail({ order }))

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: order.customerEmail,
    subject: `Ordrebekreftelse - ${order.orderId}`,
    html: emailHtml,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Order confirmation email sent to ${order.customerEmail}`)
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    throw error
  }
}

export async function sendShippingNotification(order: any, status: ShippingStatus) {
  let emailHtml = ''
  let subject = ''
  
  switch (status) {
    case 'SHIPPED':
      emailHtml = await render(OrderShippedEmail({ order }))
      subject = `📦 Pakken din er sendt! - ${order.orderId}`
      break
      
    case 'DELIVERED':
      emailHtml = await render(OrderDeliveredEmail({ order }))
      subject = `🎉 Pakken er ${order.shippingLocation?.name ? 'klar for henting' : 'levert'}! - ${order.orderId}`
      break
      
    case 'FAILED_DELIVERY':
      emailHtml = await render(OrderDeliveryFailedEmail({ order }))
      subject = `⚠️ Leveringsforsøk mislyktes - ${order.orderId}`
      break
      
    default:
      console.log(`No email template for shipping status: ${status}`)
      return
  }

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: order.customerEmail,
    subject,
    html: emailHtml,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`${status} notification email sent to ${order.customerEmail}`)
  } catch (error) {
    console.error(`Failed to send ${status} notification email:`, error)
    throw error
  }
} 