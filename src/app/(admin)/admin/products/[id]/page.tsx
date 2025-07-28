import { prisma } from "@/lib/db"
import { ProductForm } from "./components/product-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditProductPage({ params }: PageProps) {
  // Hent produkt med alle relasjoner
  const product = params.id === "new" ? null : await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: true,
      variants: {
        include: {
          color: true
        }
      },
      categories: true
    }
  })

  // Hent kategorier og farger for select-menyer
  const categories = await prisma.category.findMany()
  const colors = await prisma.color.findMany()

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/products" className="flex items-center gap-2" legacyBehavior>
            <ArrowLeft className="h-4 w-4" />
            Tilbake til produkter
          </Link>
        </Button>
      </div>
      <ProductForm 
        initialData={product} 
        categories={categories}
        colors={colors}
      />
    </div>
  );
} 