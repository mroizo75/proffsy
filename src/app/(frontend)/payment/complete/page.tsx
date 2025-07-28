"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface OrderDetails {
  orderId: string
  status: string
  totalAmount: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  shippingAmount: number
}

function PaymentCompletion() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const { state, dispatch } = useCart()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment?orderId=${orderId}`)
        if (!response.ok) throw new Error("Kunne ikke verifisere betaling")
        
        const data = await response.json()
        
        if (data.status === "success") {
          dispatch({ type: "CLEAR_CART" })
          // Hent ordredetaljer
          const orderResponse = await fetch(`/api/orders/${orderId}`)
          if (!orderResponse.ok) throw new Error("Kunne ikke hente ordredetaljer")
          
          const orderData = await orderResponse.json()
          setOrder(orderData)
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Ukjent feil")
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId) {
      verifyPayment()
    }
  }, [orderId, dispatch])

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Verifiserer betaling...</span>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container py-16">
        <Card className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Noe gikk galt
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href="/checkout" legacyBehavior>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbake til kassen
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Takk for din bestilling!</h1>
          <p className="text-muted-foreground">
            Ordrenummer: {order.orderId}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-semibold mb-4">Ordredetaljer</h2>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-4">
                <div className="flex justify-between">
                  <span>Frakt</span>
                  <span>{formatPrice(order.shippingAmount)}</span>
                </div>
                <div className="flex justify-between font-bold mt-2">
                  <span>Totalt</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-4">Leveringsadresse</h2>
            <p className="text-muted-foreground">
              {order.shippingAddress.street}<br />
              {order.shippingAddress.postalCode} {order.shippingAddress.city}<br />
              {order.shippingAddress.country}
            </p>
          </div>

          <div className="flex justify-center pt-6">
            <Button asChild>
              <Link href="/products" legacyBehavior>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Fortsett å handle
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Laster betalingsinformasjon...</div>}>
      <PaymentCompletion />
    </Suspense>
  )
} 