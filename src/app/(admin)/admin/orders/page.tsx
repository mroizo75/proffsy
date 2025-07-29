import { DataTable } from "@/components/ui/data-table"
import { columns } from "./components/columns"
import { prisma } from "@/lib/db"
import { formatPrice, sanitizeOrder } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default async function AdminOrdersPage() {
  // Hent ordrer og konverter Decimal verdier til numbers
  const orders = await prisma.order.findMany({
    include: {
      items: true,
      shippingAddress: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Konverter alle Decimal verdier til numbers før de sendes til klienten
  const sanitizedOrders = orders.map(order => ({
    ...sanitizeOrder(order),
    // Sett betalingsstatus basert på ordredata
    paymentStatus: order.paymentId && order.status !== "CANCELLED" ? "PAID" : 
                  order.status === "CANCELLED" ? "FAILED" : "PENDING",
    // Inkluder shipping og tracking informasjon
    shippingStatus: order.shippingStatus || "PENDING",
    paymentId: order.paymentId,
    trackingNumber: order.trackingNumber
  }))

  const processingOrders = orders.filter(o => o.shippingStatus === "PROCESSING")
  const shippedOrders = orders.filter(o => o.shippingStatus === "SHIPPED" || o.shippingStatus === "IN_TRANSIT" || o.shippingStatus === "OUT_FOR_DELIVERY")
  const deliveredOrders = orders.filter(o => o.shippingStatus === "DELIVERED")

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Ordrer</h1>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">Alle: {orders.length}</Badge>
          <Badge variant="outline">Betalt: {orders.filter(o => o.paymentId && o.status !== "CANCELLED").length}</Badge>
          <Badge variant="outline">Venter betaling: {orders.filter(o => !o.paymentId && o.status !== "CANCELLED").length}</Badge>
          <Badge variant="default" className="bg-orange-500">⚡ Klar for sending: {processingOrders.length}</Badge>
          <Badge variant="outline">🚚 Sendt: {shippedOrders.length}</Badge>
          <Badge variant="outline">✅ Levert: {deliveredOrders.length}</Badge>
          <Badge variant="outline">❌ Kansellert: {orders.filter(o => o.status === "CANCELLED").length}</Badge>
        </div>
        
        {processingOrders.length > 0 && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">⚡ {processingOrders.length} ordre(r) klar for sending</h3>
            <p className="text-sm text-orange-700">
              Disse ordrene er betalt og venter på at du legger til sporingsnummer og sender dem.
            </p>
          </div>
        )}
      </div>
      
      <DataTable 
        columns={columns} 
        data={sanitizedOrders}
        searchKey="orderId"
      />
    </div>
  )
} 