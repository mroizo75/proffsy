import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { subDays, format } from "date-fns"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const [
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders,
      topProducts
    ] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true
        }
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: true,
          items: true
        }
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: {
          price: 'desc'
        }
      })
    ])

    // Konverter BigInt til Number eller String
    const revenue = totalRevenue._sum.totalAmount 
      ? Number(totalRevenue._sum.totalAmount)
      : 0

    // Formater ordrer for JSON serialisering
    const formattedOrders = recentOrders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: JSON.parse(JSON.stringify(order.items)) // Parse JSON-feltet
    }))

    return NextResponse.json({
      totalProducts,
      totalUsers,
      totalOrders,
      revenue,
      recentOrders: formattedOrders,
      topProducts
    })
  } catch (error) {
    console.error("Feil ved henting av statistikk:", error)
    return new NextResponse(
      JSON.stringify({ 
        message: "Kunne ikke hente statistikk",
        error: error instanceof Error ? error.message : "Ukjent feil"
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
} 