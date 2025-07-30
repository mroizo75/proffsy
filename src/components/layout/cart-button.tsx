"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import Link from "next/link"

export function CartButton() {
  const { items } = useCart()
  // Beregn total antall varer (ikke bare antall unike produkter)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link href="/cart" >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[11px] font-medium text-primary-foreground flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Link>
    </Button>
  );
} 
