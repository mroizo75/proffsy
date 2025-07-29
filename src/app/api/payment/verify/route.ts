import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendOrderConfirmation } from "@/lib/email"

const NETS_SECRET_KEY = process.env.NEXI_SECRET_TEST_KEY!

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const paymentId = searchParams.get('paymentId')

  console.log('Payment verification attempt:', { orderId, paymentId })

  if (!orderId || !paymentId) {
    return NextResponse.json(
      { error: "Mangler orderId eller paymentId" },
      { status: 400 }
    )
  }

  try {
    // Hent ordre fra database først
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        items: true,
        shippingAddress: true
      }
    })

    if (!order) {
      console.error('Order not found:', orderId)
      return NextResponse.json(
        { error: "Ordre ikke funnet" },
        { status: 404 }
      )
    }

    // Verifiser betaling med Nets (kun hvis ikke allerede bekreftet)
    if (order.status !== 'COMPLETED') {
      console.log('Verifying payment with Nets:', paymentId)
      
      const response = await fetch(`https://test.api.dibspayment.eu/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${NETS_SECRET_KEY}`,
          "Accept": "application/json"
        }
      })

      if (!response.ok) {
        console.error('Nets API error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Nets error response:', errorText)
        throw new Error("Kunne ikke verifisere betaling med Nets")
      }

      const paymentData = await response.json()
      console.log('Nets payment data:', paymentData)

      const isCompleted = paymentData.payment?.summary?.reservedAmount > 0 || 
                         paymentData.payment?.summary?.chargedAmount > 0

      if (isCompleted) {
        // Oppdater ordre status og sett shipping til PROCESSING (klar for sending)
        await prisma.order.update({
          where: { orderId },
          data: {
            status: "COMPLETED",
            paymentStatus: "PAID",
            paymentMethod: paymentData.payment?.paymentDetails?.paymentMethod || "UNKNOWN",
            shippingStatus: "PROCESSING" // Klar for å bli sendt av admin
          }
        })

        console.log('Order marked as completed and ready for shipping:', orderId)

        // Send ordrebekreftelse på e-post
        try {
          // Hent fullstendig ordre data for email
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
            console.log('Order confirmation email sent for:', orderId)
          }
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError)
          // Continue execution even if email fails
        }
      } else {
        console.log('Payment not completed yet:', paymentData.payment?.summary)
      }
    }

    // Hent oppdatert ordre
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
          price: Number(item.price) // Convert Decimal to number
        })),
        shippingAddress: {
          street: updatedOrder?.shippingAddress?.street,
          city: updatedOrder?.shippingAddress?.city,
          postalCode: updatedOrder?.shippingAddress?.postalCode,
          country: updatedOrder?.shippingAddress?.country
        }
      }
    })

  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { 
        error: "Kunne ikke verifisere betaling",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 