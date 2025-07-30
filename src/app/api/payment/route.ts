import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateOrderNumber } from "@/lib/utils"

const NETS_SECRET_KEY = process.env.NEXI_SECRET_TEST_KEY!
const NETS_CHECKOUT_KEY = process.env.NEXT_PUBLIC_NEXI_CHECKOUT_TEST_KEY!
// Fjern trailing slash fra BASE_URL for å unngå doble skråstreker
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, '')

export async function POST(req: Request) {
  try {
    // Tillat både innlogget bruker og gjestekjøp
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const orderNumber = await generateOrderNumber()

    // Valider påkrevde data
    if (!body.amount || !body.shipping || !body.items || !body.customerInfo) {
      throw new Error('Manglende påkrevde data for betaling')
    }

    if (!body.customerInfo.email || !body.customerInfo.address) {
      throw new Error('Manglende kunde informasjon')
    }

    // Opprett ordre i databasen (med eller uten bruker)
    const orderData = {
      orderId: orderNumber,
      userId: session?.user?.id || null, // Eksplisitt null for gjestekjøp
      status: "PENDING" as const,
      paymentStatus: "PENDING" as const,
      totalAmount: body.amount,
      shippingAmount: body.shipping.price,
      customerEmail: body.customerInfo.email,
      customerPhone: body.customerInfo.phone || "",
      shippingAddress: {
        create: {
          street: body.customerInfo.address.street,
          city: body.customerInfo.address.city,
          postalCode: body.customerInfo.address.postalCode,
          country: body.customerInfo.address.country
        }
      },
      items: {
        create: body.items.map((item: any) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        }))
      }
    }

    // Håndter Prisma user relation eksplisitt for gjestekjøp
    const createData = session?.user?.id 
      ? {
          ...orderData,
          userId: undefined, // Fjern userId når vi bruker user.connect
          user: {
            connect: { id: session.user.id }
          }
        }
      : {
          ...orderData,
          userId: null // Eksplisitt null for gjestekjøp
        }
    
    const order = await prisma.order.create({
      data: createData
    })

    const termsUrl = `${BASE_URL}/terms`
    const returnUrl = `${BASE_URL}/checkout/complete?order=${orderNumber}`
    const cancelUrl = `${BASE_URL}/checkout/cancel`

    const netsPayload = {
      checkout: {
        integrationType: "HostedPaymentPage",
        merchantHandlesConsumerData: true,
        termsUrl,
        charge: true,
        merchantHandlesShippingCost: true,
        returnUrl,
        cancelUrl
      },
      order: {
        currency: "NOK",
        reference: orderNumber,
        amount: Math.round(body.amount * 100), // Konverter til øre
        items: [
          ...body.items.map((item: any) => ({
            reference: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: "stk",
            unitPrice: Math.round(item.price * 100), // Konverter til øre
            grossTotalAmount: Math.round(item.price * item.quantity * 100)
          })),
          {
            reference: "shipping",
            name: body.shipping.name,
            quantity: 1,
            unit: "stk",
            unitPrice: Math.round(body.shipping.price * 100),
            grossTotalAmount: Math.round(body.shipping.price * 100)
          }
        ]
      }
    }

    // Nets Easy betalingsforespørsel
    const response = await fetch("https://test.api.dibspayment.eu/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NETS_SECRET_KEY}`,
        "Accept": "application/json"
      },
      body: JSON.stringify(netsPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Nets API Error:", response.status, response.statusText)
      
      try {
        const error = JSON.parse(errorText)
        throw new Error(error.message || "Nets API Error")
      } catch {
        throw new Error(`Nets API Error: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()

    // Oppdater ordre med Nets paymentId
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: data.paymentId }
    })

    return NextResponse.json({
      checkoutUrl: data.hostedPaymentPageUrl,
      orderId: orderNumber
    })

  } catch (error) {
    console.error("Payment error:", error instanceof Error ? error.message : String(error))
    
    // Gi mer spesifikk feilmelding basert på type feil
    let errorMessage = "Kunne ikke prosessere betaling"
    if (error instanceof Error) {
      if (error.message.includes('NETS_SECRET_KEY') || error.message.includes('Environment')) {
        errorMessage = "Betalingsystemet er ikke konfigurert korrekt"
      } else if (error.message.includes('Database') || error.message.includes('Prisma')) {
        errorMessage = "Database feil ved opprettelse av ordre"
      } else if (error.message.includes('Nets') || error.message.includes('API')) {
        errorMessage = "Feil i kommunikasjon med betalingsleverandør"
      } else if (error.message.includes('Manglende')) {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

 