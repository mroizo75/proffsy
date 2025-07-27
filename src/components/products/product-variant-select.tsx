"use client"

import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/utils"
import { Decimal } from "@prisma/client/runtime/library"

interface Variant {
  id: string
  name: string
  sku: string
  price: number | Decimal
  stock: number
  color?: {
    id: string
    name: string
    value: string
  }
}

interface ProductVariantSelectProps {
  variants: Variant[]
}

export function ProductVariantSelect({ variants }: ProductVariantSelectProps) {
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id)

  return (
    <div className="space-y-3">
      <Label>Velg variant</Label>
      <RadioGroup
        value={selectedVariant}
        onValueChange={setSelectedVariant}
        className="grid grid-cols-2 gap-2"
      >
        {variants.map((variant) => (
          <div key={variant.id} className="flex items-center space-x-2">
            <RadioGroupItem value={variant.id} id={variant.id} />
            <Label htmlFor={variant.id} className="flex justify-between w-full">
              <span>{variant.name}</span>
              <span className="text-muted-foreground">
                {formatPrice(Number(variant.price))}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
} 