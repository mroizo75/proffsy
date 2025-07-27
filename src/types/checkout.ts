export interface ShippingRate {
  id: string
  name: string           // Navnet på fraktmetoden (f.eks. "Klimanøytral Servicepakke")
  description: string    // Beskrivelse av fraktmetoden
  price: number
  estimatedDelivery: string
  carrier: string
  type: string
  service: string       // Dette er Bring sin kode (f.eks. "5800")
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