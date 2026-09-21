import { Hono } from "hono"
import { serve, type ServerType } from "@hono/node-server"

import Debug from "debug"
const debug = Debug("loc:service:hono")
debug("loading hono server module")





export const hono = new Hono()
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