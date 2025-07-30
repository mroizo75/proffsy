import { Resend } from 'resend'
import OrderConfirmationEmail from '@/emails/order-confirmation'
import OrderShippedEmail from '@/emails/order-shipped'
import OrderDeliveredEmail from '@/emails/order-delivered'
import OrderDeliveryFailedEmail from '@/emails/order-delivery-failed'
import { ShippingStatus } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmation(order: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'PROFFSY <onboarding@resend.dev>',
      to: [order.customerEmail],
      subject: `Ordrebekreftelse - ${order.orderId}`,
      react: OrderConfirmationEmail({ order }),
    })

    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log(`Order confirmation email sent to ${order.customerEmail}`, data)
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    throw error
  }
}

export async function sendShippingNotification(order: any, status: ShippingStatus) {
  let EmailComponent
  let subject = ''
  
  switch (status) {
    case 'SHIPPED':
      EmailComponent = OrderShippedEmail
      subject = `📦 Pakken din er sendt! - ${order.orderId}`
      break
      
    case 'DELIVERED':
      EmailComponent = OrderDeliveredEmail
      subject = `🎉 Pakken er ${order.shippingLocation?.name ? 'klar for henting' : 'levert'}! - ${order.orderId}`
      break
      
    case 'FAILED_DELIVERY':
      EmailComponent = OrderDeliveryFailedEmail
      subject = `⚠️ Leveringsforsøk mislyktes - ${order.orderId}`
      break
      
    default:
      console.log(`No email template for shipping status: ${status}`)
      return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'PROFFSY <onboarding@resend.dev>',
      to: [order.customerEmail],
      subject,
      react: EmailComponent({ order }),
    })

    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log(`${status} notification email sent to ${order.customerEmail}`, data)
  } catch (error) {
    console.error(`Failed to send ${status} notification email:`, error)
    throw error
  }
} 