import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await prisma.companySettings.findFirst({
      where: { id: "default" }
    })

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente innstillinger" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    if (!data.companyName || !data.street || !data.postalCode || !data.city) {
      return NextResponse.json(
        { error: "Manglende påkrevde felter" },
        { status: 400 }
      )
    }

    const settings = await prisma.companySettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data }
    })

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke lagre innstillinger" },
      { status: 500 }
    )
  }
}
