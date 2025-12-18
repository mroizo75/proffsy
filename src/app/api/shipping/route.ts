import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculateShipping, checkServiceAvailability } from "@/lib/shipping"

interface ShippingItem {
  weight?: number
  quantity: number
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { items, toAddress } = body

    const totalWeight = items.reduce((sum: number, item: ShippingItem) => {
      return sum + (item.weight || 0.5) * item.quantity
    }, 0)

    const companySettings = await prisma.companySettings.findFirst({
      where: { id: "default" }
    })

    if (!companySettings) {
      return NextResponse.json(
        { error: "Bedriftsadresse ikke konfigurert" },
        { status: 400 }
      )
    }

    if (!toAddress?.postalCode) {
      return NextResponse.json(
        { error: "Gyldig postnummer er påkrevd" },
        { status: 400 }
      )
    }

    try {
      const shippingResult = await calculateShipping({
        weight: Math.max(totalWeight, 0.1),
        fromPostalCode: companySettings.postalCode,
        toPostalCode: toAddress.postalCode,
        toCountry: toAddress.country || "NO",
      })

      if (!shippingResult.success) {
        throw new Error(shippingResult.message || "Fraktberegning feilet")
      }

      const shippingRates = shippingResult.options || []

      if (session?.user) {
        try {
          await prisma.userAddress.upsert({
            where: {
              userId_street_postalCode: {
                userId: session.user.id,
                street: toAddress.street || "Ikke oppgitt",
                postalCode: toAddress.postalCode
              }
            },
            update: {
              city: toAddress.city,
              country: toAddress.country || "NO"
            },
            create: {
              userId: session.user.id,
              name: "Sist brukt",
              street: toAddress.street || "Ikke oppgitt",
              postalCode: toAddress.postalCode,
              city: toAddress.city || "",
              country: toAddress.country || "NO",
              isDefault: false
            }
          })
        } catch {
          // Ikke stopp prosessen hvis adresse-lagring feiler
        }
      }

      return NextResponse.json({
        rates: shippingRates,
        carrier: "PostNord",
        currency: "NOK",
        source: shippingResult.source || "postnord-api"
      })

    } catch {
      const fallbackRates = [
        {
          id: 'mypackcollect',
          name: 'MyPack Collect',
          description: 'Pakke til nærmeste hentested',
          price: 79,
          estimatedDelivery: 'Levering innen 2-4 virkedager',
          carrier: 'PostNord',
          type: 'pickup',
          service: '17'
        },
        {
          id: 'mypackhome',
          name: 'MyPack Home',
          description: 'Levering til døren på dagtid',
          price: 99,
          estimatedDelivery: 'Levering innen 2-4 virkedager',
          carrier: 'PostNord',
          type: 'home',
          service: '19'
        }
      ]

      return NextResponse.json({
        rates: fallbackRates,
        carrier: "PostNord",
        currency: "NOK",
        fallback: true
      })
    }

  } catch {
    return NextResponse.json(
      { error: "Kunne ikke beregne fraktpriser" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(addresses)
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente adresser" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const { testPostalCode } = await req.json()
    
    const companySettings = await prisma.companySettings.findFirst({
      where: { id: "default" }
    })

    if (!companySettings) {
      return NextResponse.json(
        { error: "Bedriftsadresse ikke konfigurert" },
        { status: 400 }
      )
    }

    const servicesResult = await checkServiceAvailability(
      companySettings.postalCode,
      testPostalCode || "0000",
      "NO"
    )

    return NextResponse.json({
      success: true,
      available: servicesResult.available,
      services: servicesResult.services || [],
      source: servicesResult.source,
      message: "PostNord API tilkobling fungerer"
    })

  } catch {
    return NextResponse.json(
      { error: "PostNord API test feilet" },
      { status: 500 }
    )
  }
}
