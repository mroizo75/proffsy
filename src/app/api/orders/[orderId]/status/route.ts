import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sanitizeOrder } from "@/lib/utils"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { orderId } = await params
    const { status } = await req.json()

    // Valider status
    const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]
    if (!validStatuses.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 })
    }

    // Oppdater ordrestatus
    const updatedOrder = await prisma.order.update({
      where: { orderId },
      data: { status },
      include: {
        items: true,
        shippingAddress: true,
      }
    })

    // Send e-post til kunde om statusendring
    if (status === "COMPLETED") {
      // TODO: Send e-post om at ordren er sendt
    } else if (status === "CANCELLED") {
      // TODO: Send e-post om at ordren er kansellert
    }

    return NextResponse.json(sanitizeOrder(updatedOrder))
  } catch (error) {
    console.error('Error updating order status:', error)
    return new NextResponse("Error updating order status", { status: 500 })
  }
} 