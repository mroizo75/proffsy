import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteFromR2, isR2Configured } from "@/lib/r2"
import { unlink } from "fs/promises"
import { join } from "path"

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

// Hjelpefunksjon for å slette fil (R2 eller lokal)
async function deleteFile(url: string | null) {
  if (!url) return

  try {
    if (url.startsWith("/api/r2/")) {
      // R2 proxy URL - slett fra R2
      const key = url.replace("/api/r2/", "")
      await deleteFromR2(key)
    } else if (url.startsWith("/uploads/")) {
      // Lokal fil
      const filepath = join(process.cwd(), "public", url)
      await unlink(filepath)
    } else if (url.includes(".r2.dev/") || url.includes(".r2.cloudflarestorage.com/")) {
      // Direkte R2 URL - ekstraher key
      const urlObj = new URL(url)
      const key = urlObj.pathname.substring(1) // Fjern leading /
      await deleteFromR2(key)
    }
  } catch {
    // Ignorer feil ved sletting - filen kan allerede være slettet
  }
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

    // Hent produktet med bilder og varianter før sletting
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true
      }
    })

    if (!existingProduct) {
      return new NextResponse(
        JSON.stringify({ message: "Produkt ikke funnet" }), 
        { status: 404 }
      )
    }

    // Slett produktbilder fra R2/disk
    for (const image of existingProduct.images) {
      await deleteFile(image.url)
    }

    // Slett variant-bilder fra R2/disk
    for (const variant of existingProduct.variants) {
      if (variant.image) {
        await deleteFile(variant.image)
      }
    }

    // Slett produktet fra databasen (cascade sletter bilder og varianter)
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

    // Hent eksisterende produktbilder for å sammenligne
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true }
    })

    if (existingProduct) {
      // Finn bilder som skal slettes (ikke lenger i body.images)
      const newImageUrls = body.images?.map((img: ImageInput) => img.url) || []
      for (const oldImage of existingProduct.images) {
        if (!newImageUrls.includes(oldImage.url)) {
          await deleteFile(oldImage.url)
        }
      }

      // Finn variant-bilder som skal slettes
      const newVariantImages = body.variants?.map((v: VariantInput) => 
        v.images && v.images.length > 0 ? v.images[0].url : null
      ).filter(Boolean) || []
      for (const oldVariant of existingProduct.variants) {
        if (oldVariant.image && !newVariantImages.includes(oldVariant.image)) {
          await deleteFile(oldVariant.image)
        }
      }
    }

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
