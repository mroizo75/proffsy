import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir, access } from "fs/promises"
import { join } from "path"

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Sjekk autentisering
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Sjekk om hero eksisterer
    const existingHero = await prisma.hero.findUnique({
      where: { id: params.id }
    })

    if (!existingHero) {
      return new NextResponse("Hero not found", { status: 404 })
    }

    const formData = await req.formData()
    
    // Debug: Logg alle innkommende felter
    console.log('Received form data for update:', {
      fields: Array.from(formData.entries()).map(([key, value]) => ({
        key,
        type: value instanceof File ? 'File' : 'string',
        value: value instanceof File ? `File: ${value.name}` : value
      }))
    })

    const title = formData.get("title") as string
    const description = formData.get("description") as string || null
    const buttonText = formData.get("buttonText") as string || null
    const buttonLink = formData.get("buttonLink") as string || null
    const isVideo = formData.get("isVideo") === "true"
    
    // Oppdater data object med de feltene vi vet vil endres
    const updateData: any = {
      title,
      description,
      buttonText,
      buttonLink,
      isVideo
    }

    // Håndter filopplasting hvis inkludert
    const image = formData.get("image") as File
    const video = formData.get("video") as File

    // Hvis ny media er opplastet, prosesser den
    if (image || video) {
      const file = image || video
      const uploadDir = join(process.cwd(), "public", "uploads")
      
      // Sjekk/opprett uploads-mappe
      try {
        await access(uploadDir)
      } catch {
        await mkdir(uploadDir, { recursive: true })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      console.log('File handling for update:', {
        filename: file.name,
        size: buffer.length,
        uploadDir
      })

      const extension = file.name.substring(file.name.lastIndexOf("."))
      const filename = `hero-${Date.now()}${extension}`
      const filepath = join(uploadDir, filename)
      
      await writeFile(filepath, buffer)
      
      // Oppdater URL basert på mediatype
      if (image) {
        updateData.imageUrl = `/uploads/${filename}`
        if (isVideo) updateData.videoUrl = null
      } else {
        updateData.videoUrl = `/uploads/${filename}`
        if (!isVideo) updateData.imageUrl = null 
      }
    }

    // Hvis ingen ny media er lastet opp men vi bytter type, nullstill motsatt felt
    if (!image && !video) {
      if (isVideo && existingHero.imageUrl) {
        updateData.imageUrl = null
      } else if (!isVideo && existingHero.videoUrl) {
        updateData.videoUrl = null
      }
    }

    console.log('Updating hero with data:', updateData)

    const updatedHero = await prisma.hero.update({
      where: { id: params.id },
      data: updateData
    })

    console.log('Hero updated successfully:', updatedHero)
    
    return NextResponse.json(updatedHero)
  } catch (error) {
    console.error("Error updating hero:", error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.hero.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const hero = await prisma.hero.findUnique({
      where: { id: params.id }
    })

    if (!hero) {
      return new NextResponse("Not found", { status: 404 })
    }

    await prisma.hero.update({
      where: { id: params.id },
      data: { active: !hero.active }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 