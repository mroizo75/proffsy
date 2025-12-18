import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Sjekk om brukeren er admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Finn gjeldende hero
    const heroToToggle = await prisma.hero.findUnique({
      where: { id }
    })

    if (!heroToToggle) {
      return new NextResponse("Hero not found", { status: 404 })
    }

    // Hvis denne heroen skal aktiveres, deaktiver først alle andre
    if (!heroToToggle.active) {
      // Deaktiver alle heroes
      await prisma.hero.updateMany({
        where: { active: true },
        data: { active: false }
      })
    }

    // Oppdater status for denne heroen
    const updatedHero = await prisma.hero.update({
      where: { id },
      data: { 
        active: !heroToToggle.active 
      }
    })

    return NextResponse.json(updatedHero)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
} 