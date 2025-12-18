import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const heroes = await prisma.hero.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(heroes)
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente heroes" },
      { status: 500 }
    )
  }
}
