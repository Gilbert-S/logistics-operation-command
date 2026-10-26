import { Events } from "@loc/common"
import type { Socket } from "socket.io"
import { applyDelta, diffAndSync, Identifier, storeDelta, sync } from "./diff.service.ts"
import { logHandlerErrors } from "./socket.service.ts"
import { isExpectedSync, standardRequestHandler } from "../utils/standard-request-handler.ts"
import type { Delta } from "@loc/jdp"
import type { OpsBase, SyncAckCallback } from "@loc/types"


import Debug from "debug"
const debug = Debug("loc:service:ops-base")
debug("loading ops-base service module")


export const opsBaseList: OpsBase[] = []



export function initializeOpsBaseData(backup?: OpsBase[] | null)
{
  debug("initializing OpsBase data and syncing with clients")

  if (backup)
  {
    debug("restoring OpsBase data from backup")
    opsBaseList.splice(0, opsBaseList.length, ...backup)
  }

  diffAndSync(Identifier.OpsBase, Events.SYNC_OPS_BASE, opsBaseList)
}





export function registerSocketOpsBaseHandlers(socket: Socket)
{
  debug("registering handlers for socket %o", socket.id)
  const dlog = debug.extend(`socket:${ socket.id}`)



  standardRequestHandler({
    debugger: debug,
    event: Events.REQUEST_OPS_BASE,
    getData: () => opsBaseList,
    identifier: Identifier.OpsBase,
    socket,
  })


  const syncOpsBaseHandler = (
    iterationNumber: number,
    epoch: string,
    diff: Delta,
    callback?: SyncAckCallback,
  ) =>
  {
    dlog(`OpsBase sync with iteration %d received`, iterationNumber)
    const ack = typeof callback === "function" ? callback : () => undefined

    if (!isExpectedSync(Identifier.OpsBase, iterationNumber, epoch))
    {
      ack(false)
      return dlog(`Canceled. Out of order sync or epoch mismatch`)
    }

    applyDelta(opsBaseList, diff)
    storeDelta(Identifier.OpsBase, diff, opsBaseList)
    dlog(`OpsBase sync with iteration %d applied`, iterationNumber)
    ack(true)
    sync(Events.SYNC_OPS_BASE, Identifier.OpsBase)
    dlog(`OpsBase sync with iteration %d broadcasted to all clients`, iterationNumber)
  }


  socket.on(Events.SYNC_OPS_BASE, logHandlerErrors(syncOpsBaseHandler))
  dlog("handlers registered")
}