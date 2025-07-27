import { prisma } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kategorier | Proffsy",
  description: "Bla gjennom våre produktkategorier"
}

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  })

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Alle kategorier</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link 
            key={category.id}
            href={`/categories/${category.id}`}
            className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-t-lg">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">Ingen bilde</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <ArrowRight className="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {category._count.products} produkt{category._count.products !== 1 ? 'er' : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 