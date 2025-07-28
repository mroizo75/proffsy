"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Package, ShoppingBag, Users, Settings, Home, Menu, LogOut, User, Percent, Palette } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetTrigger 
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home
  },
  {
    title: "Ordre",
    href: "/admin/orders",
    icon: ShoppingBag
  },
  {
    title: "Produkter",
    href: "/admin/products",
    icon: Package
  },
  {
    title: "Kategorier",
    href: "/admin/categories",
    icon: ShoppingBag
  },
  {
    title: "Tilbud",
    href: "/admin/hero",
    icon: Percent
  },
  {
    title: "Brukere",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Farger",
    href: "/admin/colors",
    icon: Palette
  },
  {
    title: "Instillinger",
    href: "/admin/settings/company",
    icon: Settings
  }
]

interface SidebarNavProps {
  items: typeof sidebarItems
  setOpen?: (open: boolean) => void
  className?: string
}

function SidebarNav({ items, setOpen, className }: SidebarNavProps) {
  const pathname = usePathname()
  
  return (
    <nav className={cn("space-y-2", className)}>
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen?.(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-accent"
            )}>
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Laster...</div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Omdirigerer...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b bg-background z-30 px-4">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            {/* Mobile menu trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden mr-2"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Åpne meny</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0">
                <SheetHeader className="px-6 py-4 border-b">
                  <SheetTitle>Admin Panel</SheetTitle>
                </SheetHeader>
                <div className="px-2 py-4">
                  <SidebarNav 
                    items={sidebarItems} 
                    setOpen={setIsOpen}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <div className="font-semibold">Admin Dashboard</div>
          </div>

          {/* Right side menu items */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Åpne brukermeny</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {session?.user?.name || session?.user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logg ut
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex h-[100vh] pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-shrink-0 border-r bg-card">
          <div className="flex flex-col flex-1 p-6">
            <h2 className="text-lg font-semibold mb-6">Admin Panel</h2>
            <SidebarNav items={sidebarItems} className="flex-1" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 