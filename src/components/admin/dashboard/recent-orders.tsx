import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { format } from "date-fns"
import { nb } from "date-fns/locale"

interface RecentOrdersProps {
  orders: any[]
  isLoading: boolean
}

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  if (isLoading) {
    return <div>Laster ordre...</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dato</TableHead>
          <TableHead>Kunde</TableHead>
          <TableHead className="text-right">Beløp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              {format(new Date(order.createdAt), "d. MMM", { locale: nb })}
            </TableCell>
            <TableCell>{order.user.name}</TableCell>
            <TableCell className="text-right">
              {formatPrice(order.total)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 