import { writeFile } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const products = await prisma.product.findMany({
      include: {
        images: true,
        categories: true
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Feil ved henting av produkter:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    console.log("Mottatt data:", body);

    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        sku: body.sku,
        stock: body.stock,
        weight: body.weight || undefined,
        images: {
          create: body.images.map((image: any) => ({
            url: image.url,
            alt: image.alt || ""
          }))
        },
        categories: {
          connect: body.categoryIds.map((id: string) => ({ id }))
        },
        variants: {
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
    console.error('[PRODUCTS_POST]', error)
    return new NextResponse(`Intern feil: ${error instanceof Error ? error.message : 'Ukjent feil'}`, { status: 500 })
  }
} 