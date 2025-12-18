"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/lib/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ShippingRate, CustomerInfo } from "@/types/checkout"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ShippingOptionsList } from "@/components/checkout/shipping-group"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [shippingError, setShippingError] = useState<string>()
  const [shippingSource, setShippingSource] = useState<string>()

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CustomerInfo>({
    resolver: zodResolver(customerSchema)
  })

  const watchedAddress = watch("address")

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
    setShippingError(undefined)
    setShippingRates([])
    setSelectedShipping(undefined)
    
    try {
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items,
          toAddress: data.address
        })
      })
      
      if (!response.ok) {
        throw new Error("Feil ved henting av fraktpriser")
      }
      
      const result = await response.json()
      
      // Shipping API returnerer: { rates: [...], carrier: "PostNord", currency: "NOK", source: "..." }
      if (result.rates && Array.isArray(result.rates) && result.rates.length > 0) {
        setShippingRates(result.rates)
        setShippingSource(result.source)
        
        
        // Auto-select cheapest home delivery if available
        const homeDelivery = result.rates.find((rate: ShippingRate) => rate.type === 'home')
        if (homeDelivery) {
          setSelectedShipping(homeDelivery)
        }
      } else {
        throw new Error("Ingen fraktmuligheter funnet")
      }
    } catch (error) {
      setShippingError(error instanceof Error ? error.message : "Feil ved beregning av frakt")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async (data: CustomerInfo) => {
    if (!selectedShipping) return

    try {
      setIsLoading(true)
      
      const paymentData = {
        items: items,
        shipping: selectedShipping,
        customerInfo: data,
        amount: subtotal + selectedShipping.price
      }
      

      
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Betalingsfeil: ${response.status}`)
      }
      
      const { checkoutUrl } = await response.json()
      if (!checkoutUrl) {
        throw new Error("Fikk ikke gyldig checkout URL fra Nets")
      }
      
      window.location.href = checkoutUrl
    } catch (error) {
      alert(`Feil ved opprettelse av betaling: ${error instanceof Error ? error.message : 'Ukjent feil'}`)
    } finally {
      setIsLoading(false)
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

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Henter leveringsalternativer...
                  </>
                ) : (
                  "Finn leveringsalternativer"
                )}
              </Button>
            </form>
          </Card>

          {/* Shipping error */}
          {shippingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{shippingError}</AlertDescription>
            </Alert>
          )}

          {/* Shipping success with PostNord info */}
          {shippingRates.length > 0 && (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Fant {shippingRates.length} leveringsalternativer{" "}
                  {shippingSource === 'postnord-api' && (
                    <span className="text-green-600 font-medium">
                      (Live data fra PostNord ✓)
                    </span>
                  )}
                  {shippingSource === 'fallback' && (
                    <span className="text-amber-600 font-medium">
                      (Standardpriser)
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Velg leveringsmetode</h2>
                <ShippingOptionsList
                  options={shippingRates}
                  selectedOptionId={selectedShipping?.id}
                  onSelectOption={setSelectedShipping}
                />
              </Card>
            </>
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

              {/* Selected shipping details */}
              {selectedShipping?.location && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Valgt hentested:</h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{selectedShipping.location.name}</p>
                    <p className="text-muted-foreground">
                      {selectedShipping.location.address.streetName} {selectedShipping.location.address.streetNumber}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedShipping.location.address.postCode} {selectedShipping.location.address.city}
                    </p>
                    {selectedShipping.location.distanceFromRecipientAddress && (
                      <p className="text-xs text-muted-foreground">
                        📍 {selectedShipping.location.distanceFromRecipientAddress < 1000 
                          ? `${selectedShipping.location.distanceFromRecipientAddress}m`
                          : `${(selectedShipping.location.distanceFromRecipientAddress / 1000).toFixed(1)}km`} unna
                      </p>
                    )}
                  </div>
                </div>
              )}
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