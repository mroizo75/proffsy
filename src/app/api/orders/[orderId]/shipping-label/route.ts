import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import jsPDF from 'jspdf'
import fs from 'fs/promises'
import path from 'path'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        items: true,
        shippingAddress: true,
      }
    })

    if (!order) {
      return new NextResponse("Order not found", { status: 404 })
    }

    // Hent innstillinger fra databasen
    const settings = await prisma.settings.findMany()
    const settingsMap = settings.reduce((acc, setting) => ({
      ...acc,
      [setting.key]: setting.value
    }), {} as Record<string, string>)

    // Les logo fra innstillinger
    let logoBase64 = ''
    if (settingsMap.companyLogo) {
      const logoPath = path.join(process.cwd(), 'public', settingsMap.companyLogo)
      const logoBuffer = await fs.readFile(logoPath)
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
    }

    // Opprett PDF
    const doc = new jsPDF()
    
    // Legg til logo hvis den finnes
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 20, 10, 40, 40)
    }

    // Tittel (flyttet ned for å gi plass til logo)
    doc.setFontSize(20)
    doc.text('FRAKTBREV', 105, 35, { align: 'center' })
    
    // Ordreinfo
    doc.setFontSize(12)
    doc.text(`Ordre: ${order.orderId}`, 20, 60)
    doc.text(`Dato: ${new Date().toLocaleDateString('nb-NO')}`, 20, 70)

    // Mottakerinformasjon
    doc.text('Mottaker:', 20, 90)
    doc.text(order.customerEmail, 20, 100)
    doc.text(order.customerPhone || '', 20, 110)
    if (order.shippingAddress) {
      doc.text(order.shippingAddress.street, 20, 120)
      doc.text(`${order.shippingAddress.postalCode} ${order.shippingAddress.city}`, 20, 130)
      doc.text(order.shippingAddress.country, 20, 140)
    }

    // Produktliste
    doc.text('Produkter:', 20, 160)
    let yPos = 170
    order.items.forEach((item, index) => {
      // Sjekk om vi nærmer oss bunnen av siden
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.text(`${item.quantity}x ${item.name}`, 20, yPos)
      yPos += 10
    })

    // Avsenderinformasjon
    doc.text('Avsender:', 20, yPos + 20)
    doc.text(settingsMap.companyName || 'Proffsy AS', 20, yPos + 30)
    doc.text(settingsMap.companyAddress || '', 20, yPos + 40)
    doc.text(settingsMap.companyPostal || '', 20, yPos + 50)
    doc.text(settingsMap.companyCountry || '', 20, yPos + 60)

    // Generer PDF som arraybuffer
    const pdfBuffer = doc.output('arraybuffer')

    // Send PDF som respons
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fraktbrev-${order.orderId}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Error generating shipping label:', error)
    return new NextResponse("Error generating shipping label", { status: 500 })
  }
} 