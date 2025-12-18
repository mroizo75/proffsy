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

    const image = formData.get("image") as File
    const video = formData.get("video") as File
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

    const bytes = await mediaFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `hero-${generateUniqueFilename(mediaFile.name)}`
    let fileUrl: string

    if (isR2Configured()) {
      fileUrl = await uploadToR2(buffer, filename, mediaFile.type)
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
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
