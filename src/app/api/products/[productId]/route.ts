import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sanitizeProduct } from "@/lib/utils"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { 
      name, 
      description, 
      price, 
      weight, 
      length, 
      width, 
      height,
      variants 
    } = body

    // Hent eksisterende varianter for å finne hvilke som skal slettes
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    })

    if (!existingProduct) {
      return new NextResponse("Produkt ikke funnet", { status: 404 })
    }

    // Finn variant-IDer som skal slettes
    const existingVariantIds = existingProduct.variants.map(v => v.id)
    const updatedVariantIds = variants.filter((v: any) => v.id).map((v: any) => v.id)
    const variantsToDelete = existingVariantIds.filter(id => !updatedVariantIds.includes(id))

    // Oppdater produktet og dets varianter
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price,
        weight,
        length,
        width,
        height,
        variants: {
          // Slett fjernede varianter
          deleteMany: variantsToDelete.map(id => ({ id })),
          
          // Oppdater eksisterende varianter
          upsert: variants.map((variant: any) => ({
            where: {
              id: variant.id || 'new',
            },
            create: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              colorId: variant.colorId,
              image: variant.image,
            },
            update: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              colorId: variant.colorId,
              image: variant.image,
            },
          })),
        },
      },
      include: {
        variants: {
          include: {
            color: true
          }
        }
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}

// Hent enkelt produkt
export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    // Valider produkt-ID
    if (!/^c[a-z0-9]{24}$/.test(productId)) {
      return new NextResponse("Ugyldig produkt-ID", { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
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

    if (!product) {
      return new NextResponse("Produkt ikke funnet", { status: 404 })
    }

    return NextResponse.json(sanitizeProduct(product))
  } catch (error) {
    return new NextResponse("Intern serverfeil", { status: 500 })
  }
}

// Slett produkt
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { productId } = await params

    const product = await prisma.product.delete({
      where: {
        id: productId,
      }
    })

    return NextResponse.json(sanitizeProduct(product))
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
} 