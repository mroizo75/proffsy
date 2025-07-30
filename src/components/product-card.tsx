"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { useCart } from "@/lib/hooks/use-cart"
import { toast } from "sonner"

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    images?: { url: string }[]
    stock?: number
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  
  console.log('🛒 ProductCard render for product:', {
    id: product.id,
    name: product.name,
    price: product.price
  })

  function handleAddToCart(e: React.MouseEvent) {
    console.log('🛒 handleAddToCart clicked!')
    e.preventDefault()
    e.stopPropagation() // Forhindre navigasjon til produktside
    
    try {
      console.log('🛒 Product data:', {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images?.length || 0,
        stock: product.stock
      })
      
      const cartItem = {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.images?.[0]?.url || "",
        stock: product.stock || 0
      }
      
      console.log('🛒 Cart item to add:', cartItem)
      console.log('🛒 Calling addItem...')
      
      addItem(cartItem)
      
      console.log('🛒 addItem called successfully')
      toast.success(`${product.name} lagt i handlekurv`)
      console.log('🛒 Toast shown')
      
    } catch (error) {
      console.error('🛒 Error in handleAddToCart:', error)
      toast.error('Feil ved tillegging til handlekurv')
    }
  }

  return (
    <div className="group bg-card hover:bg-card/80 dark:bg-card/90 dark:hover:bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-200">
      <Link href={`/products/${product.id}`} className="block" >
        <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl bg-muted dark:bg-muted/50">
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-muted/20">
              Ingen bilde
            </div>
          )}
        </div>
      </Link>
      <div className="p-6">
        <Link href={`/products/${product.id}`} >
          <h3 className="text-lg font-medium group-hover:text-primary dark:group-hover:text-primary/90 line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xl font-semibold text-foreground dark:text-foreground/90">
            {formatPrice(product.price)}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary dark:hover:text-primary/90 hover:bg-primary/10"
            onClick={(e) => {
              console.log('🛒 Button onClick triggered')
              handleAddToCart(e)
            }}
            onMouseDown={() => console.log('🛒 Button mouseDown')}
            onMouseUp={() => console.log('🛒 Button mouseUp')}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 
