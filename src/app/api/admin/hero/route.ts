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
  } catch (error) {
    console.error("Error fetching hero:", error)
    return NextResponse.json(
      { error: "Kunne ikke hente hero", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Sjekk autentisering
    const session = await getServerSession(authOptions)
    console.log('Session:', session)

    if (!session?.user || session.user.role !== "ADMIN") {
      console.log('Unauthorized access attempt:', {
        hasSession: !!session,
        userRole: session?.user?.role
      })
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    
    // Debug: Logg alle innkommende felter
    console.log('Received form data:', {
      fields: Array.from(formData.entries()).map(([key, value]) => ({
        key,
        type: value instanceof File ? 'File' : 'string',
        value: value instanceof File ? `File: ${value.name}` : value
      }))
    })

    // Hent feltene fra formData
    const image = formData.get("image") as File
    const video = formData.get("video") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const buttonText = formData.get("buttonText") as string
    const buttonLink = formData.get("buttonLink") as string
    const isVideo = formData.get("isVideo") === "true"
    const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : null
    const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : null

    // Media-fil (enten bilde eller video)
    const mediaFile = isVideo ? video : image
    
    // Debug: Validering
    console.log('Validation check:', {
      hasFile: !!mediaFile,
      hasTitle: !!title,
      fileType: mediaFile?.type,
      fileSize: mediaFile?.size
    })

    if (!mediaFile || !title) {
      console.log('Missing required fields:', { file: !!mediaFile, title: !!title })
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Håndter filopplasting
    const bytes = await mediaFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Debug: Filhåndtering
    console.log('File handling:', {
      filename: mediaFile.name,
      size: buffer.length,
      useR2: isR2Configured()
    })

    const filename = `hero-${generateUniqueFilename(mediaFile.name)}`
    let fileUrl: string

    // Bruk R2 hvis konfigurert, ellers lokal lagring
    if (isR2Configured()) {
      console.log('Uploading to R2:', filename)
      fileUrl = await uploadToR2(buffer, filename, mediaFile.type)
      console.log('R2 upload complete:', fileUrl)
    } else {
      // Fallback til lokal lagring
      console.log('R2 not configured, using local storage')
      const uploadDir = join(process.cwd(), "public", "uploads")
      try {
        await access(uploadDir)
      } catch {
        await mkdir(uploadDir, { recursive: true })
      }

      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      fileUrl = `/uploads/${filename}`
      console.log('Local file saved:', fileUrl)
    }

    // Debug: Database operasjon
    const heroData = {
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
    
    console.log('Creating hero record:', heroData)

    const hero = await prisma.hero.create({
      data: heroData
    })

    console.log('Hero created successfully:', hero)

    return NextResponse.json(hero)
  } catch (error) {
    console.error("Error creating hero:", {
      error,
      message: error instanceof Error ? error.message : 'En ukjent feil oppstod',
      stack: error instanceof Error ? error.stack : 'Ingen stack trace tilgjengelig'
    })
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'En ukjent feil oppstod'}`, { status: 500 })
  }
} 