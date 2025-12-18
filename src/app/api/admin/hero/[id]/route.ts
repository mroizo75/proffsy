import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToR2, isR2Configured, generateUniqueFilename } from "@/lib/r2"
import { writeFile, mkdir, access } from "fs/promises"
import { join } from "path"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const existingHero = await prisma.hero.findUnique({
      where: { id }
    })

    if (!existingHero) {
      return new NextResponse("Hero not found", { status: 404 })
    }

    const formData = await req.formData()

    const title = formData.get("title") as string
    const description = formData.get("description") as string || null
    const buttonText = formData.get("buttonText") as string || null
    const buttonLink = formData.get("buttonLink") as string || null
    const isVideo = formData.get("isVideo") === "true"
    
    const updateData: Record<string, unknown> = {
      title,
      description,
      buttonText,
      buttonLink,
      isVideo
    }

    const image = formData.get("image") as File
    const video = formData.get("video") as File

    if (image || video) {
      const file = image || video
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const filename = `hero-${generateUniqueFilename(file.name)}`
      let fileUrl: string

      if (isR2Configured()) {
        fileUrl = await uploadToR2(buffer, filename, file.type)
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
      
      if (image) {
        updateData.imageUrl = fileUrl
        if (isVideo) updateData.videoUrl = null
      } else {
        updateData.videoUrl = fileUrl
        if (!isVideo) updateData.imageUrl = null 
      }
    }

    if (!image && !video) {
      if (isVideo && existingHero.imageUrl) {
        updateData.imageUrl = null
      } else if (!isVideo && existingHero.videoUrl) {
        updateData.videoUrl = null
      }
    }

    const updatedHero = await prisma.hero.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(updatedHero)
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.hero.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const hero = await prisma.hero.findUnique({
      where: { id }
    })

    if (!hero) {
      return new NextResponse("Not found", { status: 404 })
    }

    await prisma.hero.update({
      where: { id },
      data: { active: !hero.active }
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
