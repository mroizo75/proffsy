import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET - Hent alle ordrer for innlogget bruker
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Ikke innlogget" },
        { status: 401 }
      )
    }

    console.log("Fetching orders for user:", session.user.email)

    // Hent ordrer for brukeren (eller alle hvis admin)
    const whereClause = session.user.role === "ADMIN" 
      ? {} // Admin kan se alle ordrer
      : { userId: session.user.id } // Vanlige brukere ser bare sine egne

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true
              }
            }
          }
        },
        shippingAddress: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${orders.length} orders for user`)

    // Format ordrer for frontend
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderId: order.orderId,
      total: Number(order.totalAmount), // Convert Decimal to number
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingStatus: order.shippingStatus,
      createdAt: order.createdAt.toISOString(),
      customerEmail: order.customerEmail,
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price) // Convert Decimal to number
      })),
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery?.toISOString(),
      actualDelivery: order.actualDelivery?.toISOString(),
      shippingAddress: order.shippingAddress ? {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country
      } : null,
      user: order.user ? {
        name: order.user.name,
        email: order.user.email
      } : null
    }))

    return NextResponse.json(formattedOrders)

  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { 
        error: "Kunne ikke hente ordrer",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}