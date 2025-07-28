"use client"

import { ShippingRate } from "@/types/checkout"
import { ShippingOption } from "./shipping-option"
import { Home, Building, Package, Star } from "lucide-react"

interface ShippingGroupProps {
  title: string
  description: string
  icon: React.ReactNode
  options: ShippingRate[]
  selectedOptionId?: string
  onSelectOption: (option: ShippingRate) => void
  showCount?: boolean
}

export function ShippingGroup({ 
  title, 
  description, 
  icon, 
  options, 
  selectedOptionId, 
  onSelectOption,
  showCount = false 
}: ShippingGroupProps) {
  if (options.length === 0) return null

  // Sort options by distance for pickup locations
  const sortedOptions = [...options].sort((a, b) => {
    // Home delivery first
    if (a.type === 'home' && b.type !== 'home') return -1
    if (b.type === 'home' && a.type !== 'home') return 1
    
    // Then by distance
    const distanceA = a.location?.distanceFromRecipientAddress || 0
    const distanceB = b.location?.distanceFromRecipientAddress || 0
    return distanceA - distanceB
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          {showCount && options.length > 1 && (
            <p className="text-sm text-muted-foreground">
              {description} ({options.length} alternativer)
            </p>
          )}
          {!showCount && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        {sortedOptions.map((option) => (
          <ShippingOption
            key={option.id}
            option={option}
            isSelected={selectedOptionId === option.id}
            onSelect={() => onSelectOption(option)}
          />
        ))}
      </div>
    </div>
  )
}

interface ShippingOptionsListProps {
  options: ShippingRate[]
  selectedOptionId?: string
  onSelectOption: (option: ShippingRate) => void
}

export function ShippingOptionsList({ options, selectedOptionId, onSelectOption }: ShippingOptionsListProps) {
  // Group options by type
  const groupedOptions = {
    home: options.filter(option => option.type === 'home'),
    pickup: options.filter(option => option.type === 'pickup'),
    parcelLocker: options.filter(option => option.type === 'parcel-locker'),
    other: options.filter(option => !['home', 'pickup', 'parcel-locker'].includes(option.type))
  }

  return (
    <div className="space-y-6">
      {/* Home delivery */}
      <ShippingGroup
        title="Hjemlevering"
        description="Pakken leveres til døren din"
        icon={<Home className="h-5 w-5" />}
        options={groupedOptions.home}
        selectedOptionId={selectedOptionId}
        onSelectOption={onSelectOption}
      />

      {/* Service points */}
      <ShippingGroup
        title="Hentesteder" 
        description="Hent pakken på en butikk i nærheten"
        icon={<Building className="h-5 w-5" />}
        options={groupedOptions.pickup}
        selectedOptionId={selectedOptionId}
        onSelectOption={onSelectOption}
        showCount={true}
      />

      {/* Parcel lockers */}
      <ShippingGroup
        title="Pakkeautomater"
        description="Hent pakken når det passer deg - åpen 24/7"
        icon={<Package className="h-5 w-5" />}
        options={groupedOptions.parcelLocker}
        selectedOptionId={selectedOptionId}
        onSelectOption={onSelectOption}
        showCount={true}
      />

      {/* Other options */}
      {groupedOptions.other.length > 0 && (
        <ShippingGroup
          title="Andre alternativer"
          description="Tilleggsalternativer"
          icon={<Star className="h-5 w-5" />}
          options={groupedOptions.other}
          selectedOptionId={selectedOptionId}
          onSelectOption={onSelectOption}
        />
      )}
    </div>
  )
} 