"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/hooks/use-cart"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    image: string
    variantId?: string
    variantName?: string
    sku?: string
    stock?: number
  }
  className?: string
  disabled?: boolean
}

export function AddToCartButton({ product, className, disabled }: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addItem } = useCart()

  function handleAddToCart() {
    setIsLoading(true)
    try {
      const { stock, ...cartItem } = product
      addItem(cartItem)
      toast.success('Produkt lagt i handlekurv')
    } catch (error) {
      toast.error('Kunne ikke legge produkt i handlekurv')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleAddToCart}
      disabled={isLoading || disabled || (product.stock !== undefined && product.stock <= 0)}
      size="lg"
      className={cn("w-full", className)}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Legg i handlekurv
        </>
      )}
    </Button>
  )
} 