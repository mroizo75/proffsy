"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { useCart } from "@/components/cart/cart-provider"
import { CartNotification } from "@/components/cart/cart-notification"
import ReactDOM from "react-dom/client"

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    images: { url: string }[]
    stock: number
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart()

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url,
      quantity: 1
    }
    
    dispatch({ type: "ADD_ITEM", payload: cartItem })
    
    const root = document.createElement('div')
    root.id = 'cart-notification'
    document.body.appendChild(root)
    
    const cleanup = () => {
      document.body.removeChild(root)
    }

    ReactDOM.createRoot(root).render(
      <CartNotification product={cartItem} onDismiss={cleanup} />
    )
  }

  return (
    <div className="group bg-card hover:bg-card/80 dark:bg-card/90 dark:hover:bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-200">
      <Link href={`/products/${product.id}`} className="block" >
        <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl bg-muted dark:bg-muted/50">
          {product.images[0] ? (
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
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 
