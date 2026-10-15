import type Events from "@loc/common"
import type { Socket } from "socket.io"
import type Debug from "debug"
import type { RequestResponseHandler } from "@loc/types"
import { getDeltaForIteration, getEpoch, getLastIterationNumber, type IdentifierKey }
  from "../services/diff.service.ts"
import { logHandlerErrors } from "../services/socket.service.ts"





/**
 * true if a client sync is based on the current server history
 * (same epoch and exactly the next iteration)
 */
export function isExpectedSync(identifier: IdentifierKey, iteration: number, epoch: unknown)
{
  if (epoch !== getEpoch(identifier))
    return false

  return iteration === getLastIterationNumber(identifier) + 1
}





/**
 * sets up a socket listener for a data REQUEST_* event and
 * responds with a data update (full or delta)
 */
export function standardRequestHandler<T>(options: {
  socket: Socket,
  event: Events,
  identifier: IdentifierKey,
  getData: () => T,
  debugger: Debug.Debugger,
})
{
  const { getData, event, socket, identifier } = options
  const debug = options.debugger.extend(`socket:${options.socket.id}:${event}`)


  const requestHandler: RequestResponseHandler<T> = (iteration, clientEpoch, callback) =>
  {

    debug("request for iteration %d", iteration)

    if (!callback || typeof callback !== "function")
      return debug("invalid callback provided, cannot send response")

    const data = getData()
    const epoch = getEpoch(identifier)
    const lastIteration = getLastIterationNumber(identifier)
    debug("latest iteration is %d", lastIteration)

    if (!data)
    {
      debug("no data available on server, no data sent")
      return callback({ iteration: lastIteration, epoch })
    }

    if (clientEpoch !== epoch)
    {
      debug("client epoch differs from server epoch, sending full data")
      return callback({ iteration: lastIteration, epoch, full: data })
    }

    if (iteration === lastIteration)
    {
      debug("up to date, no data sent")
      return callback({ iteration: lastIteration, epoch })
    }


    if (!iteration || iteration <= 0)
    {
      debug("update for invalid iteration requested, sending full data")
      return callback({ iteration: lastIteration, epoch, full: data })
    }


    const delta = getDeltaForIteration(identifier, iteration)
    if (!delta)
    {
      debug("no delta udpate available for requested iteration, sending full data")
      return callback({ iteration: lastIteration, epoch, full: data })
    }
    else
    {
      debug("sending delta update for iteration %d to %d", iteration, lastIteration)
      return callback({ iteration: lastIteration, epoch, delta })
    }
  }





  socket.on(event, logHandlerErrors(requestHandler))
}
