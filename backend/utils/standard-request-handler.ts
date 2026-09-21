import type Events from "@loc/common"
import type { Socket } from "socket.io"
import type Debug from "debug"
import type { RequestResponseHandler } from "@loc/types"
import { getDeltaForIteration, getLastIterationNumber, type IdentifierKey }
  from "../services/diff.service.ts"





/**
 * sets up a socket listener for a data REQUEST_* event and
 * responds with a data update (full or delta)
 */
export function standardRequestHandler<T>(options: {
  socket: Socket,
  event: Events,
  identifier: IdentifierKey,
  data: T,
  debugger: Debug.Debugger,
})
{
  const { data, event, socket, identifier } = options
  const debug = options.debugger.extend(`socket:${options.socket.id}:${event}`)


  const requestHandler: RequestResponseHandler<T> = (iteration, callback) =>
  {

    debug("request for iteration %d", iteration)

    if (!callback || typeof callback !== "function")
      return debug("invalid callback provided, cannot send response")

    const lastIteration = getLastIterationNumber(identifier)
    debug("latest iteration is %d", lastIteration)

    if (iteration === lastIteration)
    {
      debug("up to date, no data sent")
      return callback({ iteration: lastIteration })
    }

    if (!data)
    {
      debug("no data available on server, no data sent")
      return callback({ iteration: lastIteration })
    }


    if (!iteration || iteration <= 0)
    {
      debug("update for invalid iteration requested, sending full data")
      return callback({ iteration: lastIteration, full: data })
    }


    const delta = getDeltaForIteration(identifier, iteration)
    if (!delta)
    {
      debug("no delta udpate available for requested iteration, sending full data")
      return callback({ iteration: lastIteration, full: data })
    }
    else
    {
      debug("sending delta update for iteration %d to %d", iteration, lastIteration)
      return callback({ iteration: lastIteration, delta })
    }
  }





  socket.on(event, requestHandler)
}
