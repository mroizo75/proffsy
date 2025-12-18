import { notFound } from "next/navigation"
import { ProductClient } from "./product-client"
import { prisma } from "@/lib/db"
import { Metadata } from "next"

interface ProductPageProps {
  params: Promise<{ id: string }>
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
    
    return product
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  
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
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
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
    product.images = [{ 
      url: "/placeholder.jpg", 
      alt: "Ingen bilde tilgjengelig", 
      id: "placeholder",
      createdAt: new Date(),
      updatedAt: new Date(),
      productId: product.id
    }]
  }

  return <ProductClient product={product} />
} 