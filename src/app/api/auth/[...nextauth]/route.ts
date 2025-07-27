import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { compare } from "bcryptjs"
import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { logSecurityEvent, getRequestInfo } from "@/lib/security"
import { Adapter } from "next-auth/adapters"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 