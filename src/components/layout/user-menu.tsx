"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Package, ShoppingBag, UserCircle } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

export function UserMenu() {
  const { data: session } = useSession()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {session ? (
            <User className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {session ? (
          <>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {session.user?.role === "ADMIN" && (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin" >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile" >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Min profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/orders" >
                  <Package className="mr-2 h-4 w-4" />
                  <span>Mine ordrer</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/wishlist" >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>Ønskeliste</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logg ut</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/login" >
                <User className="mr-2 h-4 w-4" />
                <span>Logg inn</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/register" >
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Registrer deg</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
