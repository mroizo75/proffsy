import { Color, Variant as PrismaVariant, Prisma } from "@prisma/client"

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number | Prisma.Decimal
  stock: number
  colorId: string | null
  image?: string | null
  color?: {
    id: string
    name: string
    value: string
  } | null
}

export interface ProductImage {
  id: string
  url: string
  alt: string | null
}

export interface Product {
  id: string
  name: string
  description: string
  price: number | Prisma.Decimal
  sku: string
  stock: number
  images: Array<{
    id: string
    url: string
    alt: string | null
  }>
  variants: ProductVariant[]
  categories: Array<{
    id: string
    name: string
  }>
}

interface ProductDialogProps {
  trigger?: React.ReactNode
  product?: {
    id: string
    name: string
    description: string
    price: number
    sku: string
    stock: number
    colorId?: string | null
    color?: {
      id: string
      name: string
      value: string
    } | null
    categories: { id: string }[]
    images: { url: string }[]
    variants: PrismaVariant[]
  }
}

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  variantId?: string
  variantName?: string
  sku?: string
  stock?: number
}

export interface Color {
  id: string
  name: string
  value: string
} 