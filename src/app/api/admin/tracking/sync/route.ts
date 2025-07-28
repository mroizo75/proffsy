import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { syncAllOrdersWithPostNord, updateOrderFromPostNordTracking } from "@/lib/postnord-tracking"

// POST - Manuell sync av alle ordrer med PostNord
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { orderId, trackingNumber } = body

    // If specific order ID is provided, sync only that order
    if (orderId && trackingNumber) {
      console.log(`Syncing specific order: ${orderId} with tracking: ${trackingNumber}`)
      
      const result = await updateOrderFromPostNordTracking(orderId, trackingNumber)
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        statusChanged: result.statusChanged,
        ordersProcessed: 1
      })
    }

    // Otherwise sync all orders
    console.log('Starting sync of all orders with PostNord...')
    const result = await syncAllOrdersWithPostNord()

    return NextResponse.json({
      success: true,
      message: `Sync fullført. ${result.updated} ordrer oppdatert, ${result.errors} feil.`,
      ordersUpdated: result.updated,
      errors: result.errors,
      ordersProcessed: result.updated + result.errors
    })

  } catch (error) {
    console.error("Tracking sync error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Kunne ikke synkronisere med PostNord", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

// GET - Få status på tracking sync
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { prisma } = await import('@/lib/db')

    // Get statistics about orders with tracking
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

  } catch (error) {
    console.error("Get tracking sync status error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Kunne ikke hente sync status", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
} 