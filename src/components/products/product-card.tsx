import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    imageUrls: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative rounded-lg border bg-background p-2">
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-square">
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          <Image
            src={product.imageUrls.split(",")[0]} // Tar første bilde fra imageUrls
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium line-clamp-1 group-hover:underline">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-medium">{formatPrice(product.price)}</span>
          <Button size="icon" variant="secondary">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 