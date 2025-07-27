"use client"

import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface CartNotificationProps {
  product: {
    id: string
    name: string
    price: number
    image?: string
  }
  onDismiss?: () => void
}

export function CartNotification({ product, onDismiss }: CartNotificationProps) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    setIsOpen(true)
  }, [product])

  const handleClose = () => {
    setIsOpen(false)
    onDismiss?.()
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Handlekurv</SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="mt-8">
          <div className="flex items-start gap-4 border-b pb-6">
            {product.image && (
              <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <h3 className="font-medium">Lagt til i handlekurv</h3>
              <p className="text-base text-muted-foreground">{product.name}</p>
              <p className="text-lg font-medium">{formatPrice(product.price)}</p>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            <Link href="/checkout">
              <Button size="lg" className="w-full" onClick={handleClose}>
                Gå til kassen
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onClick={handleClose}
            >
              Fortsett å handle
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 