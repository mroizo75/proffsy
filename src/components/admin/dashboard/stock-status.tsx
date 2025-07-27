import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface StockStatusProps {
  products: any[]
  isLoading: boolean
}

export function StockStatus({ products, isLoading }: StockStatusProps) {
  if (isLoading) {
    return <div>Laster lagerstatus...</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produkt</TableHead>
          <TableHead>Variant</TableHead>
          <TableHead className="text-right">Lager</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((variant) => (
          <TableRow key={variant.id}>
            <TableCell>{variant.product.name}</TableCell>
            <TableCell>{variant.name}</TableCell>
            <TableCell className="text-right">
              <Badge variant={variant.stock <= 5 ? "destructive" : "secondary"}>
                {variant.stock} stk
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 