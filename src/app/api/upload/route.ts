import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
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

    const form = await req.formData()
    const file = form.get("file") as File
    const type = form.get("type") as string || "products"

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return new NextResponse("File must be an image", { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileName = generateUniqueFilename(file.name.replace(/[^a-zA-Z0-9.-]/g, ''))
    const prefix = type === "variant" ? "variants/" : ""
    const fullFilename = `${prefix}${fileName}`

    let url: string

    if (isR2Configured()) {
      url = await uploadToR2(buffer, fullFilename, file.type)
    } else {
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
    }

    return NextResponse.json({ url })
  } catch {
    return new NextResponse("Internal error", { status: 500 })
  }
}
