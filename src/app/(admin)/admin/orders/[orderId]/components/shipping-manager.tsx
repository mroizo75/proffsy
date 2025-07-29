"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Package, Send, Truck, MapPin } from "lucide-react"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const carriers = [
  { value: "PostNord", label: "PostNord" },
  { value: "Bring", label: "Bring/Posten" },
  { value: "DHL", label: "DHL" },
  { value: "UPS", label: "UPS" },
  { value: "FedEx", label: "FedEx" },
  { value: "Other", label: "Annen" }
]

const shippingStatuses = [
  { value: "PROCESSING", label: "Klar for sending", color: "bg-orange-500" },
  { value: "SHIPPED", label: "Sendt", color: "bg-blue-500" },
  { value: "IN_TRANSIT", label: "På vei", color: "bg-blue-600" },
  { value: "OUT_FOR_DELIVERY", label: "Ute på levering", color: "bg-purple-500" },
  { value: "DELIVERED", label: "Levert", color: "bg-green-500" },
  { value: "FAILED_DELIVERY", label: "Leveringsfeil", color: "bg-red-500" },
]

export function ShippingManager({ order }: { order: any }) {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "")
  const [carrier, setCarrier] = useState(order.carrier || "PostNord")
  const [shippingStatus, setShippingStatus] = useState(order.shippingStatus || "PROCESSING")
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | undefined>(
    order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined
  )
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const canShip = order.status === "COMPLETED" && order.paymentStatus === "PAID"
  const hasShippingInfo = trackingNumber && carrier

  async function handleSaveShipping() {
    if (!trackingNumber.trim()) {
      toast.error("Sporingsnummer er påkrevd")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/orders/${order.orderId}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          carrier,
          shippingStatus,
          estimatedDelivery: estimatedDelivery?.toISOString(),
          shippingMethod: order.shippingMethod,
          shippingLocation: order.shippingLocation
        })
      })

      if (!response.ok) throw new Error("Feil ved lagring")

      toast.success("Shipping-informasjon lagret!")
      window.location.reload() // Refresh to show updated data
    } catch (error) {
      toast.error("Kunne ikke lagre shipping-informasjon")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSendShippingEmail() {
    if (!hasShippingInfo) {
      toast.error("Legg til sporingsnummer først")
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch(`/api/orders/${order.orderId}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationType: "SHIPPED"
        })
      })

      if (!response.ok) throw new Error("Feil ved sending av e-post")

      toast.success("📧 Shipping e-post sendt til kunden!")
    } catch (error) {
      toast.error("Kunne ikke sende e-post")
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (!canShip) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ordre må være betalt og fullført før den kan sendes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Sending & Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center gap-2">
          <Label>Status:</Label>
          <Badge className={shippingStatuses.find(s => s.value === shippingStatus)?.color}>
            {shippingStatuses.find(s => s.value === shippingStatus)?.label}
          </Badge>
        </div>

        {/* Shipping Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tracking Number */}
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Sporingsnummer *</Label>
            <Input
              id="trackingNumber"
              placeholder="f.eks. RN123456789NO"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          {/* Carrier */}
          <div className="space-y-2">
            <Label>Transportør</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((carrier) => (
                  <SelectItem key={carrier.value} value={carrier.value}>
                    {carrier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shipping Status */}
          <div className="space-y-2">
            <Label>Shipping Status</Label>
            <Select value={shippingStatus} onValueChange={setShippingStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {shippingStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Delivery */}
          <div className="space-y-2">
            <Label>Estimert levering</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !estimatedDelivery && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {estimatedDelivery ? format(estimatedDelivery, "PPP", { locale: nb }) : "Velg dato"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={estimatedDelivery}
                  onSelect={setEstimatedDelivery}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Shipping Method & Location (if pickup) */}
        {order.shippingMethod && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4" />
              <span className="font-medium">{order.shippingMethod}</span>
            </div>
            {order.shippingLocation && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <div>
                  <div>{order.shippingLocation.name}</div>
                  <div>{order.shippingLocation.address}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notater (valgfritt)</Label>
          <Textarea
            id="notes"
            placeholder="Interne notater om sending..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSaveShipping}
            disabled={isSaving || !trackingNumber.trim()}
            className="flex-1"
          >
            {isSaving ? "Lagrer..." : "💾 Lagre info"}
          </Button>
          
          <Button
            onClick={handleSendShippingEmail}
            disabled={isSendingEmail || !hasShippingInfo}
            variant="outline"
            className="flex-1"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSendingEmail ? "Sender..." : "📧 Send e-post"}
          </Button>
        </div>

        {/* Tracking Link */}
        {trackingNumber && carrier === "PostNord" && (
          <div className="pt-2 border-t">
            <Label>Tracking-link:</Label>
            <div className="mt-1">
              <a
                href={`https://www.postnord.no/sporing#/s=${trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                https://www.postnord.no/sporing#/s={trackingNumber}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 