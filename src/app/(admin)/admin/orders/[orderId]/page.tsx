import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatPrice } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrderStatusSelect } from "./components/order-status-select"
import { PrintShippingLabel } from "./components/print-shipping-label"
import { Separator } from "@/components/ui/separator"
import { sanitizeOrder } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type OrderDetailPageProps = {
  params: Promise<{
    orderId: string
  }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Await params for å få tilgang til orderId
  const { orderId } = await params

  const order = await prisma.order.findUnique({
    where: { orderId },
    include: {
      items: true,
      shippingAddress: true,
    }
  })

  if (!order) {
    notFound()
  }

  // Konverter Decimal verdier til numbers
  const sanitizedOrder = sanitizeOrder(order)

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/orders" className="flex items-center gap-2" legacyBehavior>
            <ArrowLeft className="h-4 w-4" />
            Tilbake til ordrer
          </Link>
        </Button>
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ordre #{sanitizedOrder.orderId}</h1>
        <div className="flex gap-4">
          <OrderStatusSelect order={sanitizedOrder} />
          <PrintShippingLabel order={sanitizedOrder} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Kundedetaljer</h2>
          <div className="space-y-2">
            <p><strong>E-post:</strong> {sanitizedOrder.customerEmail}</p>
            <p><strong>Telefon:</strong> {sanitizedOrder.customerPhone}</p>
          </div>

          <Separator className="my-4" />

          <h2 className="text-xl font-semibold mb-4">Leveringsadresse</h2>
          <div className="space-y-2">
            <p>{sanitizedOrder.shippingAddress?.street}</p>
            <p>{sanitizedOrder.shippingAddress?.postalCode} {sanitizedOrder.shippingAddress?.city}</p>
            <p>{sanitizedOrder.shippingAddress?.country}</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Ordredetaljer</h2>
          <div className="space-y-4">
            {sanitizedOrder.items.map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Antall: {item.quantity}</p>
                </div>
                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Frakt</span>
                <span>{formatPrice(sanitizedOrder.shippingAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(sanitizedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 