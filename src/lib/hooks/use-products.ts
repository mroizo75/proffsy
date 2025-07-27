import useSWR, { mutate } from "swr"

// Definer alle nødvendige typer
interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

interface Image {
  id: string
  url: string
  alt?: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
  stock: number
  categories: Category[]
  images: Image[]
  createdAt: string
  updatedAt: string
}

interface ProductsResponse {
  products: Product[]
  total: number
}

const PRODUCTS_KEY = "/api/admin/products"

// Fetcher funksjon for SWR
async function fetchProducts(url: string): Promise<Product[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Kunne ikke hente produkter")
  }
  const data = await response.json()
  return data
}

export function useProducts(options = {}) {
  const { data, error, mutate } = useSWR(
    PRODUCTS_KEY,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000, // Dedup requests within 10 seconds
      ...options
    }
  )

  return {
    products: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}

// Helper for å manuelt oppdatere produkter
export const mutateProducts = () => mutate(PRODUCTS_KEY)

// Helper for å oppdatere et enkelt produkt
export const mutateProduct = async (productId: string) => {
  await mutate(
    PRODUCTS_KEY,
    async (products: Product[] | undefined) => {
      if (!products) return products

      const response = await fetch(`${PRODUCTS_KEY}/${productId}`)
      if (!response.ok) return products

      const updatedProduct = await response.json()
      return products.map(product => 
        product.id === productId ? updatedProduct : product
      )
    },
    { revalidate: false }
  )
}

// Helper for å slette et produkt fra cache
export const removeProductFromCache = (productId: string) => {
  return mutate(
    PRODUCTS_KEY,
    (products: Product[] | undefined) => {
      if (!products) return products
      return products.filter(product => product.id !== productId)
    },
    { revalidate: false }
  )
} 