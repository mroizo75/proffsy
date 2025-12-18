import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { join } from "path"
import { writeFile } from "fs/promises"

const productSchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  description: z.string(),
  price: z.number().min(0),
  sku: z.string().min(1, "SKU er påkrevd"),
  stock: z.number().min(0),
  categories: z.array(z.string()),
  existingImages: z.array(z.string()).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await request.formData()
    
    if (!formData) {
      return new NextResponse(
        JSON.stringify({ message: "Ingen data mottatt" }), 
        { status: 400 }
      )
    }

    const categoryIds = formData.get("categories") 
      ? JSON.parse(formData.get("categories") as string) 
      : []

    // Update product with new data
    const product = await prisma.product.update({
      where: {
        id
      },
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string),
        sku: formData.get("sku") as string,
        stock: parseInt(formData.get("stock") as string),
        categories: {
          set: [], // First clear existing categories
          connect: categoryIds.map((catId: string) => ({ id: catId }))
        }
      },
      include: {
        categories: true,
        images: true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        message: "Kunne ikke oppdatere produkt",
        error: error instanceof Error ? error.message : "Ukjent feil"
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Sjekk om produktet eksisterer
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return new NextResponse(
        JSON.stringify({ message: "Produkt ikke funnet" }), 
        { status: 404 }
      )
    }

    // Slett produktet og alle relaterte data (bilder, kategorikoblinger)
    await prisma.product.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Feil ved sletting av produkt:", error)
    return new NextResponse(
      JSON.stringify({ 
        message: "Kunne ikke slette produkt",
        error: error instanceof Error ? error.message : "Ukjent feil"
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function PATCH(
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

    // Oppdater produkt
    const product = await prisma.product.update({
      where: {
        id
      },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        sku: body.sku,
        stock: body.stock,
        weight: body.weight || undefined,
        images: {
          deleteMany: {},
          create: body.images.map((image: any) => ({
            url: image.url,
            alt: image.alt || ""
          }))
        },
        categories: {
          set: [],
          connect: body.categoryIds.map((id: string) => ({ id }))
        },
        variants: {
          deleteMany: {},
          create: body.variants?.map((variant: any) => ({
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            color: variant.colorId ? {
              connect: { id: variant.colorId }
            } : undefined,
            image: variant.images && variant.images.length > 0 
              ? variant.images[0].url 
              : null
          })) || []
        }
      },
      include: {
        images: true,
        categories: true,
        variants: {
          include: {
            color: true
          }
        }
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCT_PATCH]', error)
    return new NextResponse(`Intern feil: ${error instanceof Error ? error.message : 'Ukjent feil'}`, { status: 500 })
  }
} 