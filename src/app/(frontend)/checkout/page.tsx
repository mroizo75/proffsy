"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/lib/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ShippingRate, CustomerInfo } from "@/types/checkout"
import { Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

const customerSchema = z.object({
  firstName: z.string().min(2, "Fornavn må være minst 2 tegn"),
  lastName: z.string().min(2, "Etternavn må være minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  phone: z.string().min(8, "Telefonnummer må være minst 8 siffer"),
  address: z.object({
    street: z.string().min(2, "Gateadresse må være minst 2 tegn"),
    postalCode: z.string().length(4, "Postnummer må være 4 siffer"),
    city: z.string().min(2, "By må være minst 2 tegn"),
    country: z.string().default("NO"),
  }),
})

export default function CheckoutPage() {
  const { items, getSubtotal } = useCart()
  const subtotal = getSubtotal()
  const router = useRouter()
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate>()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<CustomerInfo>({
    resolver: zodResolver(customerSchema)
  })

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items.length, router])

  if (items.length === 0) {
    return null
  }

  const calculateShipping = async (data: CustomerInfo) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items,
          toAddress: data.address
        })
      })
      
      if (!response.ok) throw new Error("Feil ved henting av fraktpriser")
      
      const rates = await response.json()
      setShippingRates(rates)
    } catch (error) {
      console.error("Shipping calculation error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async (data: CustomerInfo) => {
    if (!selectedShipping) return

    try {
      setIsLoading(true)
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items,
          shipping: selectedShipping,
          customerInfo: data,
          amount: subtotal + selectedShipping.price
        })
      })

      if (!response.ok) throw new Error("Betalingsfeil")
      
      const { checkoutUrl } = await response.json()
      window.location.href = checkoutUrl
    } catch (error) {
      console.error("Payment error:", error)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Kasse</h1>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Kundeinfo og frakt */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Leveringsinformasjon</h2>
            <form onSubmit={handleSubmit(calculateShipping)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input 
                    {...register("firstName")} 
                    placeholder="Fornavn" 
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input 
                    {...register("lastName")} 
                    placeholder="Etternavn" 
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Input 
                  {...register("email")} 
                  type="email" 
                  placeholder="E-post" 
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input 
                  {...register("phone")} 
                  placeholder="Telefon" 
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input 
                  {...register("address.street")} 
                  placeholder="Gateadresse" 
                />
                {errors.address?.street && (
                  <p className="text-sm text-red-500">{errors.address.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input 
                    {...register("address.postalCode")} 
                    placeholder="Postnummer" 
                  />
                  {errors.address?.postalCode && (
                    <p className="text-sm text-red-500">{errors.address.postalCode.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input 
                    {...register("address.city")} 
                    placeholder="By" 
                  />
                  {errors.address?.city && (
                    <p className="text-sm text-red-500">{errors.address.city.message}</p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Beregner frakt...
                  </>
                ) : (
                  "Beregn frakt"
                )}
              </Button>
            </form>
          </Card>

          {shippingRates.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Velg fraktmetode</h2>
              <RadioGroup
                value={selectedShipping?.id}
                onValueChange={(value) => 
                  setSelectedShipping(shippingRates.find(rate => rate.id === value))
                }
              >
                <div className="space-y-4">
                  {shippingRates.map((rate) => (
                    <div key={rate.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={rate.id} id={rate.id} />
                      <label htmlFor={rate.id} className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <span className="font-medium">{rate.name}</span>
                            <p className="text-sm text-muted-foreground">
                              {rate.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rate.estimatedDelivery}
                            </p>
                          </div>
                          <span className="font-medium">
                            {formatPrice(rate.price)}
                          </span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </Card>
          )}
        </div>

        {/* Ordresammendrag */}
        <div className="lg:col-span-4">
          <Card className="p-6 sticky top-8">
            <h2 className="text-xl font-semibold mb-4">Ordresammendrag</h2>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.image && (
                    <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Antall: {item.quantity}
                    </p>
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {selectedShipping && (
                  <div className="flex justify-between text-sm">
                    <span>Frakt ({selectedShipping.name})</span>
                    <span>{formatPrice(selectedShipping.price)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg pt-2 border-t">
                  <span>Totalt</span>
                  <span>
                    {formatPrice(subtotal + (selectedShipping?.price || 0))}
                  </span>
                </div>
              </div>
            </div>

            {selectedShipping && (
              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleSubmit(handlePayment)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Behandler...
                  </>
                ) : (
                  "Gå til betaling"
                )}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 