import { Events } from "@loc/common"
import type { Socket } from "socket.io"
import {
  applyDelta, diffAndSync, getDeltaForIteration, getLastIterationNumber,
  Identifier, storeDelta, sync,
} from "./diff.service.ts"
import type { Delta } from "jsondiffpatch"
import type { OpsBase, RequestResponseHandler } from "@loc/types"


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



  const requestOpsBaseHandler: RequestResponseHandler<OpsBase[]> = (iteration, callback) =>
  {
    dlog("OpsBase update requested for iteration %d", iteration)

    const lastIteration = getLastIterationNumber(Identifier.OpsBase)
    dlog("latest OpsBase iteration is %d", lastIteration)

    if (iteration === lastIteration)
    {
      dlog("up to date, no data sent")
      return callback({ iteration: lastIteration })
    }

    if (!opsBaseList)
    {
      dlog("no OpsBase data available on server, no data sent")
      return callback({ iteration: lastIteration })
    }


    if (!iteration || iteration <= 0)
    {
      dlog("update for invalid iteration requested, sending full OpsBase data")
      return callback({ iteration: lastIteration, full: opsBaseList })
    }


    const delta = getDeltaForIteration(Identifier.OpsBase, iteration)
    if (!delta)
    {
      dlog("no delta available for requested iteration, sending full OpsBase data")
      return callback({ iteration: lastIteration, full: opsBaseList })
    }

    else
    {
      dlog("sending delta for iteration %d to %d", iteration, lastIteration)
      return callback({ iteration: lastIteration, delta })
    }
  }


  const syncOpsBaseHandler = (iterationNumber: number, diff: Delta) =>
  {
    dlog(`OpsBase sync with iteration %d received`, iterationNumber)

    const lastIteration = getLastIterationNumber(Identifier.OpsBase)
    if (iterationNumber !== lastIteration + 1)
      return dlog(`Canceled. Out of order sync - last iteration is %d`, lastIteration)

    applyDelta(opsBaseList, diff)
    storeDelta(Identifier.OpsBase, diff, opsBaseList)
    dlog(`OpsBase sync with iteration %d applied`, iterationNumber)
    sync(Events.SYNC_OPS_BASE, Identifier.OpsBase)
    dlog(`OpsBase sync with iteration %d broadcasted to all clients`, iterationNumber)
  }


  socket.on(Events.REQUEST_OPS_BASE, requestOpsBaseHandler)
  socket.on(Events.SYNC_OPS_BASE, syncOpsBaseHandler)
  dlog("handlers registered")
}