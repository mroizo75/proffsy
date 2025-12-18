import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  slug: z.string().min(1, "Slug er påkrevd"),
  description: z.string().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const validatedData = categorySchema.safeParse(body)

    if (!validatedData.success) {
      return new NextResponse(
        JSON.stringify({ 
          message: "Valideringsfeil", 
          errors: validatedData.error.errors 
        }), 
        { status: 400 }
      )
    }

    // Sjekk om slug allerede eksisterer (unntatt for denne kategorien)
    const existingCategory = await prisma.category.findFirst({
      where: {
        slug: validatedData.data.slug,
        NOT: {
          id
        }
      }
    })

    if (existingCategory) {
      return new NextResponse(
        JSON.stringify({ 
          message: `En annen kategori med slug "${validatedData.data.slug}" eksisterer allerede` 
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const category = await prisma.category.update({
      where: {
        id
      },
      data: {
        name: validatedData.data.name,
        slug: validatedData.data.slug,
        description: validatedData.data.description,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ message: "Kunne ikke oppdatere kategori" }), 
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.category.delete({
      where: {
        id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ message: "Kunne ikke slette kategori" }), 
      { status: 500 }
    )
  }
} 