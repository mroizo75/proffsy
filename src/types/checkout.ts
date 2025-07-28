export interface DeliveryLocation {
  name: string
  address: {
    street?: string
    streetName?: string
    streetNumber?: string
    postCode: string
    city: string
    countryCode: string
  }
  coordinate?: {
    latitude: number
    longitude: number
  }
  distanceFromRecipientAddress?: number
  openingHours?: {
    regular: {
      monday: { open: boolean; timeRanges?: { from: string; to: string }[] }
      tuesday: { open: boolean; timeRanges?: { from: string; to: string }[] }
      wednesday: { open: boolean; timeRanges?: { from: string; to: string }[] }
      thursday: { open: boolean; timeRanges?: { from: string; to: string }[] }
      friday: { open: boolean; timeRanges?: { from: string; to: string }[] }
      saturday: { open: boolean; timeRanges?: { from: string; to: string }[] }
      sunday: { open: boolean; timeRanges?: { from: string; to: string }[] }
    }
  }
  accessibility?: {
    parcelLockerLocation?: 'indoor' | 'outdoor'
  }
}

export interface ShippingRate {
  id: string
  name: string           // Navnet på fraktmetoden (f.eks. "Collect at Service point")
  description: string    // Beskrivelse av fraktmetoden
  price: number
  currency: string
  estimatedDelivery: string
  carrier: string
  type: 'home' | 'pickup' | 'parcel-locker' | 'economy' | 'express' | 'standard'
  service?: string       // Service code (f.eks. "17", "19")
  
  // PostNord specific data
  deliveryOptionId?: string  // For booking
  servicePointId?: string    // For pickup locations
  location?: DeliveryLocation // Delivery location details
  postNordData?: any         // Full PostNord response for debugging
  
  // Sustainability info
  fossilFree?: boolean
  nordicSwanEcoLabel?: boolean
  
  // Friendly info for display
  friendlyDeliveryInfo?: string
}

export interface CheckoutItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  weight?: number // gram
  dimensions?: {
    length: number // cm
    width: number
    height: number
  }
}

export interface OrderSummary {
  subtotal: number
  shipping: number
  total: number
  items: CheckoutItem[]
  shippingMethod?: ShippingRate
}

export interface CustomerInfo {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

// PostNord service mappings
export const POSTNORD_SERVICES = {
  "17": {
    name: "Home delivery",
    description: "Delivery to your home",
    type: "home"
  },
  "19": {
    name: "Service point / Parcel locker",
    description: "Pickup at service point or parcel locker",
    type: "pickup"
  }
} as const

// Legacy Bring mappings (for fallback)
export const SHIPPING_METHODS = {
  "5800": {
    name: "Klimanøytral Servicepakke",
    description: "Pakke til nærmeste hentested",
    type: "pickup"
  },
  "5600": {
    name: "Bedriftspakke",
    description: "Levering til døren på dagtid",
    type: "home"
  },
  "3570": {
    name: "Klimanøytral Hjemlevering",
    description: "Miljøvennlig pakke levert hjem til deg",
    type: "home"
  },
  "4850": {
    name: "Express Neste Dag",
    description: "Raskeste levering - fremme neste arbeidsdag",
    type: "express"
  }
} as const 