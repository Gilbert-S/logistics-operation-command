import Debug from "debug"
const debug = Debug("loc:service:info-layer")
debug("loading info-layer service module")

import type { Socket } from "socket.io"
import { Events } from "@loc/common"
import { applyDelta, diffAndSync, Identifier, storeDelta, sync } from "./diff.service.ts"
import { logHandlerErrors } from "./socket.service.ts"
import { isExpectedSync, standardRequestHandler } from "../utils/standard-request-handler.ts"
import type { Delta } from "@loc/jdp"
import type { SyncAckCallback } from "@loc/types"


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
    debugger: debug,
    event: Events.REQUEST_INFO_LAYER,
    getData: () => infoLayer,
    identifier: Identifier.InfoLayer,
    socket,
  })

  const syncInfoLayerHandler = (
    iterationNumber: number,
    epoch: string,
    diff: Delta,
    callback?: SyncAckCallback,
  ) =>
  {
    dlog(`sync with iteration %d received`, iterationNumber)
    const ack = typeof callback === "function" ? callback : () => undefined

    if (!isExpectedSync(Identifier.InfoLayer, iterationNumber, epoch))
    {
      ack(false)
      return dlog(`Canceled. Out of order sync or epoch mismatch`)
    }

    applyDelta(infoLayer, diff)
    storeDelta(Identifier.InfoLayer, diff, infoLayer)
    dlog(`Info layer sync with iteration %d applied`, iterationNumber)
    ack(true)
    sync(Events.SYNC_INFO_LAYER, Identifier.InfoLayer)
    dlog(`Info layer sync with iteration %d broadcasted to all clients`, iterationNumber)
  }

  socket.on(Events.SYNC_INFO_LAYER, logHandlerErrors(syncInfoLayerHandler))
}