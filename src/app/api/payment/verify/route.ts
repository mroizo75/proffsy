import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sanitizeOrder } from "@/lib/utils"

const NETS_SECRET_KEY = process.env.NEXI_SECRET_TEST_KEY!

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")
    const paymentId = searchParams.get("paymentId")

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { error: "Mangler orderId eller paymentId" },
        { status: 400 }
      )
    }

    // Hent ordre fra databasen
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        items: true,
        shippingAddress: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Ordre ikke funnet" },
        { status: 404 }
      )
    }

    // Verifiser betaling med Nets
    const response = await fetch(`https://test.api.dibspayment.eu/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${NETS_SECRET_KEY}`,
        "Accept": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error("Kunne ikke verifisere betaling")
    }

    const paymentData = await response.json()

    // Oppdater ordrestatus basert på betalingsstatus
    if (paymentData.payment.summary.chargedAmount === paymentData.payment.summary.orderAmount) {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          paymentStatus: "PAID",
          paymentCompletedAt: new Date()
        },
        include: {
          items: true,
          shippingAddress: true
        }
      })

      return NextResponse.json({ 
        order: sanitizeOrder(updatedOrder),
        paymentStatus: "success"
      })
    } else {
      // Hvis betalingen ikke er fullført, behold PENDING status
      return NextResponse.json({ 
        order: sanitizeOrder(order),
        paymentStatus: "pending"
      })
    }

  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { error: "Kunne ikke verifisere betaling" },
      { status: 500 }
    )
  }
} 