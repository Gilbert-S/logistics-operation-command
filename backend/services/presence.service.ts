import Debug from "debug"
const debug = Debug("loc:service:presence")


import type { Socket } from "socket.io"
import { auth } from "./auth.service.ts"
import { db } from "./db.service.ts"
import { standardRequestHandler } from "../utils/standard-request-handler.ts"
import { diffAndSync, Identifier } from "./diff.service.ts"
import Events from "@loc/common"
import { settings } from "./settings.service.ts"



let presenceList: Awaited<ReturnType<typeof fetchPresenceList>> | undefined





/** ToDo:
 * presence list
 * db query function
 * socket event handlers to sync updates
 * trigger update from db on user connect/disconnect
 */

export function registerSocketPresenceHandlers(socket: Socket)
{

  if (!socket.session || !socket.session.user)
    return debug("no user session found for socket %o, skipping presence update", socket.id)



  debug("connected, updating presence to online for user %o", socket.session.user.name)

  void auth.api.updateSession({
    headers: socket.handshake.headers,
    body: { online: true, last_seen: new Date() },
  }).catch((e) => debug(e))
  updatePresenceData()



  debug("attaching disconnect handler for user %o", socket.session.user.name)
  socket.on("disconnect", () =>
  {
    debug("disconnected, updating presence to offline for user %o", socket.session?.user.name)
    void auth.api.updateSession({
      headers: socket.handshake.headers,
      body: { online: false, last_seen: new Date() },
    }).catch((e) => debug(e))
    updatePresenceData()
  })


  standardRequestHandler({
    data: presenceList,
    debugger: debug,
    event: Events.REQUEST_PRESENCE,
    identifier: Identifier.Presence,
    socket,
  })

}



async function fetchPresenceList()
{
  const h = settings.backend["presence.cutoff-hours"] || 2
  const cutoff = h * 60 * 60 * 1000 // cutoff hours in milliseconds
  const cutoffDate = new Date(Date.now() - cutoff)

  const result = await db.query.user.findMany({
    columns: {
      id: true,
      name: true,
      image: true,
    },
    with: {
      sessions: {
        columns: { online: true, last_seen: true },
        orderBy: { online: "desc", last_seen: "desc" },
        limit: 1,
        where: { OR: [{ online: true }, { last_seen: { gte: cutoffDate } }] },
      },
    },
    where: {
      sessions: {
        OR: [
          { online: true },
          { last_seen: { gte: cutoffDate } },
        ],
      },
    },
    orderBy: { name: "asc" },
  })


  return result
}





export async function initializePresenceData()
{
  debug("initializing presence data")
  presenceList = await fetchPresenceList()
  diffAndSync(Identifier.Presence, Events.SYNC_PRESENCE, presenceList)
}




let debounce: ReturnType<typeof setTimeout> | undefined
function updatePresenceData()
{
  if (debounce)
    clearTimeout(debounce)

  debounce = setTimeout(() =>
  {
    debug("updating presence data")
    fetchPresenceList().then((list) =>
    {
      presenceList = list
      debug("presence data updated, syncing to clients")
      diffAndSync(Identifier.Presence, Events.SYNC_PRESENCE, presenceList)
    }).catch((error) =>
    {
      debug("error updating presence data: %O", error)
    })
  }, 1000)
}
