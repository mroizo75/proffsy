import { prisma } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"

interface RelatedProductsProps {
  categoryIds: string[]
  currentProductId: string
}

export async function RelatedProducts({ categoryIds, currentProductId }: RelatedProductsProps) {
  const products = await prisma.product.findMany({
    where: {
      categories: {
        some: {
          id: {
            in: categoryIds
          }
        }
      },
      NOT: {
        id: currentProductId
      }
    },
    include: {
      images: true
    },
    take: 4
  })

  if (products.length === 0) return null

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Du vil kanskje også like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group">
            <div className="aspect-square relative rounded-lg overflow-hidden mb-3">
              <Image
                src={product.images[0]?.url || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="(min-width: 1024px) 25vw, 50vw"
              />
            </div>
            <h3 className="font-medium mb-1">{product.name}</h3>
            <p className="text-muted-foreground">
              {formatPrice(product.price)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
} 