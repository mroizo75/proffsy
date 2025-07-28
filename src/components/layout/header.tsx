"use client"

import Link from "next/link"
import { ShoppingCart, User, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { CartButton } from "@/components/layout/cart-button"
import { UserMenu } from "@/components/layout/user-menu"

const navigation = [
  { name: "Hjem", href: "/" },
  { name: "Produkter", href: "/products" },
  { name: "Kategorier", href: "/categories" },
  { name: "Kontakt", href: "/contact" },
]

export function Header() {
  const { data: session } = useSession()
  const isLoading = false // Vi kan legge til loading-state senere hvis nødvendig

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex flex-1 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" >
            <span className="text-xl font-bold">PROFFSY</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium hover:underline"
                >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-4 pl-4">
            <div className="hidden md:flex relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Søk..."
                className="pl-8 w-[200px] md:w-[300px]"
              />
            </div>
            <ThemeToggle />
            <CartButton />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
} 
