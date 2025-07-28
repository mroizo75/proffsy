import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { ProductGrid } from "@/components/products/product-grid"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface CategoryPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { id: params.id }
  })
  
  if (!category) {
    return {
      title: 'Kategori ikke funnet',
      description: 'Beklager, vi kunne ikke finne denne kategorien'
    }
  }

  return {
    title: `${category.name} | Proffsy`,
    description: category.description || `Bla gjennom alle produkter i kategorien ${category.name}`
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: {
      products: {
        include: {
          images: true,
          variants: true
        }
      }
    }
  })

  if (!category) {
    return notFound()
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <Link
          href="/categories"
          className="flex items-center text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
          legacyBehavior>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Tilbake til kategorier
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-muted-foreground max-w-2xl">{category.description}</p>
          )}
        </div>
      </div>
      {category.products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ingen produkter i denne kategorien ennå.</p>
        </div>
      ) : (
        <ProductGrid products={category.products} />
      )}
    </div>
  );
} 