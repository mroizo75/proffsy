import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface ImageInput {
  url: string
  alt?: string
}

interface VariantInput {
  name: string
  sku: string
  price: number
  stock: number
  colorId?: string
  images?: ImageInput[]
}

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
          set: [],
          connect: categoryIds.map((catId: string) => ({ id: catId }))
        }
      },
      include: {
        categories: true,
        images: true
      }
    })

    return NextResponse.json(product)
  } catch {
    return new NextResponse(
      JSON.stringify({ message: "Kunne ikke oppdatere produkt" }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
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

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return new NextResponse(
        JSON.stringify({ message: "Produkt ikke funnet" }), 
        { status: 404 }
      )
    }

    await prisma.product.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(
      JSON.stringify({ message: "Kunne ikke slette produkt" }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
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
          create: body.images.map((image: ImageInput) => ({
            url: image.url,
            alt: image.alt || ""
          }))
        },
        categories: {
          set: [],
          connect: body.categoryIds.map((catId: string) => ({ id: catId }))
        },
        variants: {
          deleteMany: {},
          create: body.variants?.map((variant: VariantInput) => ({
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
  } catch {
    return new NextResponse("Intern feil", { status: 500 })
  }
}
