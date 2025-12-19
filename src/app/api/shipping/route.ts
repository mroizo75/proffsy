import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculateShipping } from "@/lib/shipping"
import { fetchServicePoints } from "@/lib/postnord-servicepoints"

interface CartItem {
  id: string
  quantity: number
  weight?: number
}

// Standardverdier for frakt
const DEFAULT_WEIGHT = 500 // gram
const DEFAULT_LENGTH = 20  // cm
const DEFAULT_WIDTH = 15   // cm
const DEFAULT_HEIGHT = 10  // cm

// Fallback bedriftsadresse hvis ikke konfigurert
const DEFAULT_FROM_ADDRESS = {
  street: "Peckels gate 12b",
  postalCode: "3616",
  city: "Kongsberg",
  country: "NO"
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { items, toAddress } = body

    // Valider at vi har items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Handlekurven er tom" },
        { status: 400 }
      )
    }

    // Valider mottakeradresse
    if (!toAddress?.postalCode) {
      return NextResponse.json(
        { error: "Postnummer er påkrevd for fraktberegning" },
        { status: 400 }
      )
    }

    // Hent produktdata fra databasen for nøyaktig vekt og dimensjoner
    const productIds = items.map((item: CartItem) => item.id)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, weight: true, length: true, width: true, height: true }
    })
    
    // Lag et map for rask oppslag
    const productMap = new Map(products.map(p => [p.id, p]))
    
    // Beregn totalvekt og dimensjoner
    let totalWeight = 0
    let maxLength = 0
    let maxWidth = 0
    let totalHeight = 0
    
    for (const item of items as CartItem[]) {
      const product = productMap.get(item.id)
      const weight = product?.weight || DEFAULT_WEIGHT
      const length = product?.length || DEFAULT_LENGTH
      const width = product?.width || DEFAULT_WIDTH
      const height = product?.height || DEFAULT_HEIGHT
      
      totalWeight += weight * item.quantity
      maxLength = Math.max(maxLength, length)
      maxWidth = Math.max(maxWidth, width)
      totalHeight += height * item.quantity // Stables oppå hverandre
    }
    
    // Konverter til kg for API (vekt lagres i gram)
    const totalWeightKg = totalWeight / 1000

    // Hent bedriftsinnstillinger, bruk fallback hvis ikke funnet
    let fromAddress = DEFAULT_FROM_ADDRESS
    
    try {
      const companySettings = await prisma.companySettings.findFirst()
      if (companySettings) {
        fromAddress = {
          street: companySettings.street,
          postalCode: companySettings.postalCode,
          city: companySettings.city,
          country: companySettings.country
        }
      }
    } catch {
      // Bruk fallback-adresse
    }

    try {
      // Hent fraktalternativer fra PostNord
      // calculateShipping forventer vekt i kg
      const shippingResult = await calculateShipping({
        weight: Math.max(totalWeightKg, 0.1),
        fromPostalCode: fromAddress.postalCode,
        toPostalCode: toAddress.postalCode,
        toCountry: toAddress.country || "NO",
        // Dimensjoner i cm
        length: maxLength,
        width: maxWidth,
        height: totalHeight
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let shippingRates: any[] = shippingResult.options || []
      
      // Hent også service points for pickup-alternativer
      if (toAddress.street && toAddress.postalCode) {
        try {
          const servicePoints = await fetchServicePoints({
            street: toAddress.street,
            postalCode: toAddress.postalCode,
            city: toAddress.city || "",
            countryCode: toAddress.country || "NO"
          })
          
          // Legg til service points som pickup-alternativer
          if (servicePoints.length > 0) {
            const pickupOptions = servicePoints.slice(0, 5).map((sp) => ({
              id: `pickup-${sp.servicePointId}`,
              name: `Hent på ${sp.name}`,
              description: `${sp.address.streetName} ${sp.address.streetNumber || ""}, ${sp.address.postalCode} ${sp.address.city}`,
              price: 79, // Standard pickup-pris
              currency: "NOK",
              estimatedDelivery: "2-4 virkedager",
              carrier: "PostNord",
              type: "pickup",
              service: "19",
              servicePointId: sp.servicePointId,
              location: {
                name: sp.name,
                address: sp.address,
                coordinate: sp.coordinate,
                distanceFromRecipientAddress: sp.distanceFromRecipientAddress,
                openingHours: sp.openingHours
              }
            }))
            
            // Fjern generiske pickup-alternativer og erstatt med faktiske service points
            shippingRates = shippingRates.filter((rate: any) => rate.type !== 'pickup')
            shippingRates = [...shippingRates, ...pickupOptions]
          }
        } catch {
          // Fortsett uten service points
        }
      }

      // Sorter: hjemlevering først, deretter pickup etter avstand
      shippingRates.sort((a: any, b: any) => {
        if (a.type === 'home' && b.type !== 'home') return -1
        if (a.type !== 'home' && b.type === 'home') return 1
        if (a.type === 'pickup' && b.type === 'pickup') {
          const distA = a.location?.distanceFromRecipientAddress || 999999
          const distB = b.location?.distanceFromRecipientAddress || 999999
          return distA - distB
        }
        return 0
      })

      // Lagre adresse for innlogget bruker
      if (session?.user && toAddress.street) {
        try {
          await prisma.userAddress.upsert({
            where: {
              userId_street_postalCode: {
                userId: session.user.id,
                street: toAddress.street,
                postalCode: toAddress.postalCode
              }
            },
            update: {
              city: toAddress.city,
              country: toAddress.country || "NO"
            },
            create: {
              userId: session.user.id,
              name: "Leveringsadresse",
              street: toAddress.street,
              postalCode: toAddress.postalCode,
              city: toAddress.city || "",
              country: toAddress.country || "NO",
              isDefault: false
            }
          })
        } catch {
          // Ignorer feil ved adresselagring
        }
      }

      return NextResponse.json({
        rates: shippingRates,
        carrier: "PostNord",
        currency: "NOK",
        source: shippingResult.source || "postnord-api"
      })

    } catch {
      // Fallback-priser ved API-feil
      const fallbackRates = [
        {
          id: 'home-delivery',
          name: 'Hjemlevering',
          description: 'Levering til døren på dagtid (2-4 virkedager)',
          price: 99,
          currency: 'NOK',
          estimatedDelivery: '2-4 virkedager',
          carrier: 'PostNord',
          type: 'home',
          service: '17'
        },
        {
          id: 'pickup-standard',
          name: 'Hent på PostNord',
          description: 'Hent pakken på nærmeste utleveringssted',
          price: 79,
          currency: 'NOK',
          estimatedDelivery: '2-4 virkedager',
          carrier: 'PostNord',
          type: 'pickup',
          service: '19'
        }
      ]

      return NextResponse.json({
        rates: fallbackRates,
        carrier: "PostNord",
        currency: "NOK",
        source: "fallback"
      })
    }

  } catch (error) {
    return NextResponse.json(
      { error: "Kunne ikke beregne fraktpriser", details: error instanceof Error ? error.message : "Ukjent feil" },
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
