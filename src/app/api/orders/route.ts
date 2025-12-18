import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Ikke innlogget" },
        { status: 401 }
      )
    }

    const whereClause = session.user.role === "ADMIN" 
      ? {}
      : { userId: session.user.id }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: {
                  select: {
                    url: true,
                    alt: true
                  },
                  take: 1
                }
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

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderId: order.orderId,
      total: Number(order.totalAmount),
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingStatus: order.shippingStatus,
      createdAt: order.createdAt.toISOString(),
      customerEmail: order.customerEmail,
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        imageUrl: item.product?.images?.[0]?.url || null
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

  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente ordrer" },
      { status: 500 }
    )
  }
}
