import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"

interface ProductGridProps {
  products: any[]
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="group block"
          legacyBehavior>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Ingen bilde</span>
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-sm">{product.name}</h3>
          
          <div className="mt-1 flex items-center justify-between">
            <p className="font-semibold">
              {formatPrice(product.price)}
            </p>
            
            {product.variants && product.variants.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {product.variants.length} varianter
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
} 