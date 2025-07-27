"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface Variant {
  id: string
  name: string
  color?: {
    id: string
    name: string
    value: string
  }
}

interface ProductColorSelectProps {
  variants: Variant[]
}

export function ProductColorSelect({ variants }: ProductColorSelectProps) {
  const [selectedColor, setSelectedColor] = useState(variants[0]?.color?.id)

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Velg farge</label>
      <div className="flex gap-2">
        {variants.map((variant) => (
          variant.color && (
            <button
              key={variant.color.id}
              onClick={() => setSelectedColor(variant.color?.id)}
              className={cn(
                "w-8 h-8 rounded-full border-2",
                selectedColor === variant.color.id 
                  ? "border-primary" 
                  : "border-transparent"
              )}
              style={{ backgroundColor: variant.color.value }}
              title={variant.color.name}
            />
          )
        ))}
      </div>
    </div>
  )
} 