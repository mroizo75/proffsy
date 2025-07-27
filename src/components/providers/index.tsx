"use client"

import { ThemeProvider } from "next-themes"
import { SWRProvider } from "./swr-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SWRProvider>
        {children}
      </SWRProvider>
    </ThemeProvider>
  )
} 