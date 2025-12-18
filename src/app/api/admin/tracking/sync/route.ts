import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { syncAllOrdersWithPostNord, updateOrderFromPostNordTracking } from "@/lib/postnord-tracking"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { orderId, trackingNumber } = body

    if (orderId && trackingNumber) {
      const result = await updateOrderFromPostNordTracking(orderId, trackingNumber)
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        statusChanged: result.statusChanged,
        ordersProcessed: 1
      })
    }

    const result = await syncAllOrdersWithPostNord()

    return NextResponse.json({
      success: true,
      message: `Sync fullført. ${result.updated} ordrer oppdatert, ${result.errors} feil.`,
      ordersUpdated: result.updated,
      errors: result.errors,
      ordersProcessed: result.updated + result.errors
    })

  } catch {
    return NextResponse.json(
      { success: false, error: "Kunne ikke synkronisere med PostNord" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { prisma } = await import('@/lib/db')

    const stats = await prisma.order.groupBy({
      by: ['shippingStatus'],
      where: {
        trackingNumber: { not: null }
      },
      _count: {
        _all: true
      }
    })

    const totalWithTracking = await prisma.order.count({
      where: {
        trackingNumber: { not: null }
      }
    })

    const pendingSync = await prisma.order.count({
      where: {
        trackingNumber: { not: null },
        shippingStatus: { notIn: ['DELIVERED', 'RETURNED'] }
      }
    })

    const lastSyncInfo = await prisma.order.findFirst({
      where: {
        trackingNumber: { not: null },
        lastNotification: { not: null }
      },
      orderBy: {
        lastNotification: 'desc'
      },
      select: {
        orderId: true,
        lastNotification: true,
        shippingStatus: true
      }
    })

    return NextResponse.json({
      success: true,
      statistics: {
        totalWithTracking,
        pendingSync,
        statusBreakdown: stats.reduce((acc, stat) => {
          acc[stat.shippingStatus || 'UNKNOWN'] = stat._count._all
          return acc
        }, {} as Record<string, number>),
        lastSync: lastSyncInfo ? {
          orderId: lastSyncInfo.orderId,
          timestamp: lastSyncInfo.lastNotification,
          status: lastSyncInfo.shippingStatus
        } : null
      }
    })

  } catch {
    return NextResponse.json(
      { success: false, error: "Kunne ikke hente sync status" },
      { status: 500 }
    )
  }
}
