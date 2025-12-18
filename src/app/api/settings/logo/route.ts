import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const logo = formData.get('logo') as File
    
    if (!logo) {
      return new NextResponse("No file uploaded", { status: 400 })
    }

    const bytes = await logo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generer et unikt filnavn
    const filename = `logo-${Date.now()}${path.extname(logo.name)}`
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename)

    // Lagre filen
    await writeFile(filepath, buffer)

    // Returner URL til den lagrede filen
    const logoUrl = `/uploads/${filename}`

    return NextResponse.json({ logoUrl })
  } catch (error) {
    return new NextResponse("Error uploading logo", { status: 500 })
  }
} 