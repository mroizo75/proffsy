import { SHIPPING_METHODS } from "@/types/checkout"

const BRING_API_URL = "https://api.bring.com/shippingguide/api/v2/products"
const BRING_API_KEY = process.env.BRING_API_KEY!

interface ShippingParams {
  weight: number
  fromPostalCode: string
  toPostalCode: string
  toCountry: string
}

export async function calculateShipping(params: ShippingParams) {
  const payload = {
    consignments: [{
      fromCountryCode: "NO",
      fromPostalCode: params.fromPostalCode,
      toCountryCode: params.toCountry,
      toPostalCode: params.toPostalCode,
      packages: [{
        weightInGrams: params.weight * 1000, // Konverter kg til gram
        dimensions: {
          heightInCm: 20,
          lengthInCm: 30,
          widthInCm: 20
        }
      }],
      products: [
        { id: "5800" }, // Servicepakke
        { id: "5600" }, // Bedriftspakke
        { id: "3570" }, // Hjemlevering
        { id: "4850" }  // Express
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

    // Transform response to our format
    const shippingRates = data.consignments?.[0]?.products?.map((product: any) => {
      const methodId = product.id as keyof typeof SHIPPING_METHODS
      const method = SHIPPING_METHODS[methodId]
      
      if (!method) return null

      return {
        id: methodId,
        name: method.name,
        description: method.description,
        price: Number(product.price?.listPrice?.priceWithoutAdditionalServices?.amountWithVAT || getDefaultPrice(methodId)),
        estimatedDelivery: `Levering ${product.expectedDelivery?.formattedExpectedDeliveryDate || 'innen 2-4 virkedager'}`,
        carrier: "Bring",
        type: method.type,
        service: product.id
      }
    }).filter(Boolean) || []

    return shippingRates

  } catch (error) {
    console.error("Shipping calculation error:", error)
    // Returner standard priser hvis API-kallet feiler
    return getDefaultShippingRates()
  }
}

function getDefaultPrice(serviceId: string): number {
  const defaultPrices: Record<string, number> = {
    '5800': 99,  // Servicepakke
    '5600': 149, // Bedriftspakke
    '3570': 199, // Hjemlevering
    '4850': 299, // Express
  }
  return defaultPrices[serviceId] || 99
}

function getDefaultShippingRates() {
  return [
    {
      id: '5800',
      name: 'Klimanøytral Servicepakke',
      description: 'Pakke til nærmeste hentested',
      price: 99,
      estimatedDelivery: 'Levering innen 2-4 virkedager',
      carrier: 'Bring',
      type: 'pickup',
      service: '5800'
    },
    {
      id: '5600',
      name: 'Bedriftspakke',
      description: 'Levering til døren på dagtid',
      price: 149,
      estimatedDelivery: 'Levering innen 1-3 virkedager',
      carrier: 'Bring',
      type: 'home',
      service: '5600'
    },
    {
      id: '3570',
      name: 'Klimanøytral Hjemlevering',
      description: 'Miljøvennlig pakke levert hjem til deg',
      price: 199,
      estimatedDelivery: 'Levering innen 2-4 virkedager',
      carrier: 'Bring',
      type: 'home',
      service: '3570'
    },
    {
      id: '4850',
      name: 'Express Neste Dag',
      description: 'Raskeste levering - fremme neste arbeidsdag',
      price: 299,
      estimatedDelivery: 'Levering neste virkedag',
      carrier: 'Bring',
      type: 'express',
      service: '4850'
    }
  ]
} 