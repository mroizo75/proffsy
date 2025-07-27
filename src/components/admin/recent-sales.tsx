import { formatPrice } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface RecentSale {
  id: string
  name: string
  email: string
  amount: number
  date: Date
}

interface RecentSalesProps {
  data: RecentSale[]
}

export function RecentSales({ data }: RecentSalesProps) {
  // Hjelpefunksjon for å få initialene fra et navn
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Hjelpefunksjon for å formatere dato
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      {data.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          Ingen nylige salg å vise
        </div>
      ) : (
        data.map((sale) => (
          <div key={sale.id} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{getInitials(sale.name)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{sale.name}</p>
              <p className="text-sm text-muted-foreground">{sale.email}</p>
              <p className="text-xs text-muted-foreground">{formatDate(sale.date)}</p>
            </div>
            <div className="ml-auto font-semibold">
              {formatPrice(sale.amount)}
            </div>
          </div>
        ))
      )}
    </div>
  )
} 