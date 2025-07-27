import { notFound } from "next/navigation"
import { ProductClient } from "./product-client"
import { prisma } from "@/lib/db"
import { Metadata } from "next"

interface ProductPageProps {
  params: {
    id: string
  }
}

// Valider produkt ID
function isValidProductId(id: string) {
  return typeof id === 'string' && id.length > 0
}

async function getProduct(id: string) {
  if (!isValidProductId(id)) return null
  
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        categories: true,
        variants: {
          include: {
            color: true
          }
        }
      }
    })

    // Debug logging
    console.log('Raw product data:', JSON.stringify(product, null, 2))
    
    return product
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.id)
  
  if (!product) {
    return {
      title: 'Produkt ikke funnet',
      description: 'Beklager, vi kunne ikke finne dette produktet'
    }
  }

  return {
    title: `${product.name} | Proffsy`,
    description: product.description
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
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

  if (!product) {
    // Håndter tilfeller hvor produktet ikke finnes
    return notFound()
  }
  
  // Sikre at produkt alltid har et bilde
  if (!product.images || product.images.length === 0) {
    product.images = [{ url: "/placeholder.jpg", alt: "Ingen bilde tilgjengelig", id: "placeholder" }]
  }

  return <ProductClient product={product} />
} 