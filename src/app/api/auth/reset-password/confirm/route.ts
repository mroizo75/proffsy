import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { message: "Ugyldig eller utløpt token" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    })

    await prisma.passwordResetToken.delete({
      where: { token },
    })

    return NextResponse.json(
      { message: "Passordet er oppdatert" },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: "Noe gikk galt. Prøv igjen senere." },
      { status: 500 }
    )
  }
} 