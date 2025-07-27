import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { prisma } from "@/lib/db"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 0,
  }).format(price)
}

export async function generateOrderNumber() {
  // Hent dagens dato i format YYYYMMDD
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  
  // Finn høyeste ordrenummer for dagens dato
  const latestOrder = await prisma.order.findFirst({
    where: {
      orderId: {
        startsWith: today
      }
    },
    orderBy: {
      orderId: 'desc'
    }
  })

  // Hvis ingen ordre finnes for i dag, start på 001
  // Hvis ordre finnes, øk sekvensnummeret med 1
  const sequence = latestOrder
    ? String(Number(latestOrder.orderId.slice(-3)) + 1).padStart(3, '0')
    : '001'

  // Returner ordrenummer i format YYYYMMDD-XXX
  return `${today}-${sequence}`
}

// Hjelpefunksjon for å sjekke om noe er et Decimal objekt
function isDecimal(value: any): boolean {
  return value !== null && 
         typeof value === 'object' && 
         'toString' in value &&
         !('length' in value) && // Ikke array
         !('getTime' in value)   // Ikke Date
}

export function sanitizeData<T>(obj: T): any {
  // Håndter null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Håndter primitiver
  if (typeof obj !== 'object') {
    return obj;
  }

  // Håndter Date objekter
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Håndter arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item));
  }

  // Håndter Decimal og andre objekter
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isDecimal(value)) {
      result[key] = Number(value.toString());
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => sanitizeData(item));
    } else if (value !== null && typeof value === 'object') {
      result[key] = sanitizeData(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

interface PrismaDecimal {
  toString(): string
}

export function sanitizeOrder(order: any) {
  if (!order) return null;

  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    shippingAmount: Number(order.shippingAmount),
    items: order.items?.map((item: any) => ({
      ...item,
      price: Number(item.price),
      createdAt: item.createdAt?.toISOString(),
    })),
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt?.toISOString(),
    updatedAt: order.updatedAt?.toISOString(),
  };
}

export function sanitizeProduct(product: any) {
  if (!product) return null;

  return {
    ...product,
    price: Number(product.price),
    weight: product.weight ? Number(product.weight) : null,
    length: product.length ? Number(product.length) : null,
    width: product.width ? Number(product.width) : null,
    height: product.height ? Number(product.height) : null,
    createdAt: product.createdAt?.toISOString(),
    updatedAt: product.updatedAt?.toISOString(),
  };
}

export function sanitizeProducts(products: any[]) {
  return products.map(product => sanitizeProduct(product));
}

export function getImageUrl(path: string) {
  if (path.startsWith('http')) return path
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${path}`
}
