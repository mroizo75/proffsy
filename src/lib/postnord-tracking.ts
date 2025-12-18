import { ShippingStatus } from '@prisma/client'
import { updateOrderShippingStatus } from './notifications'

const POSTNORD_API_BASE = "https://api2.postnord.com/rest/shipment"
const POSTNORD_API_KEY = process.env.POSTNORD_API_KEY!

interface PostNordTrackingEvent {
  eventTime: string
  eventCode: string
  eventDescription: string
  location?: {
    displayName: string
    city: string
    countryCode: string
  }
  status: 'InProgress' | 'Delivered' | 'Exception' | 'AtPickup' | 'PickedUp'
}

interface PostNordTrackingResponse {
  trackingInformationResponse: {
    shipments: Array<{
      shipmentId: string
      uri: string
      assessedNumberOfItems: number
      deliveryDate?: string
      totalWeight?: {
        unit: string
        value: number
      }
      recipientSignature?: {
        name: string
        time: string
      }
      events: PostNordTrackingEvent[]
      items: Array<{
        itemId: string
        status: string
        events: PostNordTrackingEvent[]
      }>
    }>
  }
}

const STATUS_MAPPING: Record<string, { shippingStatus: ShippingStatus, description: string }> = {
  // PostNord status codes til våre shipping statuser
  '101': { shippingStatus: 'SHIPPED', description: 'Pakken er mottatt av PostNord' },
  '102': { shippingStatus: 'IN_TRANSIT', description: 'Pakken er på transport' },
  '103': { shippingStatus: 'IN_TRANSIT', description: 'Pakken har ankommet terminal' },
  '104': { shippingStatus: 'OUT_FOR_DELIVERY', description: 'Pakken er ute på levering' },
  '105': { shippingStatus: 'DELIVERED', description: 'Pakken er levert' },
  '106': { shippingStatus: 'DELIVERED', description: 'Pakken er klar for henting' },
  '107': { shippingStatus: 'FAILED_DELIVERY', description: 'Leveringsforsøk mislyktes' },
  '108': { shippingStatus: 'RETURNED', description: 'Pakken er returnert til avsender' },
  
  // Status basert på event descriptions
  'SHIPPED': { shippingStatus: 'SHIPPED', description: 'Pakken er sendt' },
  'IN_TRANSIT': { shippingStatus: 'IN_TRANSIT', description: 'Pakken er på vei' },
  'OUT_FOR_DELIVERY': { shippingStatus: 'OUT_FOR_DELIVERY', description: 'Pakken er ute på levering' },
  'DELIVERED': { shippingStatus: 'DELIVERED', description: 'Pakken er levert' },
  'PICKUP_READY': { shippingStatus: 'DELIVERED', description: 'Pakken er klar for henting' },
  'FAILED_DELIVERY': { shippingStatus: 'FAILED_DELIVERY', description: 'Leveringsforsøk mislyktes' },
  'RETURNED': { shippingStatus: 'RETURNED', description: 'Pakken er returnert' },
}

function mapPostNordStatusToShippingStatus(eventCode: string, eventDescription: string, status: string): { shippingStatus: ShippingStatus, description: string } {
  // Først prøv event code
  if (STATUS_MAPPING[eventCode]) {
    return STATUS_MAPPING[eventCode]
  }
  
  // Deretter prøv status
  if (STATUS_MAPPING[status]) {
    return STATUS_MAPPING[status]
  }
  
  // Fallback basert på event description
  const description = eventDescription.toLowerCase()
  
  if (description.includes('levert') || description.includes('delivered')) {
    return { shippingStatus: 'DELIVERED', description: eventDescription }
  }
  
  if (description.includes('klar for henting') || description.includes('ready for pickup')) {
    return { shippingStatus: 'DELIVERED', description: eventDescription }
  }
  
  if (description.includes('ute på levering') || description.includes('out for delivery')) {
    return { shippingStatus: 'OUT_FOR_DELIVERY', description: eventDescription }
  }
  
  if (description.includes('mislyktes') || description.includes('failed')) {
    return { shippingStatus: 'FAILED_DELIVERY', description: eventDescription }
  }
  
  if (description.includes('transport') || description.includes('transit')) {
    return { shippingStatus: 'IN_TRANSIT', description: eventDescription }
  }
  
  if (description.includes('sendt') || description.includes('shipped')) {
    return { shippingStatus: 'SHIPPED', description: eventDescription }
  }
  
  // Default fallback
  return { shippingStatus: 'PROCESSING', description: eventDescription }
}

export async function fetchPostNordTrackingInfo(trackingNumber: string): Promise<PostNordTrackingResponse | null> {
  try {
    const url = `${POSTNORD_API_BASE}/v5/trackandtrace/findByIdentifierAndLocale.json?apikey=${POSTNORD_API_KEY}&id=${trackingNumber}&locale=no`
    
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PROFFSY-Tracking/1.0'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return null
    }

    const data: PostNordTrackingResponse = await response.json()
    
    return data
  } catch (error) {
    return null
  }
}

export async function updateOrderFromPostNordTracking(orderId: string, trackingNumber: string): Promise<{ success: boolean, message: string, statusChanged: boolean }> {
  try {
    const trackingData = await fetchPostNordTrackingInfo(trackingNumber)
    
    if (!trackingData || !trackingData.trackingInformationResponse?.shipments?.length) {
      return {
        success: false,
        message: 'Ingen sporingsinformasjon funnet for dette sporingsnummeret',
        statusChanged: false
      }
    }

    const shipment = trackingData.trackingInformationResponse.shipments[0]
    const latestEvent = shipment.events?.[0] || shipment.items?.[0]?.events?.[0]
    
    if (!latestEvent) {
      return {
        success: false,
        message: 'Ingen tracking events funnet',
        statusChanged: false
      }
    }

    // Map PostNord status to our shipping status
    const { shippingStatus, description } = mapPostNordStatusToShippingStatus(
      latestEvent.eventCode,
      latestEvent.eventDescription,
      latestEvent.status
    )

    // Prepare update data
    const updateData: any = {
      trackingUrl: `https://portal.postnord.com/tracking/${trackingNumber}`
    }

    // Set delivery dates based on status
    if (shippingStatus === 'DELIVERED' && latestEvent.eventTime) {
      updateData.actualDelivery = new Date(latestEvent.eventTime)
    }

    if (shippingStatus === 'FAILED_DELIVERY' && latestEvent.eventTime) {
      updateData.attemptedDelivery = new Date(latestEvent.eventTime)
      updateData.reason = description
      // Set next attempt to next business day
      const nextAttempt = new Date(latestEvent.eventTime)
      nextAttempt.setDate(nextAttempt.getDate() + 1)
      // Skip weekends
      if (nextAttempt.getDay() === 6) nextAttempt.setDate(nextAttempt.getDate() + 2) // Saturday -> Monday
      if (nextAttempt.getDay() === 0) nextAttempt.setDate(nextAttempt.getDate() + 1) // Sunday -> Monday
      updateData.nextAttempt = nextAttempt
    }

    // Add delivery date if available
    if (shipment.deliveryDate) {
      updateData.estimatedDelivery = new Date(shipment.deliveryDate)
    }

    // Add location info if available
    if (latestEvent.location) {
      updateData.currentLocation = JSON.stringify({
        name: latestEvent.location.displayName,
        city: latestEvent.location.city,
        country: latestEvent.location.countryCode
      })
    }


    // Update order with new tracking information
    await updateOrderShippingStatus(orderId, shippingStatus, updateData)

    return {
      success: true,
      message: `Ordre oppdatert til ${shippingStatus}: ${description}`,
      statusChanged: true
    }

  } catch (error) {
    return {
      success: false,
      message: `Feil ved oppdatering av sporingsinformasjon: ${error instanceof Error ? error.message : String(error)}`,
      statusChanged: false
    }
  }
}

export async function syncAllOrdersWithPostNord(): Promise<{ updated: number, errors: number }> {
  const { prisma } = await import('@/lib/db')
  
  try {
    // Get all orders with tracking numbers that are not yet delivered
    const orders = await prisma.order.findMany({
      where: {
        trackingNumber: { not: null },
        shippingStatus: { notIn: ['DELIVERED', 'RETURNED'] }
      },
      select: {
        orderId: true,
        trackingNumber: true,
        shippingStatus: true
      }
    })

    
    let updated = 0
    let errors = 0

    for (const order of orders) {
      try {
        const result = await updateOrderFromPostNordTracking(order.orderId, order.trackingNumber!)
        
        if (result.success && result.statusChanged) {
          updated++
        } else if (!result.success) {
          errors++
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        errors++
      }
    }

    return { updated, errors }
  } catch (error) {
    return { updated: 0, errors: 1 }
  }
}

export async function getTrackingUrl(trackingNumber: string): Promise<string> {
  return `https://portal.postnord.com/tracking/${trackingNumber}`
} 