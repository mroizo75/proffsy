import { prisma } from "@/lib/db"
import { ProductGrid } from "@/components/product-grid"
import { ProductFilters } from "@/components/product-filters"
import { ProductSearch } from "@/components/product-search"
import { Suspense } from "react"

interface PageProps {
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

async function getProducts(searchParams: PageProps['searchParams']) {
  // Await searchParams først (Next.js 15+ requirement)
  const params = await searchParams
  const sortParam = String(params.sort || '')

  const where = {
    ...(params.search && {
      OR: [
        { name: { contains: String(params.search) } },
        { description: { contains: String(params.search) } },
      ],
    }),
    ...(params.category && {
      categories: {
        some: {
          slug: String(params.category)
        }
      }
    }),
    ...((params.minPrice || params.maxPrice) && {
      price: {
        ...(params.minPrice && { 
          gte: parseFloat(String(params.minPrice)) 
        }),
        ...(params.maxPrice && { 
          lte: parseFloat(String(params.maxPrice)) 
        }),
      }
    })
  }

  return await prisma.product.findMany({
    where,
    include: {
      images: true,
      categories: true,
    },
    orderBy: {
      ...(sortParam === 'price_asc' && { price: 'asc' }),
      ...(sortParam === 'price_desc' && { price: 'desc' }),
      ...(sortParam === 'newest' && { createdAt: 'desc' }),
      ...(sortParam === '' && { createdAt: 'desc' })
    }
  })
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  })
}

export default async function ProductsPage({
  searchParams,
}: PageProps) {
  const [products, categories] = await Promise.all([
    getProducts(searchParams),
    getCategories()
  ])

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Produkter</h1>
          <ProductSearch />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <ProductFilters categories={categories} />
          <div className="lg:col-span-3">
            <Suspense fallback={<div>Laster produkter...</div>}>
              <ProductGrid products={products} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
} 