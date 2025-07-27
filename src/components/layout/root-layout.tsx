"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { usePathname } from "next/navigation"

export function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminRoute && <Header />}
      <main className="flex-1">{children}</main>
      {!isAdminRoute && <Footer />}
    </div>
  )
} 