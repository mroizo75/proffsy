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
    console.log('💳 Payment API - POST request received')
    console.log('💳 Environment check:', {
      hasNetsSecretKey: !!NETS_SECRET_KEY,
      hasNetsCheckoutKey: !!NETS_CHECKOUT_KEY,
      hasBaseUrl: !!BASE_URL,
      baseUrl: BASE_URL
    })
    
    // Tillat både innlogget bruker og gjestekjøp
    const session = await getServerSession(authOptions)
    console.log('💳 Session user:', session?.user?.id || 'guest')

    const body = await req.json()
    console.log('💳 Request body:', {
      amount: body.amount,
      shipping: body.shipping,
      itemsCount: body.items?.length,
      customerEmail: body.customerInfo?.email
    })
    
    const orderNumber = await generateOrderNumber()
    console.log('💳 Generated order number:', orderNumber)

    // Valider påkrevde data
    if (!body.amount || !body.shipping || !body.items || !body.customerInfo) {
      throw new Error('Manglende påkrevde data for betaling')
    }

    if (!body.customerInfo.email || !body.customerInfo.address) {
      throw new Error('Manglende kunde informasjon')
    }

    // Opprett ordre i databasen (med eller uten bruker)
    console.log('💳 Creating order data...')
    
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

    console.log('💳 Order data prepared:', {
      orderId: orderData.orderId,
      userId: orderData.userId,
      customerEmail: orderData.customerEmail,
      itemsCount: body.items.length
    })

    console.log('💳 Creating order in database...')
    
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
    
    console.log('💳 Final create data:', {
      orderId: createData.orderId,
      userId: createData.userId,
      hasUserConnect: !!(createData as any).user?.connect
    })
    
    const order = await prisma.order.create({
      data: createData
    })
    console.log('💳 Order created successfully with ID:', order.id)

    console.log('💳 Creating Nets payment for order:', orderNumber)
    console.log('💳 Payment amount (øre):', Math.round(body.amount * 100))

    const termsUrl = `${BASE_URL}/terms`
    const returnUrl = `${BASE_URL}/checkout/complete?order=${orderNumber}`
    const cancelUrl = `${BASE_URL}/checkout/cancel`
    
    console.log('💳 Generated URLs:', { termsUrl, returnUrl, cancelUrl })

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
    
    console.log('💳 Nets payload:', JSON.stringify(netsPayload, null, 2))

    // Nets Easy betalingsforespørsel
    console.log('💳 Making request to Nets API...')
    const response = await fetch("https://test.api.dibspayment.eu/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NETS_SECRET_KEY}`,
        "Accept": "application/json"
      },
      body: JSON.stringify(netsPayload)
    })
    
    console.log('💳 Nets API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Nets API Error:", response.status, response.statusText)
      console.error("Nets error response:", errorText)
      
      try {
        const error = JSON.parse(errorText)
        throw new Error(error.message || "Nets API Error")
      } catch {
        throw new Error(`Nets API Error: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()
    console.log('Nets payment created successfully:', data.paymentId)

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
    console.error("💳 Payment error occurred:")
    console.error("💳 Error type:", error?.constructor?.name)
    console.error("💳 Error message:", error instanceof Error ? error.message : String(error))
    console.error("💳 Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    
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
      { 
        error: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    )
  }
}

 