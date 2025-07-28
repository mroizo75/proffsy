import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  CreditCard, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users 
} from "lucide-react"
import { Overview } from "@/components/admin/overview"
import { RecentSales } from "@/components/admin/recent-sales"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard | Proffsy",
  description: "Administrator-dashbord for Proffsy"
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login")
  }

  // Hent dagens dato og datoen for 30 dager siden
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0)

  // Hent omsetning for gjeldende måned
  const currentMonthOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startOfMonth
      }
    },
    include: {
      items: true,
      user: true
    }
  })

  // Hent omsetning for forrige måned
  const previousMonthOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startOfPrevMonth,
        lt: startOfMonth
      }
    },
    include: {
      items: true
    }
  })

  // Beregn totaler
  const currentMonthRevenue = currentMonthOrders.reduce((total, order) => {
    return total + order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
  }, 0)

  const previousMonthRevenue = previousMonthOrders.reduce((total, order) => {
    return total + order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
  }, 0)

  // Beregn prosentvis endring
  const revenueChange = previousMonthRevenue === 0 
    ? 100 
    : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100

  // Hent antall ordre i gjeldende måned
  const currentMonthOrderCount = currentMonthOrders.length
  const previousMonthOrderCount = previousMonthOrders.length
  const orderChange = previousMonthOrderCount === 0 
    ? 100 
    : ((currentMonthOrderCount - previousMonthOrderCount) / previousMonthOrderCount) * 100

  // Hent antall nye kunder i gjeldende måned
  const newCustomers = await prisma.user.count({
    where: {
      createdAt: {
        gte: startOfMonth
      }
    }
  })

  const previousMonthNewCustomers = await prisma.user.count({
    where: {
      createdAt: {
        gte: startOfPrevMonth,
        lt: startOfMonth
      }
    }
  })

  const customerChange = previousMonthNewCustomers === 0 
    ? 100 
    : ((newCustomers - previousMonthNewCustomers) / previousMonthNewCustomers) * 100

  // Hent produktsalg for gjeldende måned
  const productSales = await prisma.orderItem.count({
    where: {
      order: {
        createdAt: {
          gte: startOfMonth
        }
      }
    }
  })

  const previousMonthProductSales = await prisma.orderItem.count({
    where: {
      order: {
        createdAt: {
          gte: startOfPrevMonth,
          lt: startOfMonth
        }
      }
    }
  })

  const salesChange = previousMonthProductSales === 0 
    ? 100 
    : ((productSales - previousMonthProductSales) / previousMonthProductSales) * 100

  // Hent ordre for grafen (siste 30 dager)
  const last30DaysOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      }
    },
    include: {
      items: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  // Beregn daglig omsetning for siste 30 dager
  const dailyRevenue = new Map()

  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    dailyRevenue.set(dateStr, 0)
  }

  last30DaysOrders.forEach(order => {
    const dateStr = order.createdAt.toISOString().split('T')[0]
    const orderTotal = order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
    const currentTotal = dailyRevenue.get(dateStr) || 0
    dailyRevenue.set(dateStr, currentTotal + orderTotal)
  })

  const graphData = Array.from(dailyRevenue.entries()).map(([date, total]) => ({
    name: date,
    total: total
  }))

  // Hent nylige ordre
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: true,
      items: true
    }
  })

  const recentSalesData = recentOrders.map(order => ({
    id: order.id,
    name: order.user?.name || 'Ukjent kunde',
    email: order.user?.email || 'Ingen e-post',
    amount: order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0),
    date: order.createdAt
  }))

  return (
    <div className="p-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Omsetning
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(currentMonthRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueChange >= 0 ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpIcon className="mr-1 h-4 w-4" />
                  {revenueChange.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownIcon className="mr-1 h-4 w-4" />
                  {Math.abs(revenueChange).toFixed(1)}%
                </span>
              )}
              {" "}fra forrige måned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bestillinger
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{currentMonthOrderCount}</div>
            <p className="text-xs text-muted-foreground">
              {orderChange >= 0 ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpIcon className="mr-1 h-4 w-4" />
                  {orderChange.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownIcon className="mr-1 h-4 w-4" />
                  {Math.abs(orderChange).toFixed(1)}%
                </span>
              )}
              {" "}fra forrige måned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nye kunder
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {customerChange >= 0 ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpIcon className="mr-1 h-4 w-4" />
                  {customerChange.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownIcon className="mr-1 h-4 w-4" />
                  {Math.abs(customerChange).toFixed(1)}%
                </span>
              )}
              {" "}fra forrige måned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Solgte produkter
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{productSales}</div>
            <p className="text-xs text-muted-foreground">
              {salesChange >= 0 ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpIcon className="mr-1 h-4 w-4" />
                  {salesChange.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownIcon className="mr-1 h-4 w-4" />
                  {Math.abs(salesChange).toFixed(1)}%
                </span>
              )}
              {" "}fra forrige måned
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Oversikt</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={graphData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Nylige salg</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSales data={recentSalesData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 