import { prisma } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { ProductCard } from "@/components/product-card"
import { Hero } from "@/components/hero"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

async function getProducts() {
  return await prisma.product.findMany({
    take: 8,
    include: {
      images: true,
      categories: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

async function getHero() {
  return await prisma.hero.findFirst({
    where: { active: true }
  })
}

export default async function HomePage() {
  // Sjekk om brukeren er admin og redirect til admin-panel
  const session = await getServerSession(authOptions)
  if (session?.user?.role === "ADMIN") {
    redirect("/admin")
  }

  const [products, hero] = await Promise.all([
    getProducts(),
    getHero()
  ])

  // Legg til en sikkerhetskontroll for hero-data
  const heroProps = hero ? {
    title: hero.title || "Velkommen",
    description: hero.description || null,
    buttonText: hero.buttonText || null,
    buttonLink: hero.buttonLink || null,
    imageUrl: hero.imageUrl || null,
    videoUrl: hero.videoUrl || null,
    isVideo: hero.isVideo || false,
    showText: hero.showText ?? true,
    overlayOpacity: hero.overlayOpacity ?? 0
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {heroProps && <Hero {...heroProps} />}
      <section className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
