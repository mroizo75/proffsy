/**
 * PostNord Service Points API
 * Henter nærmeste hentesteder basert på adresse
 */

const POSTNORD_API_KEY = process.env.POSTNORD_API_KEY
const POSTNORD_API_BASE = "https://api2.postnord.com/rest/businesslocation/v5/servicepoints"

export interface ServicePointAddress {
  streetName: string
  streetNumber?: string
  postalCode: string
  city: string
  countryCode: string
}

export interface ServicePointCoordinate {
  northing: number
  easting: number
  srId: string
}

export interface OpeningHour {
  from1: string
  to1: string
  from2?: string
  to2?: string
}

export interface ServicePoint {
  servicePointId: string
  name: string
  address: ServicePointAddress
  coordinate?: ServicePointCoordinate
  distanceFromRecipientAddress?: number
  openingHours?: {
    monday?: OpeningHour
    tuesday?: OpeningHour
    wednesday?: OpeningHour
    thursday?: OpeningHour
    friday?: OpeningHour
    saturday?: OpeningHour
    sunday?: OpeningHour
  }
  type?: string
  routeDistance?: number
  visitingAddress?: ServicePointAddress
  deliveryAddress?: ServicePointAddress
}

interface ServicePointsResponse {
  servicePointInformationResponse?: {
    servicePoints?: ServicePoint[]
  }
}

interface FetchServicePointsParams {
  street?: string
  postalCode: string
  city?: string
  countryCode?: string
  numberOfServicePoints?: number
}

/**
 * Henter nærmeste PostNord service points basert på adresse
 */
export async function fetchServicePoints(params: FetchServicePointsParams): Promise<ServicePoint[]> {
  const { 
    street, 
    postalCode, 
    city, 
    countryCode = "NO",
    numberOfServicePoints = 10 
  } = params

  if (!POSTNORD_API_KEY) {
    return []
  }

  try {
    // Bygg URL med query parametere
    const queryParams = new URLSearchParams({
      apikey: POSTNORD_API_KEY,
      countryCode: countryCode,
      postalCode: postalCode,
      numberOfServicePoints: numberOfServicePoints.toString(),
      typeId: "24,25,54" // 24=Postkontor, 25=Post i butikk, 54=Pakkeautomat
    })

    if (street) {
      queryParams.set("streetName", street)
    }

    if (city) {
      queryParams.set("city", city)
    }

    const url = `${POSTNORD_API_BASE}/findNearestByAddress.json?${queryParams.toString()}`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "PROFFSY-ServicePoints/1.0"
      }
    })

    if (!response.ok) {
      return []
    }

    const data: ServicePointsResponse = await response.json()
    
    const servicePoints = data.servicePointInformationResponse?.servicePoints || []
    
    // Formater og returner service points
    return servicePoints.map(sp => ({
      servicePointId: sp.servicePointId,
      name: sp.name,
      address: {
        streetName: sp.visitingAddress?.streetName || sp.address?.streetName || "",
        streetNumber: sp.visitingAddress?.streetNumber || sp.address?.streetNumber,
        postalCode: sp.visitingAddress?.postalCode || sp.address?.postalCode || "",
        city: sp.visitingAddress?.city || sp.address?.city || "",
        countryCode: sp.visitingAddress?.countryCode || sp.address?.countryCode || countryCode
      },
      coordinate: sp.coordinate,
      distanceFromRecipientAddress: sp.routeDistance,
      openingHours: sp.openingHours,
      type: sp.type
    }))

  } catch {
    return []
  }
}

/**
 * Henter service point basert på ID
 */
export async function getServicePointById(servicePointId: string, countryCode: string = "NO"): Promise<ServicePoint | null> {
  if (!POSTNORD_API_KEY) {
    return null
  }

  try {
    const url = `${POSTNORD_API_BASE}/findByServicePointId.json?apikey=${POSTNORD_API_KEY}&countryCode=${countryCode}&servicePointId=${servicePointId}`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    })

    if (!response.ok) {
      return null
    }

    const data: ServicePointsResponse = await response.json()
    const sp = data.servicePointInformationResponse?.servicePoints?.[0]
    
    if (!sp) {
      return null
    }

    return {
      servicePointId: sp.servicePointId,
      name: sp.name,
      address: {
        streetName: sp.visitingAddress?.streetName || sp.address?.streetName || "",
        streetNumber: sp.visitingAddress?.streetNumber || sp.address?.streetNumber,
        postalCode: sp.visitingAddress?.postalCode || sp.address?.postalCode || "",
        city: sp.visitingAddress?.city || sp.address?.city || "",
        countryCode: sp.visitingAddress?.countryCode || sp.address?.countryCode || countryCode
      },
      coordinate: sp.coordinate,
      openingHours: sp.openingHours,
      type: sp.type
    }

  } catch {
    return null
  }
}

/**
 * Formater åpningstider til lesbar tekst
 */
export function formatOpeningHours(hours?: ServicePoint["openingHours"]): string {
  if (!hours) return "Ukjente åpningstider"

  const days = [
    { key: "monday", label: "Man" },
    { key: "tuesday", label: "Tir" },
    { key: "wednesday", label: "Ons" },
    { key: "thursday", label: "Tor" },
    { key: "friday", label: "Fre" },
    { key: "saturday", label: "Lør" },
    { key: "sunday", label: "Søn" }
  ]

  const formatted = days.map(({ key, label }) => {
    const day = hours[key as keyof typeof hours]
    if (!day) return `${label}: Stengt`
    
    let time = `${day.from1}-${day.to1}`
    if (day.from2 && day.to2) {
      time += `, ${day.from2}-${day.to2}`
    }
    return `${label}: ${time}`
  })

  return formatted.join(" | ")
}

