import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToR2, isR2Configured, generateUniqueFilename } from "@/lib/r2"
import { writeFile, mkdir, access } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    const hero = await prisma.hero.findFirst({
      where: {
        active: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: new Date() } }
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          }
        ]
      }
    })

    return NextResponse.json(hero)
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente hero" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()

    const image = formData.get("image")
    const video = formData.get("video")
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const buttonText = formData.get("buttonText") as string
    const buttonLink = formData.get("buttonLink") as string
    const isVideo = formData.get("isVideo") === "true"
    const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : null
    const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : null

    const mediaFile = isVideo ? video : image

    if (!mediaFile || !title) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Håndter fil - støtter både Blob og File
    let buffer: Buffer
    let filename: string
    let contentType: string

    if (mediaFile instanceof Blob) {
      const arrayBuffer = await mediaFile.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      // Hent filnavn fra formdata eller generer et
      const originalName = (mediaFile as File).name || `upload-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`
      filename = `hero-${generateUniqueFilename(originalName)}`
      contentType = mediaFile.type || (isVideo ? 'video/mp4' : 'image/jpeg')
    } else {
      return new NextResponse("Invalid file format", { status: 400 })
    }

    let fileUrl: string

    if (isR2Configured()) {
      fileUrl = await uploadToR2(buffer, filename, contentType)
    } else {
      const uploadDir = join(process.cwd(), "public", "uploads")
      try {
        await access(uploadDir)
      } catch {
        await mkdir(uploadDir, { recursive: true })
      }

      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      fileUrl = `/uploads/${filename}`
    }

    const hero = await prisma.hero.create({
      data: {
        title,
        description,
        buttonText,
        buttonLink,
        imageUrl: isVideo ? null : fileUrl,
        videoUrl: isVideo ? fileUrl : null,
        isVideo,
        startDate,
        endDate,
        active: true
      }
    })

    return NextResponse.json(hero)
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
