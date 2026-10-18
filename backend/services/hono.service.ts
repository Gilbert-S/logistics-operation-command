import { readFileSync } from "node:fs"
import { Hono } from "hono"
import { serve, type ServerType } from "@hono/node-server"

import Debug from "debug"
const debug = Debug("loc:service:hono")
debug("loading hono server module")



/** the docker build writes .version, package.json is not part of the image */
function readAppVersion()
{
  try
  {
    return readFileSync(new URL("../.version", import.meta.url), "utf8").trim()
  }
  catch
  {
    const rootPackage = readFileSync(new URL("../../package.json", import.meta.url), "utf8")
    return (JSON.parse(rootPackage) as { version: string }).version
  }
}

export const APP_VERSION = readAppVersion()

export const hono = new Hono()

hono.use("/auth/*", async (context, next) =>
{
  // oauth provider redirect is a plain browser navigation, cannot carry the header
  if (context.req.path.startsWith("/auth/callback/"))
    return await next()

  if (context.req.header("X-Client-Version") !== APP_VERSION)
    return context.json({ error: "client_outdated" }, 426)

  return await next()
})

let server: ServerType | undefined


export function startHonoServer()
{
  debug("starting hono server")

  if (server)
  {
    debug("hono server already started, returning existing server instance")
    return server
  }

  server = serve(hono)
  debug("hono server started")
  return server
}