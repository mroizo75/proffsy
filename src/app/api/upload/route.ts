import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToR2, isR2Configured, generateUniqueFilename } from "@/lib/r2"

// Sikre at mappene eksisterer
async function ensureDirectoryExists(path: string) {
  try {
    await mkdir(path, { recursive: true })
  } catch {
    // Ignorer feil hvis mappen allerede eksisterer
  }
}

export async function POST(req: Request) {
  try {
    // Sjekk admin tilgang
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const form = await req.formData()
    const file = form.get("file") as File
    const type = form.get("type") as string || "products"

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    // Valider filtype
    if (!file.type.startsWith("image/")) {
      return new NextResponse("File must be an image", { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generer unikt filnavn
    const fileName = generateUniqueFilename(file.name.replace(/[^a-zA-Z0-9.-]/g, ''))
    const prefix = type === "variant" ? "variants/" : ""
    const fullFilename = `${prefix}${fileName}`

    let url: string

    // Bruk R2 hvis konfigurert, ellers lokal lagring
    if (isR2Configured()) {
      console.log('Uploading to R2:', fullFilename)
      url = await uploadToR2(buffer, fullFilename, file.type)
      console.log('R2 upload complete:', url)
    } else {
      // Fallback til lokal lagring
      console.log('R2 not configured, using local storage')
      const baseDir = join(process.cwd(), 'public/uploads')
      const uploadDir = type === "variant" 
        ? join(baseDir, 'variants')
        : baseDir

      await ensureDirectoryExists(uploadDir)
      const path = join(uploadDir, fileName)
      await writeFile(path, buffer)

      url = type === "variant" 
        ? `/uploads/variants/${fileName}`
        : `/uploads/${fileName}`
      console.log('Local file saved:', url)
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('[UPLOAD_ERROR]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
