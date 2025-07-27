import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"

const adminSchema = z.object({
  name: z.string().min(2, "Navn må være minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(8, "Passord må være minst 8 tegn"),
})

export async function POST(req: Request) {
  try {
    // Sjekk admin-nøkkel
    const adminKey = req.headers.get("x-admin-key")
    if (adminKey !== process.env.ADMIN_CREATE_KEY) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const validatedData = adminSchema.parse(body)

    // Sjekk om bruker allerede eksisterer
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ error: "Bruker eksisterer allerede" }),
        { status: 400 }
      )
    }

    // Hash passord og opprett admin
    const hashedPassword = await hash(validatedData.password, 12)
    const admin = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(admin)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: error.errors[0].message }),
        { status: 400 }
      )
    }
    console.error("Feil ved opprettelse av admin:", error)
    return new NextResponse(
      JSON.stringify({ error: "Intern serverfeil" }),
      { status: 500 }
    )
  }
} 