import Debug from "debug"
const debug = Debug("loc:service:info-layer")
debug("loading info-layer service module")

import type { Socket } from "socket.io"
import { Events } from "@loc/common"
import { applyDelta, diffAndSync, getLastIterationNumber, Identifier, storeDelta, sync }
  from "./diff.service.ts"
import { standardRequestHandler } from "../utils/standard-request-handler.ts"
import type { Delta } from "@loc/jdp"


export const infoLayer: Record<string, unknown> = {}


export function initializeInfoLayerData(backup?: Record<string, unknown> | null)
{
  debug("initializing info-layer and syncing with clients")

  if (backup)
  {
    debug("restoring info-layer from backup")
    for (const key in infoLayer)
      delete infoLayer[key]
    Object.assign(infoLayer, backup)
  }

  diffAndSync(Identifier.InfoLayer, Events.SYNC_INFO_LAYER, infoLayer)
}



export function registerSocketInfoLayerHandlers(socket: Socket)
{
  debug("registering handlers for socket %o", socket.id)
  const dlog = debug.extend(`socket:${ socket.id}`)


  standardRequestHandler({
    data: infoLayer,
    debugger: debug,
    event: Events.REQUEST_INFO_LAYER,
    identifier: Identifier.InfoLayer,
    socket,
  })

  socket.on(Events.SYNC_INFO_LAYER, (iterationNumber: number, diff: Delta) =>
  {
    dlog(`sync with iteration %d received`, iterationNumber)

    const lastIteration = getLastIterationNumber(Identifier.InfoLayer)
    if (iterationNumber !== lastIteration + 1)
      return dlog(`Canceled. Out of order sync - last iteration is %d`, lastIteration)

    applyDelta(infoLayer, diff)
    storeDelta(Identifier.InfoLayer, diff, infoLayer)
    dlog(`Info layer sync with iteration %d applied`, iterationNumber)
    sync(Events.SYNC_INFO_LAYER, Identifier.InfoLayer)
    dlog(`Info layer sync with iteration %d broadcasted to all clients`, iterationNumber)
  })

}