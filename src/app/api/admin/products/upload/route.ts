import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToR2, isR2Configured, generateUniqueFilename } from "@/lib/r2"

async function ensureDirectoryExists(path: string) {
  try {
    await mkdir(path, { recursive: true })
  } catch {
    // Ignorer feil hvis mappen allerede eksisterer
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("image") as File
    const type = formData.get("type") as string || "products"

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generer et unikt filnavn
    const filename = generateUniqueFilename(file.name.replace(/[^a-zA-Z0-9.-]/g, ''))
    
    // Bestem prefix basert på type
    const prefix = type === "variants" ? "variants/" : "products/"
    const fullFilename = `${prefix}${filename}`

    let url: string

    if (isR2Configured()) {
      // Last opp til R2
      url = await uploadToR2(buffer, fullFilename, file.type || "image/jpeg")
    } else {
      // Fallback til lokal lagring
      const basePath = join(process.cwd(), "public", "uploads")
      const uploadDir = type === "variants" 
        ? join(basePath, "variants") 
        : join(basePath, "products")
      
      await ensureDirectoryExists(basePath)
      await ensureDirectoryExists(uploadDir)
      
      await writeFile(join(uploadDir, filename), buffer)
      
      url = type === "variants"
        ? `/uploads/variants/${filename}`
        : `/uploads/products/${filename}`
    }
    
    return NextResponse.json({ url })
  } catch {
    return new NextResponse("Error uploading file", { status: 500 })
  }
}
