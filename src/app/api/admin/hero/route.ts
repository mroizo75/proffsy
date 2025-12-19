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
    console.log("=== HERO POST START ===")
    
    const session = await getServerSession(authOptions)
    console.log("Session:", session?.user?.email, "Role:", session?.user?.role)

    if (!session?.user || session.user.role !== "ADMIN") {
      console.log("Unauthorized - no session or not admin")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    console.log("FormData keys:", Array.from(formData.keys()))

    const image = formData.get("image")
    const video = formData.get("video")
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const buttonText = formData.get("buttonText") as string
    const buttonLink = formData.get("buttonLink") as string
    const isVideo = formData.get("isVideo") === "true"
    const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : null
    const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : null

    console.log("Parsed data:", { title, isVideo, hasImage: !!image, hasVideo: !!video })

    const mediaFile = isVideo ? video : image

    if (!mediaFile || !title) {
      console.log("Missing required fields - mediaFile:", !!mediaFile, "title:", !!title)
      return new NextResponse("Missing required fields", { status: 400 })
    }

    console.log("MediaFile type:", typeof mediaFile, "instanceof Blob:", mediaFile instanceof Blob)

    // Håndter fil - støtter både Blob og File
    let buffer: Buffer
    let filename: string
    let contentType: string

    if (mediaFile instanceof Blob) {
      console.log("Processing Blob, size:", mediaFile.size, "type:", mediaFile.type)
      const arrayBuffer = await mediaFile.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      // Hent filnavn fra formdata eller generer et
      const originalName = (mediaFile as File).name || `upload-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`
      filename = `hero-${generateUniqueFilename(originalName)}`
      contentType = mediaFile.type || (isVideo ? 'video/mp4' : 'image/jpeg')
      console.log("Buffer created, length:", buffer.length, "filename:", filename)
    } else {
      console.log("Invalid file format - not a Blob")
      return new NextResponse("Invalid file format", { status: 400 })
    }

    let fileUrl: string

    console.log("R2 configured:", isR2Configured())
    console.log("ENV check - STORAGE_TYPE:", process.env.STORAGE_TYPE)
    console.log("ENV check - R2_ENDPOINT:", process.env.R2_ENDPOINT ? "SET" : "NOT SET")
    console.log("ENV check - R2_ACCESS_KEY_ID:", process.env.R2_ACCESS_KEY_ID ? "SET" : "NOT SET")
    console.log("ENV check - R2_SECRET_ACCESS_KEY:", process.env.R2_SECRET_ACCESS_KEY ? "SET" : "NOT SET")
    console.log("ENV check - R2_BUCKET:", process.env.R2_BUCKET)

    if (isR2Configured()) {
      console.log("Uploading to R2...")
      try {
        fileUrl = await uploadToR2(buffer, filename, contentType)
        console.log("R2 upload success, URL:", fileUrl)
      } catch (r2Error) {
        console.error("R2 upload failed:", r2Error)
        throw r2Error
      }
    } else {
      console.log("Using local storage...")
      const uploadDir = join(process.cwd(), "public", "uploads")
      try {
        await access(uploadDir)
        console.log("Upload dir exists:", uploadDir)
      } catch {
        console.log("Creating upload dir:", uploadDir)
        await mkdir(uploadDir, { recursive: true })
      }

      const filepath = join(uploadDir, filename)
      console.log("Writing file to:", filepath)
      await writeFile(filepath, buffer)
      fileUrl = `/uploads/${filename}`
      console.log("Local file saved, URL:", fileUrl)
    }

    console.log("Creating hero in database...")
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

    console.log("Hero created successfully, ID:", hero.id)
    console.log("=== HERO POST END ===")

    return NextResponse.json(hero)
  } catch (error) {
    console.error("=== HERO POST ERROR ===")
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack")
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal Server Error", 
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : typeof error
      }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
