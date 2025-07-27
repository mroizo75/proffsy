"use client"

import { useCart } from "@/lib/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"

const FREE_SHIPPING_THRESHOLD = 1000

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCart()
  const subtotal = getSubtotal()

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Din handlekurv er tom</h1>
          <p className="text-muted-foreground mb-8">
            Du har ingen produkter i handlekurven din.
          </p>
          <Link href="/products">
            <Button>Se våre produkter</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Handlekurv</h1>
      
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.id}-${item.variantId || ''}`}
                className="flex items-start gap-4 bg-card p-4 rounded-lg border"
              >
                <div className="relative h-24 w-24 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  {item.variantName && (
                    <p className="text-sm text-muted-foreground">
                      Variant: {item.variantName}
                    </p>
                  )}
                  {item.sku && (
                    <p className="text-sm text-muted-foreground">
                      Art.nr: {item.sku}
                    </p>
                  )}
                  <p className="text-lg font-semibold mt-1">
                    {formatPrice(item.price)}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id, item.variantId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-4">
          <div className="bg-card p-6 rounded-lg border sticky top-8">
            <h2 className="font-semibold mb-4">Oppsummering</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-medium">
                <span>Sum</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>
            
            <Link href="/checkout" prefetch={false} legacyBehavior>
              <a>
                <Button className="w-full mt-6" size="lg">
                  Gå til kassen ({formatPrice(subtotal)})
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 