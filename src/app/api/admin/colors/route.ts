import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const colors = await prisma.color.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json(colors)
  } catch (error) {
    console.error("Error fetching colors:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, value } = await req.json()
    const color = await prisma.color.create({
      data: { name, value }
    })

    return NextResponse.json(color)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
} 