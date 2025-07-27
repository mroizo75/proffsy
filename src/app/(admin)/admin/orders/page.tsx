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
                  order.status === "CANCELLED" ? "FAILED" : "PENDING"
  }))

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Ordrer</h1>
        <div className="flex gap-2">
          <Badge variant="outline">Alle: {orders.length}</Badge>
          <Badge variant="outline">Betalt: {orders.filter(o => o.paymentId && o.status !== "CANCELLED").length}</Badge>
          <Badge variant="outline">Venter: {orders.filter(o => !o.paymentId && o.status !== "CANCELLED").length}</Badge>
          <Badge variant="outline">Kansellert: {orders.filter(o => o.status === "CANCELLED").length}</Badge>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={sanitizedOrders}
        searchKey="orderId"
      />
    </div>
  )
} 