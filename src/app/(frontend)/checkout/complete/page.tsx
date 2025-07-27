"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { useCart } from "@/lib/hooks/use-cart"
import { toast } from "sonner"

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface ShippingAddress {
  street: string
  city: string
  postalCode: string
  country: string
}

interface Order {
  orderId: string
  status: string
  totalAmount: number
  shippingAmount: number
  items: OrderItem[]
  shippingAddress: ShippingAddress
}

function CheckoutComplete() {
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { clearCart } = useCart()

  useEffect(() => {
    const orderId = searchParams.get("order")
    const paymentId = searchParams.get("paymentid")

    if (!orderId || !paymentId) {
      setError("Ugyldig ordre")
      setIsLoading(false)
      return
    }

    async function verifyPayment() {
      try {
        const response = await fetch(`/api/payment/verify?orderId=${orderId}&paymentId=${paymentId}`)
        if (!response.ok) throw new Error("Kunne ikke verifisere betaling")
        
        const data = await response.json()
        setOrder(data.order)
        
        // Tøm handlekurven kun hvis betalingen er bekreftet
        if (data.paymentStatus === "success") {
          clearCart()
          toast.success("Betaling gjennomført")
        } else {
          toast.error("Betalingen er ikke fullført ennå")
        }
      } catch (error) {
        setError("Kunne ikke hente ordredetaljer")
      } finally {
        setIsLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams, clearCart])

  if (isLoading) {
    return (
      <div className="container py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Verifiserer din betaling...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container py-16">
        <Card className="p-6 max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Noe gikk galt</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link href="/checkout">Tilbake til kassen</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-16">
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Takk for din bestilling!</h1>
          <p className="text-muted-foreground">
            Din ordre #{order.orderId} er bekreftet
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-semibold mb-2">Leveringsadresse</h2>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Ordredetaljer</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Antall: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Frakt</span>
                  <span>{formatPrice(order.shippingAmount)}</span>
                </div>
                <div className="flex justify-between font-medium text-lg">
                  <span>Totalt</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/products">Fortsett å handle</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Laster...</div>}>
      <CheckoutComplete />
    </Suspense>
  )
} 