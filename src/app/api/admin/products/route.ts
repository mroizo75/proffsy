import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToR2, isR2Configured, generateUniqueFilename } from "@/lib/r2"
import { writeFile, mkdir } from "fs/promises"
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
  image?: string | null
}

async function ensureDirectoryExists(path: string) {
  try {
    await mkdir(path, { recursive: true })
  } catch {
    // Ignorer feil hvis mappen allerede eksisterer
  }
}

async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = generateUniqueFilename(file.name.replace(/[^a-zA-Z0-9.-]/g, ''))
  const fullFilename = `products/${filename}`

  if (isR2Configured()) {
    return await uploadToR2(buffer, fullFilename, file.type || "image/jpeg")
  } else {
    const uploadDir = join(process.cwd(), "public", "uploads", "products")
    await ensureDirectoryExists(uploadDir)
    await writeFile(join(uploadDir, filename), buffer)
    return `/uploads/products/${filename}`
  }
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

    const contentType = req.headers.get("content-type") || ""
    
    let name: string
    let description: string
    let price: number
    let sku: string
    let stock: number
    let categoryIds: string[] = []
    let images: ImageInput[] = []
    let variants: VariantInput[] = []
    let weight: number | undefined

    // Håndter både JSON og FormData
    if (contentType.includes("application/json")) {
      const body = await req.json()
      name = body.name
      description = body.description
      price = body.price
      sku = body.sku
      stock = body.stock
      categoryIds = body.categoryIds || []
      images = body.images || []
      variants = body.variants || []
      weight = body.weight
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      
      name = formData.get("name") as string
      description = formData.get("description") as string
      price = parseFloat(formData.get("price") as string) || 0
      sku = formData.get("sku") as string
      stock = parseInt(formData.get("stock") as string) || 0
      
      // Parse categories fra skjema
      const categoriesJson = formData.get("categories") as string
      if (categoriesJson) {
        try {
          categoryIds = JSON.parse(categoriesJson)
        } catch {
          categoryIds = []
        }
      }
      
      // Parse variants fra skjema
      const variantsJson = formData.get("variants") as string
      if (variantsJson) {
        try {
          variants = JSON.parse(variantsJson)
        } catch {
          variants = []
        }
      }
      
      // Håndter opplastede bilder (allerede lastet opp via /api/admin/products/upload)
      const uploadedImagesJson = formData.get("uploadedImages") as string
      if (uploadedImagesJson) {
        try {
          const uploadedUrls = JSON.parse(uploadedImagesJson) as string[]
          for (const url of uploadedUrls) {
            if (url) {
              images.push({ url })
            }
          }
        } catch {
          // Ignorer parse-feil
        }
      }
      
      // Håndter bildeopplasting direkte fra FormData (for bakoverkompatibilitet)
      const imageFiles = formData.getAll("images") as File[]
      for (const file of imageFiles) {
        if (file && file.size > 0) {
          const url = await uploadImage(file)
          images.push({ url })
        }
      }
      
      // Sjekk også for eksisterende bilder (URLs sendt som strings)
      const existingImages = formData.getAll("existingImages") as string[]
      for (const url of existingImages) {
        if (url) {
          images.push({ url })
        }
      }
    } else {
      return new NextResponse(
        JSON.stringify({ error: "Unsupported content type" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Validering
    if (!name || !description || !sku) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields: name, description, sku" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Filtrer bort tomme varianter (varianter er valgfrie)
    const validVariants = (variants || []).filter((variant: VariantInput) => 
      variant.name && variant.name.trim() !== "" && 
      variant.sku && variant.sku.trim() !== ""
    )

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        sku,
        stock,
        weight: weight || undefined,
        images: images.length > 0 ? {
          create: images.map((image: ImageInput) => ({
            url: image.url,
            alt: image.alt || ""
          }))
        } : undefined,
        categories: categoryIds.length > 0 ? {
          connect: categoryIds.map((id: string) => ({ id }))
        } : undefined,
        variants: validVariants.length > 0 ? {
          create: validVariants.map((variant: VariantInput) => ({
            name: variant.name,
            sku: variant.sku,
            price: variant.price || 0,
            stock: variant.stock || 0,
            color: variant.colorId ? {
              connect: { id: variant.colorId }
            } : undefined,
            image: variant.image || (variant.images && variant.images.length > 0 
              ? variant.images[0].url 
              : null)
          }))
        } : undefined
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
