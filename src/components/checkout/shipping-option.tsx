"use client"

import { ShippingRate } from "@/types/checkout"
import { formatPrice } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Leaf, Building, Package, Home, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ShippingOptionProps {
  option: ShippingRate
  isSelected: boolean
  onSelect: () => void
}

export function ShippingOption({ option, isSelected, onSelect }: ShippingOptionProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getDeliveryIcon = () => {
    switch (option.type) {
      case 'home':
        return <Home className="h-4 w-4" />
      case 'pickup':
        return <Building className="h-4 w-4" />
      case 'parcel-locker':
        return <Package className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return ''
    if (distance < 1000) return `${distance}m`
    return `${(distance / 1000).toFixed(1)}km`
  }

  const formatOpeningHours = (day: { open: boolean; timeRanges?: { from: string; to: string }[] }) => {
    if (!day.open) return 'Stengt'
    if (!day.timeRanges?.length) return 'Åpen'
    return day.timeRanges.map(range => `${range.from}-${range.to}`).join(', ')
  }

  const getTodaysHours = () => {
    if (!option.location?.openingHours) return null
    
    const today = new Date().getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayName = dayNames[today] as keyof typeof option.location.openingHours.regular
    
    return option.location.openingHours.regular[todayName]
  }

  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer transition-all border-2",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
      onClick={onSelect}
    >
      {/* Main option info */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1 text-primary">
            {getDeliveryIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{option.name}</h3>
              {option.fossilFree && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  <Leaf className="h-3 w-3 mr-1" />
                  Fossilfri
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{option.description}</p>
            
            {/* Delivery info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>📦 {option.estimatedDelivery} dager</span>
              {option.location?.distanceFromRecipientAddress && (
                <span>📍 {formatDistance(option.location.distanceFromRecipientAddress)} unna</span>
              )}
              {option.friendlyDeliveryInfo && (
                <span>{option.friendlyDeliveryInfo}</span>
              )}
            </div>

            {/* Location name for pickup/locker */}
            {option.location && (
              <div className="mt-2 p-2 bg-muted/50 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{option.location.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.location.address.streetName} {option.location.address.streetNumber}, {option.location.address.city}
                    </p>
                    {getTodaysHours() && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        I dag: {formatOpeningHours(getTodaysHours()!)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDetails(!showDetails)
                    }}
                    className="text-primary hover:text-primary/80"
                  >
                    {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-semibold">{formatPrice(option.price)}</div>
          <div className="text-xs text-muted-foreground">{option.carrier}</div>
        </div>
      </div>

      {/* Detailed opening hours */}
      {showDetails && option.location?.openingHours && (
        <div className="mt-3 pt-3 border-t">
          <h4 className="font-medium text-sm mb-2">Åpningstider</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(option.location.openingHours.regular).map(([day, hours]) => (
              <div key={day} className="flex justify-between">
                <span className="capitalize">{day.slice(0, 3)}</span>
                <span>{formatOpeningHours(hours)}</span>
              </div>
            ))}
          </div>
          
          {option.type === 'parcel-locker' && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              💡 Pakkeautomater er tilgjengelige 24/7 med PostNord App og BankID
            </div>
          )}
        </div>
      )}
    </Card>
  )
} 