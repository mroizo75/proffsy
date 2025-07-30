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
  } catch (error) {
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
    console.log("Mottatt company settings data:", data)

    // Valider at vi har nødvendige felter
    if (!data.companyName || !data.street || !data.postalCode || !data.city) {
      console.error("Manglende påkrevde felter:", {
        companyName: !!data.companyName,
        street: !!data.street, 
        postalCode: !!data.postalCode,
        city: !!data.city
      })
      return NextResponse.json(
        { error: "Manglende påkrevde felter" },
        { status: 400 }
      )
    }

    const settings = await prisma.companySettings.upsert({
      where: { id: "default" }, // Bruker fast ID siden vi bare har én innstilling
      update: data,
      create: { id: "default", ...data }
    })

    console.log("CompanySettings lagret:", settings)
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Feil ved lagring av company settings:", error)
    return NextResponse.json(
      { 
        error: "Kunne ikke lagre innstillinger",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 