import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculateShipping, checkServiceAvailability } from "@/lib/shipping"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { items, toAddress } = body

    // Beregn total vekt
    const totalWeight = items.reduce((sum: number, item: any) => {
      return sum + (item.weight || 0.5) * item.quantity // Standard 500g hvis ikke spesifisert
    }, 0)

    console.log('PostNord shipping request:', {
      items: items.length,
      totalWeight,
      toAddress,
      timestamp: new Date().toISOString()
    })

    // Hent bedriftsadresse
    const companySettings = await prisma.companySettings.findFirst({
      where: { id: "default" }
    })

    console.log("CompanySettings fra database:", companySettings)

    if (!companySettings) {
      console.error("FEIL: CompanySettings ikke funnet i databasen!")
      return NextResponse.json(
        { 
          error: "Bedriftsadresse ikke konfigurert",
          debug: "CompanySettings med id='default' ikke funnet i databasen. Kjør 'npm run db:seed' for å opprette standard innstillinger."
        },
        { status: 400 }
      )
    }

    // Valider toAddress
    if (!toAddress?.postalCode) {
      return NextResponse.json(
        { error: "Gyldig postnummer er påkrevd" },
        { status: 400 }
      )
    }

    try {
      // Beregn fraktpriser med PostNord
      const shippingResult = await calculateShipping({
        weight: Math.max(totalWeight, 0.1), // Minimum 100g
        fromPostalCode: companySettings.postalCode,
        toPostalCode: toAddress.postalCode,
        toCountry: toAddress.country || "NO",
      })

      console.log("PostNord shipping result:", shippingResult)

      // Håndter resultat fra calculateShipping
      if (!shippingResult.success) {
        throw new Error(shippingResult.message || "Fraktberegning feilet")
      }

      const shippingRates = shippingResult.options || []

      // Lagre adressen hvis bruker er innlogget
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
        } catch (dbError) {
          console.log("Could not save address:", dbError)
          // Ikke stopp prosessen hvis adresse-lagring feiler
        }
      }

      return NextResponse.json({
        rates: shippingRates,
        carrier: "PostNord",
        currency: "NOK",
        source: shippingResult.source || "postnord-api"
      })

    } catch (shippingError) {
      console.error("PostNord API Error detaljert:", {
        error: shippingError,
        message: shippingError instanceof Error ? shippingError.message : String(shippingError),
        stack: shippingError instanceof Error ? shippingError.stack : undefined,
        shippingParams: {
          weight: Math.max(totalWeight, 0.1),
          fromPostalCode: companySettings.postalCode,
          toPostalCode: toAddress.postalCode,
          toCountry: toAddress.country || "NO"
        }
      })
      
      // Returner standard priser hvis PostNord API feiler
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

  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: "Kunne ikke beregne fraktpriser" },
      { status: 500 }
    )
  }
}

// Hent lagrede adresser for innlogget bruker
export async function GET(req: Request) {
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
  } catch (error) {
    console.error("Error fetching addresses:", error)
    return NextResponse.json(
      { error: "Kunne ikke hente adresser" },
      { status: 500 }
    )
  }
}

// Test PostNord API connection
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

    // Test service availability
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

  } catch (error) {
    console.error("PostNord API test failed:", error)
    return NextResponse.json(
      { error: "PostNord API test feilet", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 