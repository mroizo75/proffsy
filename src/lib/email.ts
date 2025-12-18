import { Resend } from 'resend'
import OrderConfirmationEmail from '@/emails/order-confirmation'
import OrderShippedEmail from '@/emails/order-shipped'
import OrderDeliveredEmail from '@/emails/order-delivered'
import OrderDeliveryFailedEmail from '@/emails/order-delivery-failed'
import { ShippingStatus } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PROFFSY <ordre@proffsy.no>'
const ORDER_FORWARD_EMAIL = process.env.ORDER_FORWARD_EMAIL || 'ordre@amento.no'

export async function sendOrderConfirmation(order: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [order.customerEmail],
      bcc: [ORDER_FORWARD_EMAIL],
      subject: `Ordrebekreftelse - ${order.orderId}`,
      react: OrderConfirmationEmail({ order }),
    })

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }

  } catch (error) {
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
      return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [order.customerEmail],
      bcc: [ORDER_FORWARD_EMAIL],
      subject,
      react: EmailComponent({ order }),
    })

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }

  } catch (error) {
    throw error
  }
} 