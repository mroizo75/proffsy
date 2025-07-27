import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Sikre at mappene eksisterer
async function ensureDirectoryExists(path: string) {
  try {
    await mkdir(path, { recursive: true })
  } catch (error) {
    // Ignorer feil hvis mappen allerede eksisterer
  }
}

export async function POST(req: Request) {
  try {
    // Sjekk admin tilgang
    const session = await getServerSession(authOptions)
    if (!session?.user?.role === "ADMIN") {
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

    // Bestem riktig mappe basert på type
    const baseDir = join(process.cwd(), 'public/uploads')
    const uploadDir = type === "variant" 
      ? join(baseDir, 'variants')
      : baseDir

    // Opprett mappene hvis de ikke eksisterer
    await ensureDirectoryExists(uploadDir)

    // Generer filnavn
    const timestamp = new Date().getTime()
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const path = join(uploadDir, fileName)
    
    // Lagre filen
    await writeFile(path, buffer)

    // Returner URL til bildet
    const url = type === "variant" 
      ? `/uploads/variants/${fileName}`
      : `/uploads/${fileName}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error('[UPLOAD_ERROR]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 