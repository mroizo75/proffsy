import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToR2, deleteFromR2, isR2Configured, generateUniqueFilename } from "@/lib/r2"
import { writeFile, mkdir, access, unlink } from "fs/promises"
import { join } from "path"

// Hjelpefunksjon for å slette fil (R2 eller lokal)
async function deleteFile(url: string | null) {
  if (!url) return

  try {
    if (url.startsWith("/api/r2/")) {
      // R2 proxy URL - slett fra R2
      const key = url.replace("/api/r2/", "")
      await deleteFromR2(key)
    } else if (url.startsWith("/uploads/")) {
      // Lokal fil
      const filepath = join(process.cwd(), "public", url)
      await unlink(filepath)
    } else if (url.includes(".r2.dev/") || url.includes(".r2.cloudflarestorage.com/")) {
      // Direkte R2 URL - ekstraher key
      const urlObj = new URL(url)
      const key = urlObj.pathname.substring(1) // Fjern leading /
      await deleteFromR2(key)
    }
  } catch {
    // Ignorer feil ved sletting - filen kan allerede være slettet
  }
}

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

    const image = formData.get("image")
    const video = formData.get("video")

    if (image || video) {
      const file = image || video

      if (file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const originalName = (file as File).name || `upload-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`
        const filename = `hero-${generateUniqueFilename(originalName)}`
        const contentType = file.type || (isVideo ? 'video/mp4' : 'image/jpeg')

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
        
        // Slett gammelt bilde/video fra R2/disk
        if (image) {
          await deleteFile(existingHero.imageUrl)
          updateData.imageUrl = fileUrl
          if (isVideo) updateData.videoUrl = null
        } else {
          await deleteFile(existingHero.videoUrl)
          updateData.videoUrl = fileUrl
          if (!isVideo) updateData.imageUrl = null 
        }
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

    // Hent hero for å finne filer som skal slettes
    const hero = await prisma.hero.findUnique({
      where: { id }
    })

    if (!hero) {
      return new NextResponse("Hero not found", { status: 404 })
    }

    // Slett filer fra R2/disk
    await deleteFile(hero.imageUrl)
    await deleteFile(hero.videoUrl)

    // Slett hero fra database
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
