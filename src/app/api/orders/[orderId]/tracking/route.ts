import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateOrderShippingStatus } from "@/lib/notifications"
import { ShippingStatus } from "@prisma/client"

// GET - Få tracking status for en ordre
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        shippingAddress: true,
      }
    })

    if (!order) {
      return new NextResponse("Order not found", { status: 404 })
    }

    // Regular users can only view their own orders
    if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    return NextResponse.json({
      orderId: order.orderId,
      shippingStatus: order.shippingStatus,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.actualDelivery,
      shippingMethod: order.shippingMethod,
      shippingLocation: order.shippingLocation ? JSON.parse(order.shippingLocation as string) : null,
      emailsSent: order.emailsSent ? JSON.parse(order.emailsSent as string) : {},
      lastNotification: order.lastNotification,
    })

  } catch (error) {
    console.error("GET tracking error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// PUT - Oppdater tracking status (kun admin)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    console.log("PUT tracking session:", session?.user ? { 
      id: session.user.id, 
      role: session.user.role,
      email: session.user.email 
    } : "No session")
    
    if (!session?.user) {
      console.error("No user session found")
      return NextResponse.json(
        { error: "Ikke innlogget" },
        { status: 401 }
      )
    }
    
    if (session.user.role !== "ADMIN") {
      console.error("User is not admin:", session.user.role)
      return NextResponse.json(
        { error: "Admin-rettigheter påkrevd" },
        { status: 401 }
      )
    }

    const { orderId } = await params
    const body = await req.json()

    console.log("PUT tracking request for orderId:", orderId)
    console.log("Request body:", body)
    console.log("Valid ShippingStatus values:", Object.values(ShippingStatus))

    const {
      status,
      trackingNumber,
      trackingUrl,
      estimatedDelivery,
      actualDelivery,
      attemptedDelivery,
      reason,
      nextAttempt,
      sendNotification = true
    } = body

    // Validate required fields
    if (!status) {
      console.error("Missing status field")
      return NextResponse.json(
        { 
          error: "Status er påkrevd",
          received: body,
          requiredFields: ["status"],
          validStatuses: Object.values(ShippingStatus)
        },
        { status: 400 }
      )
    }

    if (!Object.values(ShippingStatus).includes(status)) {
      console.error("Invalid status:", status)
      return NextResponse.json(
        { 
          error: "Ugyldig shipping status",
          received: status,
          validStatuses: Object.values(ShippingStatus)
        },
        { status: 400 }
      )
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { orderId }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Ordre ikke funnet" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (trackingUrl) updateData.trackingUrl = trackingUrl
    if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery)
    if (actualDelivery) updateData.actualDelivery = new Date(actualDelivery)
    if (attemptedDelivery) updateData.attemptedDelivery = new Date(attemptedDelivery)
    if (reason) updateData.reason = reason
    if (nextAttempt) updateData.nextAttempt = new Date(nextAttempt)

    if (sendNotification) {
      // Use notification service that automatically sends email
      await updateOrderShippingStatus(orderId, status, updateData)
    } else {
      // Just update database without sending notification
      await prisma.order.update({
        where: { orderId },
        data: {
          shippingStatus: status,
          ...updateData,
          updatedAt: new Date(),
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Tracking status oppdatert til ${status}${sendNotification ? ' og varsel sendt' : ''}`
    })

  } catch (error) {
    console.error("PUT tracking error:", error)
    return NextResponse.json(
      { error: "Kunne ikke oppdatere tracking status", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST - Send tracking notification manuelt (kun admin)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { orderId } = await params
    const body = await req.json()

    const { status, force = false } = body

    // Validate status
    if (!status || !Object.values(ShippingStatus).includes(status)) {
      return NextResponse.json(
        { error: "Gyldig shipping status er påkrevd" },
        { status: 400 }
      )
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { orderId }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Ordre ikke funnet" },
        { status: 404 }
      )
    }

    // Check if notification was already sent
    const emailsSent = order.emailsSent ? JSON.parse(order.emailsSent as string) : {}
    if (emailsSent[status] && !force) {
      return NextResponse.json(
        { error: `${status} varsel er allerede sendt. Bruk force=true for å sende på nytt.` },
        { status: 400 }
      )
    }

    // Send notification with force option
    const { sendTrackingNotification } = await import("@/lib/notifications")
    
    if (force) {
      // Reset email tracking for this status
      delete emailsSent[status]
      await prisma.order.update({
        where: { orderId },
        data: {
          emailsSent: JSON.stringify(emailsSent)
        }
      })
    }

    await sendTrackingNotification(orderId, status)

    return NextResponse.json({
      success: true,
      message: `${status} varsel sendt til kunde`
    })

  } catch (error) {
    console.error("POST tracking notification error:", error)
    return NextResponse.json(
      { error: "Kunne ikke sende varsel", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 