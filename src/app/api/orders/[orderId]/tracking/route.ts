import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateOrderShippingStatus } from "@/lib/notifications"
import { ShippingStatus } from "@prisma/client"

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

  } catch {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Ikke innlogget" },
        { status: 401 }
      )
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin-rettigheter påkrevd" },
        { status: 401 }
      )
    }

    const { orderId } = await params
    const body = await req.json()

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

    if (!status) {
      return NextResponse.json(
        { 
          error: "Status er påkrevd",
          validStatuses: Object.values(ShippingStatus)
        },
        { status: 400 }
      )
    }

    if (!Object.values(ShippingStatus).includes(status)) {
      return NextResponse.json(
        { 
          error: "Ugyldig shipping status",
          validStatuses: Object.values(ShippingStatus)
        },
        { status: 400 }
      )
    }

    const existingOrder = await prisma.order.findUnique({
      where: { orderId }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Ordre ikke funnet" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (trackingUrl) updateData.trackingUrl = trackingUrl
    if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery)
    if (actualDelivery) updateData.actualDelivery = new Date(actualDelivery)
    if (attemptedDelivery) updateData.attemptedDelivery = new Date(attemptedDelivery)
    if (reason) updateData.reason = reason
    if (nextAttempt) updateData.nextAttempt = new Date(nextAttempt)

    if (sendNotification) {
      await updateOrderShippingStatus(orderId, status, updateData)
    } else {
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

  } catch {
    return NextResponse.json(
      { error: "Kunne ikke oppdatere tracking status" },
      { status: 500 }
    )
  }
}

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

    if (!status || !Object.values(ShippingStatus).includes(status)) {
      return NextResponse.json(
        { error: "Gyldig shipping status er påkrevd" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { orderId }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Ordre ikke funnet" },
        { status: 404 }
      )
    }

    const emailsSent = order.emailsSent ? JSON.parse(order.emailsSent as string) : {}
    if (emailsSent[status] && !force) {
      return NextResponse.json(
        { error: `${status} varsel er allerede sendt. Bruk force=true for å sende på nytt.` },
        { status: 400 }
      )
    }

    const { sendTrackingNotification } = await import("@/lib/notifications")
    
    if (force) {
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

  } catch {
    return NextResponse.json(
      { error: "Kunne ikke sende varsel" },
      { status: 500 }
    )
  }
}
