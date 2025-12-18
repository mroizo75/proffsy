"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/hooks/use-cart"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { 
  Loader2, 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Eye,
  AlertCircle,
  Plus,
  Package
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface WishlistItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    price: number
    stock: number
    images?: Array<{
      url: string
      alt?: string
    }>
    slug: string
  }
  createdAt: string
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addItem } = useCart()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchWishlist()
    }
  }, [session])

  const fetchWishlist = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/wishlist")
      
      if (!response.ok) {
        throw new Error("Kunne ikke hente ønskeliste")
      }
      
      const data = await response.json()
      setWishlistItems(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ukjent feil")
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    try {
      setIsUpdating(productId)
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error("Kunne ikke fjerne fra ønskeliste")
      }

      setWishlistItems(prev => prev.filter(item => item.productId !== productId))
      toast.success("Fjernet fra ønskeliste")
    } catch (error) {
      toast.error("Kunne ikke fjerne fra ønskeliste")
    } finally {
      setIsUpdating(undefined)
    }
  }

  const addToCart = async (item: WishlistItem) => {
    try {
      setIsUpdating(item.productId)
      
      addItem({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.images?.[0]?.url || ''
      })
      
      toast.success(`${item.product.name} lagt til i handlekurv`)
    } catch (error) {
      toast.error("Kunne ikke legge til i handlekurv")
    } finally {
      setIsUpdating(undefined)
    }
  }

  const addAllToCart = async () => {
    try {
      setIsLoading(true)
      
      wishlistItems.forEach(item => {
        if (item.product.stock > 0) {
          addItem({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.images?.[0]?.url || ''
          })
        }
      })
      
      toast.success("Alle tilgjengelige produkter lagt til i handlekurv")
    } catch (error) {
      toast.error("Kunne ikke legge alle produkter til i handlekurv")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Laster ønskeliste...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Kunne ikke laste ønskeliste</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchWishlist}>
            Prøv igjen
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Min ønskeliste</h1>
            <p className="text-gray-600 mt-2">
              {wishlistItems.length} produkt{wishlistItems.length !== 1 ? 'er' : ''} i ønskelisten
            </p>
          </div>
          
          {wishlistItems.length > 0 && (
            <Button onClick={addAllToCart}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Legg alle i handlekurv
            </Button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="p-8 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tom ønskeliste</h2>
            <p className="text-gray-600 mb-6">
              Du har ikke lagt til noen produkter i ønskelisten ennå.
            </p>
            <Button asChild>
              <Link href="/products">
                <Plus className="h-4 w-4 mr-2" />
                Utforsk produkter
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                
                {/* Produktbilde */}
                <div className="aspect-square relative bg-gray-100">
                  {item.product.images?.[0]?.url ? (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.product.images[0].alt || item.product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Fjern-knapp */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromWishlist(item.productId)}
                    disabled={isUpdating === item.productId}
                  >
                    {isUpdating === item.productId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Produktinfo */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xl font-bold">
                        {formatPrice(item.product.price)}
                      </span>
                      {item.product.stock > 0 ? (
                        <Badge variant="default" className="bg-green-500 text-white">
                          På lager
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Utsolgt
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Handlinger */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => addToCart(item)}
                      disabled={item.product.stock === 0 || isUpdating === item.productId}
                    >
                      {isUpdating === item.productId ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Legger til...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Legg i handlekurv
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/products/${item.product.slug || item.product.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Se produkt
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info om ønskeliste */}
        {wishlistItems.length > 0 && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Tips om ønskelisten</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Produkter i ønskelisten din lagres automatisk. Du kan enkelt legge dem til i handlekurven når du er klar til å kjøpe.
                  Hvis et produkt går ned i pris eller blir tilgjengelig igjen, får du beskjed på e-post.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}