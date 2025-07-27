import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateOrderNumber } from "@/lib/utils"

const NETS_SECRET_KEY = process.env.NEXI_SECRET_TEST_KEY!
const NETS_CHECKOUT_KEY = process.env.NEXT_PUBLIC_NEXI_CHECKOUT_TEST_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const orderNumber = await generateOrderNumber()

    // Opprett ordre i databasen
    const order = await prisma.order.create({
      data: {
        orderId: orderNumber,
        userId: session.user.id,
        status: "PENDING",
        totalAmount: body.amount,
        shippingAmount: body.shipping.price,
        customerEmail: body.customerInfo.email,
        customerPhone: body.customerInfo.phone,
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
    })

    // Nets Easy betalingsforespørsel
    const response = await fetch("https://test.api.dibspayment.eu/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NETS_SECRET_KEY}`,
        "Commercial-Model": "NETS_EASY",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        checkout: {
          integrationType: "HostedPaymentPage",
          merchantHandlesConsumerData: true,
          termsUrl: `${BASE_URL}/terms`,
          charge: true,
          merchantHandlesShippingCost: true,
          returnUrl: `${BASE_URL}/checkout/complete?order=${orderNumber}`,
          cancelUrl: `${BASE_URL}/checkout/cancel`
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
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Nets API Error:", error)
      throw new Error(error.message || "Nets API Error")
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
    console.error("Payment error:", error)
    return NextResponse.json(
      { error: "Kunne ikke prosessere betaling" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const paymentId = searchParams.get('paymentId')

  if (!orderId || !paymentId) {
    return NextResponse.json(
      { error: "Mangler orderId eller paymentId" },
      { status: 400 }
    )
  }

  try {
    // Verifiser betaling med Nets
    const response = await fetch(`https://test.api.dibspayment.eu/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": NETS_SECRET_KEY
      }
    })

    if (!response.ok) {
      throw new Error("Kunne ikke verifisere betaling")
    }

    const data = await response.json()
    const isCompleted = data.payment.summary.status === "Completed"

    if (isCompleted) {
      // Oppdater ordre status
      await prisma.order.update({
        where: { orderId },
        data: {
          status: "COMPLETED",
          paymentStatus: "PAID",
          paymentMethod: data.payment.paymentDetails.paymentMethod
        }
      })

      // Send ordrebekreftelse på e-post
      // await sendOrderConfirmation(orderId)
    }

    return NextResponse.json({
      status: isCompleted ? "success" : "pending",
      orderId
    })

  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { error: "Kunne ikke verifisere betaling" },
      { status: 500 }
    )
  }
} 