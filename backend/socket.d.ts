import type { Socket } from "socket.io"

declare module "socket.io"
{
  interface Socket { 
    session: {
      session: {
          id: string
          createdAt: Date
          updatedAt: Date
          userId: string
          expiresAt: Date
          token: string
          ipAddress?: string | null | undefined
          userAgent?: string | null | undefined
          online: boolean
          last_seen?: Date | null | undefined
          impersonatedBy?: string | null | undefined
      }
      user: {
          id: string
          createdAt: Date
          updatedAt: Date
          email: string
          emailVerified: boolean
          name: string
          image?: string | null | undefined
          roles: string[]
          banned: boolean | null | undefined
          role?: string | null | undefined
          banReason?: string | null | undefined
          banExpires?: Date | null | undefined
      }
    }
  }
}