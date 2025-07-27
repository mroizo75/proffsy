import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { withAuth } from "next-auth/middleware"

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname === '/login'
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    
    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      return null
    }

    if (isAdminPage) {
      if (!isAuth) {
        const url = new URL('/login', req.url)
        url.searchParams.set('from', req.nextUrl.pathname)
        return NextResponse.redirect(url)
      }
      
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL('/', req.url))
      }
      
      return null
    }

    return null
  },
  {
    callbacks: {
      authorized: () => true // La middleware håndtere autorisasjon
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/login']
} 