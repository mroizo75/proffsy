import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Manglende påkrevde felt" },
        { status: 400 }
      )
    }

    // Sjekk om bruker allerede eksisterer
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "E-postadressen er allerede i bruk" },
        { status: 400 }
      )
    }

    // Hash passordet
    const hashedPassword = await bcrypt.hash(password, 12)

    // Opprett ny bruker
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    return NextResponse.json(
      { message: "Bruker opprettet", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: "Noe gikk galt under registrering" },
      { status: 500 }
    )
  }
} 