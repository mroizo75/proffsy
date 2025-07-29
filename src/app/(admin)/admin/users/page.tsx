import { DataTable } from "@/components/ui/data-table"
import { columns } from "./components/columns"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, ShoppingCart, Calendar } from "lucide-react"

// Force dynamic rendering to avoid build-time database calls
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  // Hent alle brukere med ordre-statistikk
  const users = await prisma.user.findMany({
    include: {
      orders: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          orders: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Beregn statistikk
  const totalUsers = users.length
  const adminUsers = users.filter(user => user.role === 'ADMIN').length
  const userswithOrders = users.filter(user => user._count.orders > 0).length
  const newUsersThisMonth = users.filter(user => {
    const thisMonth = new Date()
    thisMonth.setMonth(thisMonth.getMonth())
    return user.createdAt >= new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
  }).length

  // Konverter data for tabellen
  const usersData = users.map(user => ({
    id: user.id,
    name: user.name || 'Ikke oppgitt',
    email: user.email || 'Ingen e-post',
    role: user.role,
    orderCount: user._count.orders,
    totalSpent: user.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    lastOrderDate: user.orders.length > 0 
      ? user.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null,
    createdAt: user.createdAt.toISOString(),
    status: user.orders.length > 0 ? 'ACTIVE' : 'INACTIVE'
  }))

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Brukere</h1>
        
        {/* Statistikk kort */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale brukere</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administratorer</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive kunder</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userswithOrders}</div>
              <p className="text-xs text-muted-foreground">Har lagt inn ordre</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nye denne måneden</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newUsersThisMonth}</div>
            </CardContent>
          </Card>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Badge variant="outline">Alle: {totalUsers}</Badge>
          <Badge variant="default" className="bg-blue-500">👤 Kunder: {totalUsers - adminUsers}</Badge>
          <Badge variant="default" className="bg-purple-500">🛡️ Admins: {adminUsers}</Badge>
          <Badge variant="outline">🛒 Aktive: {userswithOrders}</Badge>
          <Badge variant="outline">😴 Inaktive: {totalUsers - userswithOrders}</Badge>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={usersData}
        searchKey="name"
      />
    </div>
  )
} 