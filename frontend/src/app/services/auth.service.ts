import { Injectable, resource, Signal, signal } from "@angular/core"
import { toast } from "@spartan-ng/brain/sonner"
import { createAuthClient } from "better-auth/client"
import { adminClient } from "better-auth/client/plugins"





@Injectable({ providedIn: "root" })
export class AuthService
{
  private authClient = createAuthClient({
    baseURL: window.location.origin,
    basePath: "/auth",
    plugins: [adminClient()],
  })





  readonly user = signal<{
    id: string
    createdAt: Date
    updatedAt: Date
    email: string
    emailVerified: boolean
    name: string
    image?: string | null | undefined
    roles?: string[] | null | undefined
    role?: string | null | undefined
  } | null>(null)


  readonly session = signal<{
    id: string
    createdAt: Date
    updatedAt: Date
    userId: string
    expiresAt: Date
    token: string
    ipAddress?: string | null | undefined
    userAgent?: string | null | undefined
    impersonatedBy?: string | null
    online?: boolean
    last_seen?: Date | null
  } | null>(null)


  readonly error = signal<unknown>(null)
  readonly isPending = signal(false)
  readonly isRefetching = signal(false)
  refetchTimout: ReturnType<typeof setTimeout> | undefined



  constructor()
  {
    this.authClient.useSession.subscribe((value) =>
    {
      const { data, error, isPending, isRefetching, refetch } = value
      const { user, session } = data ?? { user: null, session: null }

      this.user.set(user)
      this.session.set(session)
      this.error.set(error)
      this.isPending.set(isPending)
      this.isRefetching.set(isRefetching)


      if (!isPending && !isRefetching && error && (!user || !session))
      {
        toast.error(
          "Error establishing user session",
          {
            closeButton: false,
            description: `There are issues communicating with the backend. Retrying periodically. Please standby.`,
            dismissible: false,
            duration: 1000 * 60 * 10,
            id: "auth-service-session-error",
          },
        )
        clearTimeout(this.refetchTimout)
        this.refetchTimout = setTimeout(() => refetch(), 10000)
      }
      else
      {
        toast.dismiss("auth-service-session-error")
        clearTimeout(this.refetchTimout)
      }

    })

    // this.createFakeUsers()
  }


  signIn = async () => await this.authClient.signIn.social({ provider: "discord" })
  signOut = async () => await this.authClient.signOut()
  getSessions = async () => this.authClient.listSessions()


  /** revokes a specific session */
  revoke = async (session: { token: string } & Record<string, unknown>) =>
  {
    const { data, error } = await this.authClient.revokeSession({ token: session.token })

    if (data)
      toast.success("Session revoked", { duration: 5000 })
    if (error)
      toast.error("Failed to revoke session", { duration: 10000, description: error.message })
  }

  /** revokes all session BUT the current one */
  revokeOther = async () =>
  {
    const { data, error } = await this.authClient.revokeOtherSessions()

    if (data)
      toast.success("All other sessions revoked", { duration: 5000 })
    if (error)
      toast.error(
        "Failed to revoke all other sessions",
        { duration: 10000, description: error.message },
      )
  }

  /** revokes ALL sessions */
  revokeAll = async () =>
  {
    const { data, error } = await this.authClient.revokeSessions()

    if (data)
      toast.success("All sessions revoked", { duration: 5000 })
    if (error)
      toast.error(
        "Failed to revoke all sessions",
        { duration: 10000, description: error.message },
      )
  }


  createFakeUsers()
  {
    for (let i = 0; i < 50; i++)
      void this.authClient.admin.createUser({
        email: `fake${i}@mail.local`,
        name: `Fake User ${i}`,
        password: "fake-password",
      })
  }


  public getUsers(page: Signal<number>, limit: Signal<number>, search?: Signal<string | undefined>)
  {
    return resource({
      defaultValue: { users: [], total: 0 },
      params: () => ({ page: page(), search: search?.() }),
      loader: async ({ params }) =>
      {
        const { data, error } = await this.authClient.admin.listUsers({
          query: {
            limit: limit(),
            offset: (params.page - 1) * limit(),
            searchField: "name",
            searchOperator: "contains",
            searchValue: params.search,
            sortBy: "name",
            sortDirection: "asc",
          },
        })
        if (error)
          throw new Error(error.message, { cause: error })

        return data
      },
    })

  }

  public ban = (userId: string) => this.authClient.admin.banUser({ userId })
  public unban = (userId: string) => this.authClient.admin.unbanUser({ userId })
  public revokeSessions = (userId: string) => this.authClient.admin.revokeUserSessions({ userId })
  public remove = (userId: string) => this.authClient.admin.removeUser({ userId })
  public impersonate = (userId: string) => this.authClient.admin.impersonateUser({ userId })
  public stopImpersonating = () => this.authClient.admin.stopImpersonating()
}
