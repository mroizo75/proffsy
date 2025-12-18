import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendOrderConfirmation } from "@/lib/email"

const NETS_SECRET_KEY = process.env.NEXI_SECRET_TEST_KEY!

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

    if (order.status !== 'COMPLETED') {
      const response = await fetch(`https://test.api.dibspayment.eu/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${NETS_SECRET_KEY}`,
          "Accept": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error("Kunne ikke verifisere betaling med Nets")
      }

      const paymentData = await response.json()

      const summary = paymentData.payment?.summary
      const state = paymentData.payment?.state
      
      const isCompleted = (summary?.chargedAmount > 0) || 
                         (summary?.reservedAmount > 0 && state === 'Authorized')

      if (isCompleted) {
        await prisma.order.update({
          where: { orderId },
          data: {
            status: "COMPLETED",
            paymentStatus: "PAID",
            paymentMethod: paymentData.payment?.paymentDetails?.paymentMethod || "UNKNOWN",
            shippingStatus: "PROCESSING"
          }
        })

        try {
          const orderForEmail = await prisma.order.findUnique({
            where: { orderId },
            include: {
              items: true,
              shippingAddress: true
            }
          })

          if (orderForEmail?.shippingAddress) {
            await sendOrderConfirmation({
              orderId: orderForEmail.orderId,
              customerEmail: orderForEmail.customerEmail,
              totalAmount: Number(orderForEmail.totalAmount),
              shippingAmount: Number(orderForEmail.shippingAmount),
              items: orderForEmail.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: Number(item.price)
              })),
              shippingAddress: {
                street: orderForEmail.shippingAddress.street,
                city: orderForEmail.shippingAddress.city,
                postalCode: orderForEmail.shippingAddress.postalCode,
                country: orderForEmail.shippingAddress.country
              }
            })
          }
        } catch {
          // Continue execution even if email fails
        }
      } else {
        if (state === 'Cancelled' || state === 'Failed') {
          await prisma.order.update({
            where: { orderId },
            data: {
              paymentStatus: "FAILED",
              status: "CANCELLED"
            }
          })
        }
      }
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { orderId },
      include: {
        items: true,
        shippingAddress: true
      }
    })

    return NextResponse.json({
      paymentStatus: updatedOrder?.status === "COMPLETED" ? "success" : "pending",
      order: {
        orderId: updatedOrder?.orderId,
        status: updatedOrder?.status,
        totalAmount: updatedOrder?.totalAmount,
        shippingAmount: updatedOrder?.shippingAmount,
        items: updatedOrder?.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price)
        })),
        shippingAddress: {
          street: updatedOrder?.shippingAddress?.street,
          city: updatedOrder?.shippingAddress?.city,
          postalCode: updatedOrder?.shippingAddress?.postalCode,
          country: updatedOrder?.shippingAddress?.country
        }
      }
    })

  } catch {
    return NextResponse.json(
      { error: "Kunne ikke verifisere betaling" },
      { status: 500 }
    )
  }
}
