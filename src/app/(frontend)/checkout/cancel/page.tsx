"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ShoppingCart, ArrowLeft } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

export default function CheckoutCancelPage() {
  const router = useRouter()
  const { items, getSubtotal } = useCart()
  const subtotal = getSubtotal()

  useEffect(() => {
    // Redirect til cart hvis ingen varer
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items.length, router])

  if (items.length === 0) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Betaling kansellert</h1>
          <p className="text-gray-600 mb-6">
            Din betaling ble kansellert, men handlekurven din er nå tom.
          </p>
          <Button asChild>
            <Link href="/products">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Fortsett shopping
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Betaling kansellert</h1>
          <p className="text-gray-600">
            Din betaling ble avbrutt. Dine varer er fortsatt i handlekurven.
          </p>
        </div>

        {/* Alert */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Hva skjedde?</strong> Du valgte å avbryte betalingen eller det oppstod et problem med betalingsprosessen. 
            Ingen penger er trukket fra kontoen din.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Varer i kurv */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dine varer</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  *Frakt beregnes i neste steg
                </p>
              </div>
            </div>
          </Card>

          {/* Handlingsalternativer */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Hva vil du gjøre?</h2>
            <div className="space-y-4">
              
              {/* Prøv betaling igjen */}
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">
                  Prøv betaling igjen
                </Link>
              </Button>
              
              {/* Gå tilbake til kurv */}
              <Button asChild variant="outline" className="w-full">
                <Link href="/cart">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tilbake til handlekurv
                </Link>
              </Button>
              
              {/* Fortsett shopping */}
              <Button asChild variant="ghost" className="w-full">
                <Link href="/products">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Fortsett shopping
                </Link>
              </Button>
            </div>

            {/* Hjelp informasjon */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Trenger du hjelp?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Hvis du opplever problemer med betalingen, kan du:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Prøve et annet betalingskort</li>
                <li>• Sjekke at kortet har tilstrekkelig saldo</li>
                <li>• Kontakte banken din</li>
                <li>• Ta kontakt med vår kundeservice</li>
              </ul>
              
              <Button asChild variant="link" className="p-0 h-auto mt-2">
                <Link href="/contact">
                  Kontakt kundeservice →
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}