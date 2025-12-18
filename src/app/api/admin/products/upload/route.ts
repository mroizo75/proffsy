import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function ensureDirectoryExists(path: string) {
  try {
    await mkdir(path, { recursive: true })
  } catch (error) {
    if ((error as any).code !== 'EEXIST') {
      throw error
    }
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
    const type = formData.get("type") as string

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generer et unikt filnavn
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    const filename = `${uniqueSuffix}-${file.name}`
    
    // Bestem mappe basert på type
    const uploadDir = type === "variants" ? "variants" : "products"
    const basePath = join(process.cwd(), "public", "uploads")
    const fullPath = join(basePath, uploadDir)
    
    // Opprett mapper hvis de ikke eksisterer
    await ensureDirectoryExists(basePath)
    await ensureDirectoryExists(fullPath)
    
    // Lagre filen
    await writeFile(join(fullPath, filename), buffer)
    
    // Returner URL til filen
    return NextResponse.json({ 
      url: `/uploads/${uploadDir}/${filename}` 
    })
  } catch (error) {
    return new NextResponse("Error uploading file", { status: 500 })
  }
} 