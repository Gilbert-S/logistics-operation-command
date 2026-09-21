import Debug from "debug"
const debug = Debug("loc:service:auth")
debug("initializing auth module")


import { betterAuth, type DiscordProfile, type GenericEndpointContext } from "better-auth"
import { admin, createAccessControl } from "better-auth/plugins"
import { defaultStatements } from "better-auth/plugins/admin/access"
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2"
import { db } from "./db.service.ts"
import * as schema from "../database/schema/auth-schema.ts"
import { betterFetch } from "@better-fetch/fetch"
import type { Hono } from "hono"
import type { IncomingHttpHeaders } from "node:http"
import { settings } from "./settings.service.ts"





const GUILD_ID = process.env["DISCORD_GUILD_ID"]!
const ADMINS = process.env["DISCORD_ADMIN_IDS"]?.split(/[\s,]+/) || []

if (!GUILD_ID)
  throw new Error("DISCORD_GUILD_ID environment variable is not set")


const ac = createAccessControl(defaultStatements)
const adminAc = ac.newRole({
  user: ["list", "ban", "impersonate", "delete", "get", "create"],
  session: ["list", "revoke", "delete"],
})





export const auth = betterAuth({

  basePath: "/auth",
  baseURL: process.env["BASE_URL"]!,

  disabledPaths: ["/update-user"],

  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),

  advanced: { database: { joins: true } },

  plugins: [
    admin({
      ac,
      roles: { admin: adminAc },
    }),
  ],

  telemetry: {
    enabled: false,
    debug: false,
  },

  user: {
    additionalFields: {
      roles: {
        type: "string[]",
        required: true,
        defaultValue: [],
        input: true,
      },
    },

    validateUserInfo: (data) => validateUser(data.user),
  },

  session: {
    freshAge: 0,
    additionalFields: {
      online: {
        defaultValue: false,
        index: true,
        input: true,
        required: true,
        sortable: true,
        type: "boolean",
      },
      last_seen: {
        defaultValue: null,
        input: true,
        required: false,
        sortable: true,
        type: "date",
      },
    },
  },

  onAPIError: {
    errorURL: "/error",
    onError: (err) => debug("better-auth APIError: %o", err),
  },

  socialProviders: {
    discord: {
      clientId: process.env["DISCORD_CLIENT_ID"]!,
      clientSecret: process.env["DISCORD_CLIENT_SECRET"]!,
      getUserInfo: async (token) => getDiscordGuildMemberProfile(token.accessToken),
      overrideUserInfoOnSignIn: true,
      scope: ["guilds.members.read"],
    },
  },



  databaseHooks: {
    user: {
      create: { before: (user, ctx) => databaseHookIsUserBetterAuthAdmin(user, ctx) },
      update: { before: (user, ctx) => databaseHookIsUserBetterAuthAdmin(user, ctx) },
    },
  },

})





export function attachBetterAuthToHono(hono: Hono)
{
  debug("attaching better-auth handler to hono instance")
  hono.on(["POST", "GET"], "/auth/*", (context) => auth.handler(context.req.raw))
}





export const getDiscordGuildMemberProfile = async (accessToken: string | undefined | null) =>
{
  if (!accessToken)
  {
    debug("no token provided, cannot fetch user info from Discord API")
    return null
  }

  debug("fetching user info from Discord API for token")
  const { data: profile, error } = await betterFetch<PartialDiscordGuildMember>(
    `https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  )

  debug("Discord API response, got error: %o - profile: %o", error, !!profile)

  if (error || !profile || !profile.user)
    return null


  if (profile.avatar === null && profile.user.avatar === null)
  {
    const defaultAvatarNumber =
      profile.user.discriminator === "0"
        ? Number(BigInt(profile.user.id) >> BigInt(22)) % 6
        : parseInt(profile.user.discriminator) % 5
    profile["image_url"] = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`
  }

  else if (profile.avatar)
  {
    const format = profile.avatar.startsWith("a_") ? "gif" : "png"
    profile["image_url"] = `https://cdn.discordapp.com/guilds/${GUILD_ID}/users/${profile.user?.id}/avatars/${profile.avatar}.${format}`
  }

  else
  {
    const format = profile.user.avatar?.startsWith("a_") ? "gif" : "png"
    profile["image_url"] = `https://cdn.discordapp.com/avatars/${profile.user?.id}/${profile.user?.avatar}.${format}`
  }

  return {
    user: {
      email: profile.user.id, // i don't need nor want mail addr in my system (data protection) -- using ids instead to satisfy the better-auth userinfo interface
      emailVerified: profile.user.verified,
      image: profile["image_url"] as string,
      name: profile.nick ?? profile.user.global_name ?? profile.user.username ?? "Unknown",
      roles: profile.roles,
    },
    data: profile.user,
  }
}





/** returns an error object if the user is invalid, otherwise returns undefined */
export const validateUser = (user: { name?: string; roles?: string[] } & Record<string, unknown>) =>
{
  debug("validating user info for user %o", user?.name)

  if (!user || !user.roles || !user.roles.length)
    return {
      error: "NO_REGIMENT_MEMBER",
      errorDescription: "Login denied. You are not a member of the required Discord server.",
    }


  if (ADMINS.includes(user["email"] as string))
    return


  const PERMITTED_ROLES = settings.backend["auth.permitted-roles"]
  if (PERMITTED_ROLES && PERMITTED_ROLES.length > 0)
  {
    const hasPermittedRole = user.roles.some((role) => PERMITTED_ROLES.includes(role))

    if (!hasPermittedRole)
      return {
        error: "MISSING_ROLE",
        errorDescription: "Login denied. " +
                          "You do not have any role that grants access to this application.",
      }
  }

  return
}




/** used when a user creates a socket.io connection. updates the user data like roles and name */
export const validateSession =
  async (session: typeof auth.$Infer.Session, headers: IncomingHttpHeaders) =>
  {
    try
    {
      debug("validating session for user %o", session?.user?.name)

      if (!session || !session.user || !session.session)
        return {
          error: "INVALID_SESSION",
          errorDescription: "Session is invalid or expired.",
        }


      /** get accounts associated with the user/session */
      const accounts = await auth.api.listUserAccounts({ headers })
      if (!accounts || !accounts.length)
        return {
          error: "INVALID_SESSION",
          errorDescription: "Session has no linked accounts.",
        }

      /** get access token for the first linked account (we only have one enabled - Discord) */
      const token = await auth.api.getAccessToken({
        body: {
          accountId: accounts[0]!.id,
          userId: session.user.id,
        },
      })
      if (!token || !token.accessToken)
        return {
          error: "INVALID_SESSION",
          errorDescription: "Session has no valid OAuth access token.",
        }

      /** fetch Discord guild member profile */
      const profile = await getDiscordGuildMemberProfile(token.accessToken)
      if (!profile || !profile.user)
        return {
          error: "INVALID_SESSION",
          errorDescription: "Unable to fetch Discord guild member profile for account.",
        }

      /** validate user roles */
      const validationResult = validateUser(profile.user)
      if (validationResult)
        return validationResult


      /** update user in auth db */
      const userUpdate = {
        image: profile.user.image,
        name: profile.user.name,
        roles: [...profile.user.roles, "TEST"],
      }

      await auth.api.updateUser({ headers, body: userUpdate })
      debug("user updated.")

      return
    }
    catch (error)
    {
      const message = error instanceof Error ? error.message : String(error)
      debug("error validating session: %o", message)
      return {
        error: "INVALID_SESSION",
        errorDescription: "Error validating user session",
      }
    }
  }


const databaseHookIsUserBetterAuthAdmin = (
  user: Omit<Partial<typeof schema.user.$inferSelect>, "image">,
  ctx: GenericEndpointContext | null,
) =>
{
  const discordUserId = user.email ?? ctx?.context?.session?.user?.email

  if (ADMINS.includes(discordUserId as string))
  {
    user.role = "admin"
    return Promise.resolve({ data: user })
  }

  const ADMIN_ROLES = settings.backend["auth.admin-roles"]

  if (!user || !user.roles || Array.isArray(user.roles) === false)
  {
    user.role = "user"
    return Promise.resolve({ data: user })
  }

  if (!ADMIN_ROLES || !ADMIN_ROLES.length)
  {
    user.role = "admin"
    return Promise.resolve({ data: user })
  }

  const role = user.roles.some((role:string) => ADMIN_ROLES.includes(role)) ? "admin" : "user"
  user.role = role

  return Promise.resolve({ data: user })
}





export interface PartialDiscordGuildMember extends Record<string, unknown> {
  avatar?: string
  nick?: string
  roles: string[]
  user: DiscordProfile
}


export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user