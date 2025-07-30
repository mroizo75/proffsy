"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"
import { 
  Loader2, 
  Package, 
  Eye, 
  Calendar, 
  CreditCard, 
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { nb } from "date-fns/locale"

interface Order {
  id: string
  orderId: string
  total: number
  status: string
  paymentStatus: string
  shippingStatus: string | null
  createdAt: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
}

const getStatusBadge = (status: string, type: 'order' | 'payment' | 'shipping') => {
  const baseClasses = "text-xs font-medium"
  
  if (type === 'order') {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className={baseClasses}>Venter</Badge>
      case 'PROCESSING':
        return <Badge variant="default" className={baseClasses}>Behandles</Badge>
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500 text-white">Fullført</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive" className={baseClasses}>Kansellert</Badge>
      default:
        return <Badge variant="secondary" className={baseClasses}>{status}</Badge>
    }
  }
  
  if (type === 'payment') {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className={baseClasses}>Venter betaling</Badge>
      case 'PAID':
        return <Badge variant="default" className="bg-green-500 text-white">Betalt</Badge>
      case 'FAILED':
        return <Badge variant="destructive" className={baseClasses}>Betaling feilet</Badge>
      default:
        return <Badge variant="secondary" className={baseClasses}>{status}</Badge>
    }
  }
  
  if (type === 'shipping') {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className={baseClasses}>Ikke sendt</Badge>
      case 'PROCESSING':
        return <Badge variant="default" className="bg-orange-500 text-white">Klargjøres</Badge>
      case 'SHIPPED':
        return <Badge variant="default" className="bg-blue-500 text-white">Sendt</Badge>
      case 'IN_TRANSIT':
        return <Badge variant="default" className="bg-blue-600 text-white">Underveis</Badge>
      case 'DELIVERED':
        return <Badge variant="default" className="bg-green-500 text-white">Levert</Badge>
      case 'FAILED_DELIVERY':
        return <Badge variant="destructive" className={baseClasses}>Leveringsfeil</Badge>
      default:
        return status ? <Badge variant="secondary" className={baseClasses}>{status}</Badge> : null
    }
  }
}

const getStatusIcon = (status: string, type: 'order' | 'payment' | 'shipping') => {
  if (type === 'order') {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'PROCESSING':
        return <Package className="h-4 w-4 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }
  
  if (type === 'payment') {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />
    }
  }
  
  if (type === 'shipping') {
    switch (status) {
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return <Truck className="h-4 w-4 text-blue-500" />
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/orders")
      
      if (!response.ok) {
        throw new Error("Kunne ikke hente ordrer")
      }
      
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error("Feil ved henting av ordrer:", error)
      setError(error instanceof Error ? error.message : "Ukjent feil")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Laster ordrer...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Kunne ikke laste ordrer</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchOrders}>
            Prøv igjen
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Mine ordrer</h1>
          <p className="text-gray-600 mt-2">
            Se status på dine bestillinger og spor pakker
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ingen ordrer ennå</h2>
            <p className="text-gray-600 mb-6">
              Du har ikke lagt inn noen bestillinger ennå.
            </p>
            <Button asChild>
              <Link href="/products">
                Start shopping
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  
                  {/* Ordreinfo */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">
                        Ordre #{order.orderId}
                      </h3>
                      {getStatusBadge(order.status, 'order')}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(order.createdAt), "d. MMMM yyyy", { locale: nb })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4" />
                        <span>{order.items.length} vare{order.items.length !== 1 ? 'r' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status og pris */}
                  <div className="flex flex-col lg:items-end space-y-2">
                    <div className="text-xl font-bold">
                      {formatPrice(order.total)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.paymentStatus, 'payment')}
                      {getStatusBadge(order.paymentStatus, 'payment')}
                    </div>
                    
                    {order.shippingStatus && (
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.shippingStatus, 'shipping')}
                        {getStatusBadge(order.shippingStatus, 'shipping')}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Produkter */}
                <div className="space-y-2">
                  <h4 className="font-medium">Produkter:</h4>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sporing */}
                {order.trackingNumber && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <h4 className="font-medium">Sporingsinformasjon:</h4>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Sporingsnummer:</span> {order.trackingNumber}
                          </p>
                          {order.estimatedDelivery && (
                            <p className="text-sm">
                              <span className="font-medium">Forventet levering:</span> {' '}
                              {format(new Date(order.estimatedDelivery), "d. MMMM yyyy", { locale: nb })}
                            </p>
                          )}
                        </div>
                        {order.trackingUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Spor pakke
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Handlinger */}
                <Separator className="my-4" />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Se detaljer
                  </Button>
                  
                  {order.paymentStatus === 'PAID' && order.shippingStatus === 'DELIVERED' && (
                    <Button variant="outline" size="sm">
                      Kjøp igjen
                    </Button>
                  )}
                  
                  {order.status === 'PENDING' && order.paymentStatus === 'PENDING' && (
                    <Button size="sm">
                      Fullfør betaling
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}