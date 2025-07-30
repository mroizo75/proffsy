import { SHIPPING_METHODS } from "@/types/checkout"

// Korrekt PostNord API struktur fra developer portal
const POSTNORD_API_BASE = "https://api2.postnord.com/rest/shipment"
const POSTNORD_API_KEY = process.env.POSTNORD_API_KEY

// Validering av API key
if (!POSTNORD_API_KEY) {
  console.warn("POSTNORD_API_KEY ikke definert i miljøvariablene")
}

interface ShippingParams {
  weight: number
  fromPostalCode: string
  toPostalCode: string
  toCountry: string
}

// PostNord tjeneste-IDs og mapping med norske oversettelser
const POSTNORD_SERVICES = {
  // PostNord servicekoder som returneres fra API
  "17": { // Home delivery
    id: 'hjemlevering',
    name: 'Hjemlevering',
    description: 'Levering til døren på dagtid',
    type: 'home',
    defaultPrice: 99
  },
  "19": { // Service point delivery
    id: 'hentepunkt', 
    name: 'Henting på utleveringssted',
    description: 'Pakke til nærmeste hentested',
    type: 'pickup',
    defaultPrice: 79
  },
  "26": { // Express home delivery
    id: 'express',
    name: 'Express hjemlevering',
    description: 'Rask levering til døren - 1-2 dager',
    type: 'express',
    defaultPrice: 149
  },
  "88": { // Business delivery
    id: 'bedrift',
    name: 'Bedriftslevering',
    description: 'Levering til bedriftsadresse',
    type: 'business',
    defaultPrice: 189
  },
  // Fallback for ukjente servicekoder
  "DK30": { // MyPack Home Small (fallback)
    id: 'standard',
    name: 'Standard levering',
    description: 'Standard PostNord levering',
    type: 'standard',
    defaultPrice: 89
  }
}

// Norske oversettelser for PostNord API-tekster
const NORWEGIAN_TRANSLATIONS = {
  // Delivery types
  "Home delivery": "Hjemlevering",
  "Collect at Service point": "Henting på utleveringssted", 
  "Collect at parcel locker": "Henting på pakkeautomat",
  
  // Descriptions
  "Delivery to your home": "Pakken leveres til døren din",
  "Delivery to your home.": "Pakken leveres til døren din", 
  "You will be notified via sms/email and in the PostNord App.": "Du får varsel på SMS/e-post og i PostNord-appen.",
  "Delivery to a service point near you. You will be notified via SMS/email and in PostNord App.": "Levering til et utleveringssted i nærheten. Du får varsel på SMS/e-post og i PostNord-appen.",
  "Delivery to a parcel locker near you and opened via PostNord App and an electronic national identification. You will be notified via SMS/email and in the PostNord App.": "Levering til en pakkeautomat i nærheten som åpnes med PostNord-appen og BankID. Du får varsel på SMS/e-post og i PostNord-appen.",
  
  // Time descriptions  
  "2-3 days": "2-3 dager",
  "1-2 days": "1-2 dager",
  "3-5 days": "3-5 dager"
}

// Funksjon for å oversette engelsk til norsk
function translateToNorwegian(text: string): string {
  return NORWEGIAN_TRANSLATIONS[text as keyof typeof NORWEGIAN_TRANSLATIONS] || text
}

interface PostNordDeliveryOptionRequest {
  customer: {
    customerKey: string
  }
  warehouses: [{
    id: string
    address: {
      street: string
      postCode: string
      city: string
      countryCode: string
    }
    orderHandling: {
      daysUntilOrderIsReady: string
    }
  }]
  recipient: {
    address: {
      postCode: string
      countryCode: string
    }
  }
  parcelInfo?: {
    length: number
    width: number
    height: number
    weight: number
  }
}



// Korrekt PostNord API kall
async function fetchPostNordDeliveryOptions(params: ShippingParams) {
  const { weight, fromPostalCode, toPostalCode, toCountry } = params
  
  try {
    // Valider API-nøkkel
    if (!POSTNORD_API_KEY) {
      throw new Error("POSTNORD_API_KEY ikke konfigurert")
    }

    // Valider parametere
    if (!fromPostalCode || !toPostalCode) {
      throw new Error("Postnummer mangler for avsender eller mottaker")
    }

    // Bygg korrekt URL med API-nøkkel som query parameter
    const url = `${POSTNORD_API_BASE}/v1/deliveryoptions/bywarehouse?apikey=${POSTNORD_API_KEY}`
    
    const requestBody: PostNordDeliveryOptionRequest = {
      customer: {
        customerKey: "PROFFSY-INTEGRATION" // Følger dokumentasjon format
      },
      warehouses: [{
        id: "proffsy_warehouse_001",
        address: {
          street: "Peckels gate 12b",
          postCode: fromPostalCode,
          city: "Kongsberg",
          countryCode: "NO"
        },
        orderHandling: {
          daysUntilOrderIsReady: "1-2" // 1-2 dager før pakken er klar for henting
        }
      }],
      recipient: {
        address: {
          postCode: toPostalCode,
          countryCode: toCountry
        }
      },
      parcelInfo: {
        length: 200, // 20cm i millimeter
        width: 150,  // 15cm i millimeter
        height: 100, // 10cm i millimeter
        weight: Math.max(weight * 1000, 100) // Konverter til gram, minimum 100g
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(`PostNord API error: ${response.status} - ${responseText}`)
    }

    const data = JSON.parse(responseText)
    return {
      success: true,
      data: data.warehouseToDeliveryOptions || []
    }

  } catch (error) {
    console.error("PostNord API call failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "PostNord API kall feilet"
    }
  }
}

// Hovedfunksjon for fraktberegning
export async function calculateShipping(params: ShippingParams) {

  
  try {
    // Prøv PostNord API først
    const apiResult = await fetchPostNordDeliveryOptions(params)
    
    if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
  
      
      // Map PostNord response til vårt format
      const allOptions: any[] = []
      
      // PostNord returnerer warehouseToDeliveryOptions array
      apiResult.data.forEach((warehouseOptions: any) => {
        if (warehouseOptions.deliveryOptions) {
          warehouseOptions.deliveryOptions.forEach((deliveryType: any) => {
            // Legg til default option hvis den finnes
            if (deliveryType.defaultOption) {
              allOptions.push(deliveryType.defaultOption)
            }
            // Legg til alle additional options
            if (deliveryType.additionalOptions) {
              allOptions.push(...deliveryType.additionalOptions)
            }
          })
        }
      })
      
      const shippingOptions = allOptions.map((option: any) => {
        const serviceCode = option.bookingInstructions?.serviceCode
        const serviceInfo = POSTNORD_SERVICES[serviceCode as keyof typeof POSTNORD_SERVICES] || {
          id: serviceCode || 'unknown',
          name: option.descriptiveTexts?.checkout?.title || 'PostNord levering',
          description: option.descriptiveTexts?.checkout?.briefDescription || 'PostNord levering',
          type: 'standard',
          defaultPrice: 99
        }

        // Determine delivery type based on location and service
        let deliveryType: 'home' | 'pickup' | 'parcel-locker' | 'standard' = 'standard'
        if (serviceCode === '17') {
          deliveryType = 'home'
        } else if (serviceCode === '19') {
          if (option.location?.name?.toLowerCase().includes('pakkeautomat') || 
              option.location?.name?.toLowerCase().includes('parcel locker')) {
            deliveryType = 'parcel-locker'
          } else {
            deliveryType = 'pickup'
          }
        }

        // Build delivery location object if exists
        let deliveryLocation: any = undefined
        if (option.location) {
          deliveryLocation = {
            name: option.location.name,
            address: {
              street: option.location.address?.street,
              streetName: option.location.address?.streetName,
              streetNumber: option.location.address?.streetNumber,
              postCode: option.location.address?.postCode,
              city: option.location.address?.city,
              countryCode: option.location.address?.countryCode
            },
            coordinate: option.location.coordinate,
            distanceFromRecipientAddress: option.location.distanceFromRecipientAddress,
            openingHours: option.location.openingHours,
            accessibility: option.location.accessibility
          }
        }
        
        return {
          id: `${serviceCode}-${option.bookingInstructions?.deliveryOptionId || Math.random()}`,
          name: translateToNorwegian(option.descriptiveTexts?.checkout?.title || serviceInfo.name),
          description: translateToNorwegian(option.descriptiveTexts?.checkout?.briefDescription || serviceInfo.description),
          price: serviceInfo.defaultPrice, // PostNord returnerer ikke priser i delivery options
          currency: 'NOK',
          estimatedDelivery: translateToNorwegian(option.deliveryTime?.dayRange?.days || option.deliveryTime?.date?.latest || 'Ukjent'),
          carrier: 'PostNord',
          type: deliveryType,
          service: serviceCode,
          
          // PostNord specific data
          deliveryOptionId: option.bookingInstructions?.deliveryOptionId,
          servicePointId: option.bookingInstructions?.servicePointId,
          location: deliveryLocation,
          
          // Sustainability info
          fossilFree: option.sustainability?.fossilFree || false,
          nordicSwanEcoLabel: option.sustainability?.nordicSwanEcoLabel || false,
          
          // Friendly delivery info
          friendlyDeliveryInfo: translateToNorwegian(option.descriptiveTexts?.checkout?.friendlyDeliveryInfo || ''),
          
          // Keep original data for debugging
          postNordData: option
        }
      }).filter(Boolean) // Remove any null entries
      
      return {
        success: true,
        options: shippingOptions,
        source: 'postnord-api'
      }
    }
    
    // Fallback til standard priser hvis API feiler
    // PostNord API failed, using fallback prices
    
    const fallbackOptions = [
      {
        id: 'varubrev',
        name: 'Varubrev',
        description: 'Levering til postkasse (3-5 virkedager)',
        price: 59,
        currency: 'NOK',
        estimatedDelivery: '3-5 dager',
        carrier: 'PostNord',
        type: 'economy'
      },
      {
        id: 'mypackcollect',
        name: 'Henting på utleveringssted',
        description: 'Pakke til nærmeste hentested (2-4 virkedager)',
        price: 79,
        currency: 'NOK',
        estimatedDelivery: '2-4 dager',
        carrier: 'PostNord',
        type: 'pickup'
      },
      {
        id: 'mypackhome',
        name: 'Hjemlevering',
        description: 'Levering til døren på dagtid (2-4 virkedager)',
        price: 99,
        currency: 'NOK',
        estimatedDelivery: '2-4 dager',
        carrier: 'PostNord',
        type: 'home'
      },
      {
        id: 'express',
        name: 'PostNord Express',
        description: 'Rask levering (1-2 virkedager)',
        price: 249,
        currency: 'NOK',
        estimatedDelivery: '1-2 dager',
        carrier: 'PostNord',
        type: 'express'
      }
    ]
    
    return {
      success: true,
      options: fallbackOptions,
      source: 'fallback',
      apiError: apiResult.error
    }
    
  } catch (error) {
    console.error("Shipping calculation failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Fraktberegning feilet"
    }
  }
}

// Sjekk tilgjengelighet for spesifikk tjeneste
export async function checkServiceAvailability(
  fromPostalCode: string,
  toPostalCode: string,
  toCountry: string = "NO"
) {
  try {
  
    
    // Test med en grunnleggende calculateShipping
    const testResult = await calculateShipping({
      weight: 0.5,
      fromPostalCode,
      toPostalCode,
      toCountry
    })
    
    return {
      available: testResult.success,
      services: testResult.options || [],
      source: testResult.source || 'test'
    }
    
  } catch (error) {
    console.error("Service availability check failed:", error instanceof Error ? error.message : String(error))
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Test PostNord API connection
export async function testPostNordAPI() {
  try {
  
    
    const testParams = {
      weight: 0.5, // 500g
      fromPostalCode: "3616", // Kongsberg
      toPostalCode: "0664", // Oslo
      toCountry: "NO"
    }
    
    const result = await calculateShipping(testParams)
    
    return {
      success: true,
      result,
      message: "PostNord API test utført"
    }
    
  } catch (error) {
    console.error("PostNord API test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "PostNord API test feilet"
    }
  }
} 