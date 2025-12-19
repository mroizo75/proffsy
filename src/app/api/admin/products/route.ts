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
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Debug: Sjekk content-type og body
    const contentType = req.headers.get("content-type")
    console.log("Content-Type:", contentType)
    
    // Sjekk om det er JSON eller FormData
    let body
    if (contentType?.includes("application/json")) {
      const text = await req.text()
      console.log("Raw body (first 500 chars):", text.substring(0, 500))
      try {
        body = JSON.parse(text)
      } catch (parseError) {
        return new NextResponse(
          JSON.stringify({ 
            error: "Invalid JSON", 
            details: parseError instanceof Error ? parseError.message : "Could not parse JSON",
            receivedContentType: contentType,
            bodyPreview: text.substring(0, 200)
          }), 
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }
    } else {
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid content type", 
          details: `Expected application/json, got: ${contentType}`
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }
    
    console.log("Parsed body keys:", Object.keys(body))

    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        sku: body.sku,
        stock: body.stock,
        weight: body.weight || undefined,
        images: {
          create: body.images.map((image: ImageInput) => ({
            url: image.url,
            alt: image.alt || ""
          }))
        },
        categories: {
          connect: body.categoryIds.map((id: string) => ({ id }))
        },
        variants: {
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
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        error: "Intern feil", 
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
