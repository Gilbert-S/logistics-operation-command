import { Server, Socket, type ServerOptions } from "socket.io"
import type { ServerType } from "@hono/node-server"
import { auth, validateSession } from "./auth.service.ts"


import Debug from "debug"
const debug = Debug("loc:service:socket")
debug("loading socket service module")




let io: Server | undefined

const serverOptions: Partial<ServerOptions> = {
  connectionStateRecovery:
  {
    maxDisconnectionDuration: 5 * 60 * 1000,
    skipMiddlewares: true,
  },
  serveClient: false,
}



export function attachSocketIOToServer(server: ServerType)
{
  debug("attaching Socket.IO to server")

  if (io)
    throw Error("Socket.IO instance already initialized. Call getSocketIOInstance().")

  io = new Server(server, serverOptions)
  debug("Socket.IO instance created and attached to server")

  attachAuth(io)
  attachDebugLoggers(io)

  return io
}


export function getSocketIOInstance()
{
  if (!io)
  {
    debug("Socket.IO instance not initialized")
    throw Error("Socket.IO instance not initialized. Call attachSocketIOToServer(server) first.")
  }

  return io
}


export function attachSocketEventHandlers(...funcs: ((socket: Socket) => void)[])
{
  if (!io)
  {
    debug("Socket.IO instance not initialized")
    throw Error("Socket.IO instance not initialized. Call attachSocketIOToServer(server) first.")
  }

  io.on("connection", (socket) =>
  {
    for (const func of funcs)
    {
      debug("attaching socket event handler %o for %o", func.name, socket.id)
      func(socket)
    }


  })
}



function attachAuth(io: Server)
{
  debug("attaching auth middleware")

  io.use((socket, next) =>
  {
    const log = debug.extend(`auth:${socket.id}`)
    log("getting user-session")

    /** get session from better auth based on cookies. if cookies are missing or session inside
     * cookie is invalid, this will fail and socket is closed */
    auth.api.getSession({ headers: socket.handshake.headers })
      .then(async (session) =>
      {
        if (!session || !session.session || !session.user)
        {
          log("no valid session found")
          return next(Error("InvalidSession"))
        }

        log("session found, user: %o, validating", session.user.name)

        const validationError = await validateSession(session, socket.handshake.headers)

        if (validationError)
          return next(Error("InvalidSession"))


        const updatedSession = await auth.api.getSession({ headers: socket.handshake.headers })
        log("session validated. auth successfull.")

        socket.session = updatedSession!
        debug("session: %o", socket.session)
        return next()
      })
      .catch((err: Error) =>
      {
        log("error %o", err)
        return next(err)
      })
  })
}



function attachDebugLoggers(io: Server)
{
  debug("attaching socket debug loggers")

  io.on("connection", (socket) =>
  {
    debug("client connected: %o, recovered: %o", socket.id, socket.recovered)

    socket.on("error", (err) =>
      debug("socket %o error: %o", socket.id, err))

    socket.on("disconnect", (reason: string) =>
      debug("socket %o disconnected, reason: %o", socket.id, reason))
  })
}