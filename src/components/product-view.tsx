"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProductViewProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    images: { url: string }[]
    variants: Array<{
      id: string
      name: string
      price: number
      stock: number
      image?: string
      color?: {
        id: string
        name: string
        value: string
      }
    }>
  }
}

export function ProductView({ product }: ProductViewProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0])
  const [currentImage, setCurrentImage] = useState(
    selectedVariant?.image || product.images[0]?.url
  )

  // Grupper varianter etter farge
  const variantsByColor = product.variants.reduce((acc, variant) => {
    if (variant.color) {
      if (!acc[variant.color.id]) {
        acc[variant.color.id] = {
          color: variant.color,
          variants: []
        }
      }
      acc[variant.color.id].variants.push(variant)
    }
    return acc
  }, {} as Record<string, { color: any, variants: typeof product.variants }>)

  return (
    <div className="grid md:grid-cols-2 gap-8 p-4">
      {/* Bilde-seksjon */}
      <div className="space-y-4">
        <div className="relative aspect-square">
          <Image
            src={currentImage}
            alt={product.name}
            fill
            className="object-cover rounded-lg"
          />
        </div>
        
        {/* Miniatyrbilder */}
        <div className="grid grid-cols-6 gap-2">
          {product.images.map((image) => (
            <button
              key={image.url}
              onClick={() => setCurrentImage(image.url)}
              className={`relative aspect-square rounded-md overflow-hidden border-2 
                ${currentImage === image.url ? 'border-primary' : 'border-transparent'}`}
            >
              <Image
                src={image.url}
                alt={product.name}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Produkt-info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-semibold mt-2">
            {selectedVariant?.price || product.price} kr
          </p>
        </div>

        <p className="text-muted-foreground">{product.description}</p>

        {/* Variant-velger */}
        <div className="space-y-4">
          {Object.values(variantsByColor).length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Velg farge</label>
              <div className="flex gap-2">
                {Object.values(variantsByColor).map(({ color, variants }) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      const variant = variants[0]
                      setSelectedVariant(variant)
                      if (variant.image) setCurrentImage(variant.image)
                    }}
                    className={`relative w-12 h-12 rounded-full border-2 p-1
                      ${selectedVariant?.color?.id === color.id ? 'border-primary' : 'border-transparent'}`}
                  >
                    <span
                      className="block w-full h-full rounded-full"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="sr-only">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVariant && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Velg størrelse</label>
              <Select
                value={selectedVariant.id}
                onValueChange={(value) => {
                  const variant = product.variants.find(v => v.id === value)
                  if (variant) {
                    setSelectedVariant(variant)
                    if (variant.image) setCurrentImage(variant.image)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg størrelse" />
                </SelectTrigger>
                <SelectContent>
                  {product.variants
                    .filter(v => v.color?.id === selectedVariant.color?.id)
                    .map((variant) => (
                      <SelectItem 
                        key={variant.id} 
                        value={variant.id}
                        disabled={variant.stock === 0}
                      >
                        {variant.name} {variant.stock === 0 ? '(Utsolgt)' : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button 
          size="lg" 
          className="w-full"
          disabled={!selectedVariant || selectedVariant.stock === 0}
        >
          {selectedVariant?.stock === 0 ? 'Utsolgt' : 'Legg i handlekurv'}
        </Button>
      </div>
    </div>
  )
} 