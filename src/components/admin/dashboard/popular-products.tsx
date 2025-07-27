import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"

interface PopularProductsProps {
  products: any[]
  isLoading: boolean
}

export function PopularProducts({ products, isLoading }: PopularProductsProps) {
  if (isLoading) {
    return <div>Laster produkter...</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produkt</TableHead>
          <TableHead>Pris</TableHead>
          <TableHead className="text-right">Varianter</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>{product.name}</TableCell>
            <TableCell>{formatPrice(product.price)}</TableCell>
            <TableCell className="text-right">
              {product._count.variants}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 