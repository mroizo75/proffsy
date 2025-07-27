import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SHIPPING_METHODS } from "@/types/checkout"
import { calculateShipping } from "@/lib/shipping"

const BRING_API_KEY = process.env.BRING_API_KEY!
const BRING_API_URL = "https://api.bring.com/shippingguide/api/v2/products"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { items, toAddress } = body

    // Beregn total vekt og volum
    const totalWeight = items.reduce((sum: number, item: any) => {
      return sum + (item.weight || 0) * item.quantity
    }, 0)

    // Sjekk at vi har gyldig data
    console.log('Shipping request:', {
      items,
      totalWeight,
      toAddress
    })

    const shippingRates = await calculateShipping({
      weight: totalWeight || 1, // Minimum 1 kg hvis ingen vekt er spesifisert
      fromPostalCode: process.env.SHOP_POSTAL_CODE || "0000",
      toPostalCode: toAddress.postalCode,
      toCountry: toAddress.country || "NO",
    })

    // Legg til standard priser hvis Bring returnerer 0
    const ratesWithPrices = shippingRates.map(rate => ({
      ...rate,
      price: rate.price || getDefaultPrice(rate.id)
    }))

    // Hent bedriftsadresse
    const companySettings = await prisma.companySettings.findFirst({
      where: { id: "default" }
    })

    if (!companySettings) {
      return NextResponse.json(
        { error: "Bedriftsadresse ikke konfigurert" },
        { status: 400 }
      )
    }

    // Beregn total vekt og størrelse for alle produkter
    const packageDetails = items.reduce((acc: any, item: any) => {
      return {
        weight: acc.weight + (item.weight || 500) * item.quantity, // Standard 500g hvis ikke spesifisert
        length: Math.max(acc.length, item.length || 20), // Største lengde
        width: Math.max(acc.width, item.width || 20),    // Største bredde
        height: acc.height + (item.height || 10) * item.quantity // Total høyde
      }
    }, { weight: 0, length: 0, width: 0, height: 0 })

    // Prepare request payload according to Bring API spec
    const payload = {
      consignments: [{
        fromCountryCode: companySettings.country,
        fromPostalCode: companySettings.postalCode,
        toCountryCode: toAddress.country || 'NO',
        toPostalCode: toAddress.postalCode,
        packages: [{
          id: "pkg-1",
          weightInGrams: packageDetails.weight,
          dimensions: {
            heightInCm: packageDetails.height,
            lengthInCm: packageDetails.length,
            widthInCm: packageDetails.width
          }
        }],
        products: [
          { id: "5800" }, // PAKKE TIL HENTESTED: Klimanøytral Servicepakke
          { id: "5600" }, // BEDRIFTSPAKKE: Pakke levert på døren
          { id: "3570" }, // KLIMANØYTRAL SERVICEPAKKE: Pakke levert hjem
          { id: "4850" }  // EKSPRESS NESTE DAG: Bedriftspakke Express-Over natten
        ]
      }],
      language: "NO",
      withPrice: true,
      withExpectedDelivery: true,
      withGuiInformation: true,
      edi: false
    }

    try {
      const response = await fetch(BRING_API_URL, {
        method: "POST",
        headers: {
          "X-MyBring-API-Uid": process.env.BRING_API_UID || "",
          "X-MyBring-API-Key": BRING_API_KEY,
          "X-Bring-Client-URL": process.env.NEXT_PUBLIC_APP_URL || "",
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Bring API Error: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Bring API response:", data) // Debug

      // Transform response to our format
      const shippingRates = data.consignments?.[0]?.products?.map((product: any) => {
        const methodId = product.id as keyof typeof SHIPPING_METHODS
        const method = SHIPPING_METHODS[methodId]
        
        if (!method) return null // Skip ukjente fraktmetoder
        
        return {
          id: methodId,
          name: method.name,
          description: method.description,
          price: Number(product.price?.listPrice?.priceWithoutAdditionalServices?.amountWithVAT || 0),
          estimatedDelivery: `Levering ${product.expectedDelivery?.formattedExpectedDeliveryDate}`,
          carrier: "Bring",
          type: method.type,
          service: product.id
        }
      }).filter(Boolean) || []

      console.log("Transformed shipping rates:", shippingRates) // Debug

      // Lagre adressen hvis bruker er innlogget
      if (session?.user) {
        await prisma.userAddress.upsert({
          where: {
            userId_street_postalCode: {
              userId: session.user.id,
              street: toAddress.street,
              postalCode: toAddress.postalCode
            }
          },
          update: {},
          create: {
            userId: session.user.id,
            name: "Sist brukt",
            ...toAddress,
            isDefault: false
          }
        })
      }

      return NextResponse.json(ratesWithPrices)

    } catch (error) {
      console.error("Bring API Error:", error)
      return NextResponse.json(
        { error: "Kunne ikke hente fraktpriser fra Bring" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: "Kunne ikke beregne fraktpriser" },
      { status: 500 }
    )
  }
}

// Standard priser hvis Bring API feiler
function getDefaultPrice(serviceId: string): number {
  const defaultPrices: Record<string, number> = {
    '5800': 99,  // Servicepakke
    '5600': 149, // Bedriftspakke
    '3570': 199, // Hjemlevering
    '4850': 299, // Express
  }
  return defaultPrices[serviceId] || 99
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