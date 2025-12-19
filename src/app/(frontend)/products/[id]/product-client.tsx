"use client"

import { useState } from "react"
import { ProductGallery } from "@/components/products/product-gallery"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProductClientProps {
  product: any // TODO: Add proper type
}

export function ProductClient({ product }: ProductClientProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0])

  // Håndter variant endring
  const handleVariantChange = (variant: any) => {
    setSelectedVariant(variant)
  }

  // Bygg bilderliste - bruk URL direkte fra database (støtter både /api/r2/... og /uploads/...)
  const getImages = () => {
    // Hvis valgt variant har bilde, vis det
    if (selectedVariant?.image) {
      return [{ url: selectedVariant.image }]
    }
    // Ellers bruk produktbilder
    if (product.images && product.images.length > 0) {
      return product.images.map((img: any) => ({ url: img.url }))
    }
    return []
  }

  const allImages = getImages()

  return (
    <div className="container py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={allImages} />
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-bold mt-2">
              {formatPrice(selectedVariant?.price || product.price)}
            </p>
          </div>

          {product.description && (
            <div className="prose prose-slate dark:prose-invert">
              <p>{product.description}</p>
            </div>
          )}

          {product.variants.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Velg variant</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant: any) => (
                  <Button
                    key={variant.id}
                    onClick={() => handleVariantChange(variant)}
                    variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                    className={cn(
                      "relative h-10 px-4",
                      variant.color && "pl-8",
                      selectedVariant?.id === variant.id && "ring-2 ring-black dark:ring-white"
                    )}
                  >
                    {variant.color && (
                      <span 
                        className="absolute left-2 w-4 h-4 rounded-full"
                        style={{ 
                          backgroundColor: variant.color.value,
                          border: "1px solid rgba(0,0,0,0.1)" 
                        }} 
                      />
                    )}
                    {variant.name}
                    {variant.stock < 10 && variant.stock > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({variant.stock} igjen)
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              {selectedVariant?.stock === 0 && (
                <p className="text-sm text-red-500">Ikke på lager</p>
              )}
            </div>
          )}

          <AddToCartButton 
            product={{
              id: product.id,
              name: `${product.name} ${selectedVariant ? `- ${selectedVariant.name}` : ''}`,
              price: selectedVariant?.price || product.price,
              image: selectedVariant?.image || product.images[0]?.url || "",
              variantId: selectedVariant?.id,
              variantName: selectedVariant?.name,
              sku: selectedVariant?.sku || product.sku,
              stock: selectedVariant?.stock ?? product.stock
            }}
            disabled={selectedVariant?.stock === 0}
          />
        </div>
      </div>
    </div>
  )
} 