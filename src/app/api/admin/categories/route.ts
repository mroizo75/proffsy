import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Valideringsskjema for kategori
const categorySchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  slug: z.string().min(1, "Slug er påkrevd"),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const categories = await prisma.category.findMany()
    return NextResponse.json(categories)
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name } = await req.json()
    
    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const category = await prisma.category.create({
      data: { 
        name,
        slug: name.toLowerCase().replace(/ /g, '-')
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 