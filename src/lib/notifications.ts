import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db'
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

interface NotificationData {
  orderId: string
  customerEmail: string
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: Date
  actualDelivery?: Date
  attemptedDelivery?: Date
  reason?: string
  nextAttempt?: Date
  shippingMethod?: string
  shippingLocation?: any
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

// Email templates as HTML strings for now
function getShippedEmailTemplate(data: NotificationData): string {
  const formatDate = (date?: Date) => {
    if (!date) return 'Ukjent'
    return new Date(date).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pakken din er sendt!</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1e293b; font-size: 24px;">📦 Pakken din er sendt!</h1>
        <p style="color: #475569; font-size: 14px;">
          God nyhet! Din ordre <strong>#${data.orderId}</strong> er nå på vei til deg.
        </p>
      </div>
      
      <div style="background: #f1f5f9; border: 2px solid #3b82f6; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
        ${data.trackingNumber ? `
          <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; font-weight: 600;">Sporingsnummer:</p>
          <p style="color: #1e293b; font-size: 20px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 2px;">${data.trackingNumber}</p>
        ` : ''}
      </div>
      
      <div style="margin-bottom: 32px;">
        <h2 style="color: #334155; font-size: 18px; margin-bottom: 16px;">🚚 Sporingsinformasjon</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Fraktselskap:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: right;">${data.carrier || 'PostNord'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Forventet levering:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: right;">${formatDate(data.estimatedDelivery)}</td>
          </tr>
        </table>
      </div>
      
      ${data.shippingLocation?.name ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 32px;">
          <h3 style="color: #92400e; margin: 0 0 8px 0;">📍 Hentested</h3>
          <p style="color: #78350f; margin: 0; font-weight: bold;">${data.shippingLocation.name}</p>
          ${data.shippingLocation.address ? `
            <p style="color: #78350f; margin: 4px 0;">${data.shippingLocation.address.street}</p>
            <p style="color: #78350f; margin: 0;">${data.shippingLocation.address.postalCode} ${data.shippingLocation.address.city}</p>
          ` : ''}
          <p style="color: #78350f; margin: 8px 0 0 0; font-size: 12px;">💡 Husk å ta med gyldig ID når du henter pakken</p>
        </div>
      ` : `
        <div style="margin-bottom: 32px;">
          <h3 style="color: #334155; margin: 0 0 12px 0;">🏠 Leveringsadresse</h3>
          <p style="color: #475569; margin: 0;">${data.shippingAddress.street}<br>
          ${data.shippingAddress.postalCode} ${data.shippingAddress.city}<br>
          ${data.shippingAddress.country}</p>
        </div>
      `}
      
      <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; margin-bottom: 32px;">
        <p style="color: #475569; font-size: 14px; margin: 0 0 8px 0;">📧 Du vil få en ny epost når pakken er levert eller klar for henting.</p>
        <p style="color: #475569; font-size: 14px; margin: 0;">📞 Spørsmål om leveringen? Kontakt <a href="mailto:ordre@proffsy.no" style="color: #3b82f6;">ordre@proffsy.no</a></p>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Med vennlig hilsen,<br>
          <strong>PROFFSY Team</strong>
        </p>
      </div>
    </body>
    </html>
  `
}

function getDeliveredEmailTemplate(data: NotificationData): string {
  const formatDate = (date?: Date) => {
    if (!date) return 'i dag'
    return new Date(date).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const deliveryText = data.shippingLocation?.name ? 'klar for henting' : 'levert'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pakken er ${deliveryText}!</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
        <h1 style="color: #16a34a; font-size: 24px; margin: 0 0 16px 0;">
          ${data.shippingLocation?.name ? 'Pakken er klar for henting!' : 'Pakken er levert!'}
        </h1>
        <p style="color: #475569; font-size: 14px;">
          Din ordre <strong>#${data.orderId}</strong> er nå ${deliveryText}.
        </p>
      </div>
      
      <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <h2 style="color: #15803d; font-size: 18px; text-align: center; margin: 0 0 16px 0;">
          ${data.shippingLocation?.name ? '📦 Hentebekreftelse' : '📦 Leveringsbekreftelse'}
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #15803d; font-weight: 600; padding: 4px 0;">Ordre:</td>
            <td style="color: #166534; text-align: right; padding: 4px 0;">#${data.orderId}</td>
          </tr>
          ${data.trackingNumber ? `
          <tr>
            <td style="color: #15803d; font-weight: 600; padding: 4px 0;">Sporingsnummer:</td>
            <td style="color: #166534; text-align: right; padding: 4px 0;">${data.trackingNumber}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="color: #15803d; font-weight: 600; padding: 4px 0;">
              ${data.shippingLocation?.name ? 'Klar for henting:' : 'Levert:'}
            </td>
            <td style="color: #166534; text-align: right; padding: 4px 0;">${formatDate(data.actualDelivery)}</td>
          </tr>
          <tr>
            <td style="color: #15803d; font-weight: 600; padding: 4px 0;">Fraktselskap:</td>
            <td style="color: #166534; text-align: right; padding: 4px 0;">${data.carrier || 'PostNord'}</td>
          </tr>
        </table>
      </div>
      
      ${data.shippingLocation?.name ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 32px;">
          <p style="color: #92400e; font-weight: bold; margin: 0 0 12px 0;">📍 Henteinstruksjoner</p>
          <p style="color: #78350f; margin: 0 0 8px 0;">Pakken din ligger klar på <strong>${data.shippingLocation.name}</strong></p>
          <p style="color: #78350f; margin: 0 0 8px 0;">💡 Husk å ta med gyldig ID og sporingsnummer når du henter pakken</p>
          <p style="color: #78350f; margin: 0;">⏰ Pakken oppbevares i 10 dager før den sendes tilbake</p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">💬 Gi oss tilbakemelding</h2>
        <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0;">Vi håper du er fornøyd med din bestilling! Din mening betyr mye for oss.</p>
        <a href="https://proffsy.no/feedback" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">⭐ Vurder din opplevelse</a>
      </div>
      
      <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; margin-bottom: 32px; text-align: center;">
        <p style="color: #475569; font-size: 14px; margin: 0 0 8px 0;">🛍️ Tusen takk for at du handlet hos oss!</p>
        <p style="color: #475569; font-size: 14px; margin: 0;">📞 Problemer med leveringen? Kontakt <a href="mailto:ordre@proffsy.no" style="color: #3b82f6;">ordre@proffsy.no</a></p>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Med vennlig hilsen,<br>
          <strong>PROFFSY Team</strong>
        </p>
      </div>
    </body>
    </html>
  `
}

function getFailedDeliveryEmailTemplate(data: NotificationData): string {
  const formatDate = (date?: Date) => {
    if (!date) return 'Ukjent'
    return new Date(date).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (date?: Date) => {
    if (!date) return 'Ukjent'
    return new Date(date).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Leveringsforsøk mislyktes</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h1 style="color: #dc2626; font-size: 24px; margin: 0 0 16px 0;">Leveringsforsøk mislyktes</h1>
        <p style="color: #475569; font-size: 14px;">
          Vi prøvde å levere din ordre <strong>#${data.orderId}</strong>, men leveringen mislyktes.
        </p>
      </div>
      
      <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <h2 style="color: #dc2626; font-size: 18px; text-align: center; margin: 0 0 16px 0;">📦 Leveringsinformasjon</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #dc2626; font-weight: 600; padding: 4px 0;">Leveringsforsøk:</td>
            <td style="color: #7f1d1d; text-align: right; padding: 4px 0;">${formatDateTime(data.attemptedDelivery)}</td>
          </tr>
          <tr>
            <td style="color: #dc2626; font-weight: 600; padding: 4px 0;">Årsak:</td>
            <td style="color: #7f1d1d; text-align: right; padding: 4px 0;">${data.reason || 'Mottaker ikke tilstede'}</td>
          </tr>
          ${data.trackingNumber ? `
          <tr>
            <td style="color: #dc2626; font-weight: 600; padding: 4px 0;">Sporingsnummer:</td>
            <td style="color: #7f1d1d; text-align: right; padding: 4px 0;">${data.trackingNumber}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="color: #dc2626; font-weight: 600; padding: 4px 0;">Fraktselskap:</td>
            <td style="color: #7f1d1d; text-align: right; padding: 4px 0;">${data.carrier || 'PostNord'}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-bottom: 32px;">
        <h2 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">🔄 Neste steg</h2>
        ${data.nextAttempt ? `
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 16px;">
            <p style="color: #0c4a6e; font-weight: bold; margin: 0 0 8px 0;">📅 Nytt leveringsforsøk</p>
            <p style="color: #075985; margin: 0 0 8px 0;">Vi vil prøve å levere pakken igjen <strong>${formatDate(data.nextAttempt)}</strong></p>
            <p style="color: #075985; margin: 0;">💡 Sørg for at noen er tilstede på leveringsadressen</p>
          </div>
        ` : `
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px;">
            <p style="color: #92400e; font-weight: bold; margin: 0 0 8px 0;">📞 Ta kontakt med oss</p>
            <p style="color: #78350f; margin: 0;">For å avtale ny leveringstid eller endre leveringsadresse, vennligst kontakt oss.</p>
          </div>
        `}
      </div>
      
      <div style="margin-bottom: 32px;">
        <h2 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">📍 Leveringsadresse</h2>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin-bottom: 12px;">
          <p style="color: #334155; margin: 0;">${data.shippingAddress.street}<br>
          ${data.shippingAddress.postalCode} ${data.shippingAddress.city}<br>
          ${data.shippingAddress.country}</p>
        </div>
        <p style="color: #64748b; font-size: 12px; font-style: italic; margin: 0;">💡 Feil adresse? Kontakt oss så snart som mulig for å oppdatere leveringsadressen.</p>
      </div>
      
      <div style="background: #f1f5f9; border: 1px solid #3b82f6; border-radius: 6px; padding: 16px; margin-bottom: 32px; text-align: center;">
        <p style="color: #1e40af; font-weight: bold; margin: 0 0 12px 0;">📞 Trenger du hjelp?</p>
        <p style="color: #1e3a8a; margin: 0 0 8px 0;">
          Kontakt vår kundeservice på <a href="mailto:ordre@proffsy.no" style="color: #3b82f6;">ordre@proffsy.no</a> eller ring oss på <strong>+47 12345678</strong>
        </p>
        <p style="color: #1e3a8a; margin: 0;">Husk å oppgi ordrenummer: <strong>#${data.orderId}</strong></p>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Med vennlig hilsen,<br>
          <strong>PROFFSY Team</strong>
        </p>
      </div>
    </body>
    </html>
  `
}

export async function sendTrackingNotification(orderId: string, status: ShippingStatus, additionalData?: Partial<NotificationData>) {
  try {
    // Fetch order details
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        shippingAddress: true,
        items: true,
      }
    })

    if (!order || !order.shippingAddress) {
      throw new Error(`Order ${orderId} not found or missing shipping address`)
    }

    // Check if we've already sent this notification
    const emailsSent = order.emailsSent ? JSON.parse(order.emailsSent as string) : {}
    if (emailsSent[status]) {
      console.log(`${status} notification already sent for order ${orderId}`)
      return
    }

    // Prepare notification data
    const notificationData: NotificationData = {
      orderId: order.orderId,
      customerEmail: order.customerEmail,
      trackingNumber: order.trackingNumber || undefined,
      carrier: order.carrier || 'PostNord',
      estimatedDelivery: order.estimatedDelivery || undefined,
      actualDelivery: order.actualDelivery || undefined,
      shippingMethod: order.shippingMethod || undefined,
      shippingLocation: order.shippingLocation ? JSON.parse(order.shippingLocation as string) : undefined,
      shippingAddress: {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      },
      ...additionalData,
    }

    let emailHtml = ''
    let subject = ''

    switch (status) {
      case 'SHIPPED':
        emailHtml = getShippedEmailTemplate(notificationData)
        subject = `📦 Pakken din er sendt! - ${order.orderId}`
        break
        
      case 'DELIVERED':
        emailHtml = getDeliveredEmailTemplate(notificationData)
        subject = `🎉 Pakken er ${notificationData.shippingLocation?.name ? 'klar for henting' : 'levert'}! - ${order.orderId}`
        break
        
      case 'FAILED_DELIVERY':
        emailHtml = getFailedDeliveryEmailTemplate(notificationData)
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

    // Send email
    await transporter.sendMail(mailOptions)
    console.log(`${status} notification email sent to ${order.customerEmail} for order ${orderId}`)

    // Update order to track sent emails
    const updatedEmailsSent = { ...emailsSent, [status]: new Date().toISOString() }
    await prisma.order.update({
      where: { orderId },
      data: {
        emailsSent: JSON.stringify(updatedEmailsSent),
        lastNotification: new Date(),
      }
    })

  } catch (error) {
    console.error(`Failed to send ${status} notification for order ${orderId}:`, error)
    throw error
  }
}

export async function updateOrderShippingStatus(
  orderId: string, 
  status: ShippingStatus, 
  updateData?: {
    trackingNumber?: string
    trackingUrl?: string
    estimatedDelivery?: Date
    actualDelivery?: Date
    attemptedDelivery?: Date
    reason?: string
    nextAttempt?: Date
  }
) {
  try {
    // Update order in database
    await prisma.order.update({
      where: { orderId },
      data: {
        shippingStatus: status,
        ...updateData,
        updatedAt: new Date(),
      }
    })

    console.log(`Order ${orderId} shipping status updated to ${status}`)

    // Send notification email
    await sendTrackingNotification(orderId, status, updateData)

    return { success: true }
  } catch (error) {
    console.error(`Failed to update shipping status for order ${orderId}:`, error)
    throw error
  }
} 