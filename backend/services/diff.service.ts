import { getSocketIOInstance } from "./socket.service.ts"
import { jdp } from "@loc/jdp"
import { type Delta } from "jsondiffpatch"
import type Events from "@loc/common"

import Debug from "debug"
const debug = Debug("loc:service:diff")
debug("loading diff service module")





const ITERATION_STORE: IterationStore = {}





export function diffAndSync(identifier: IdentifierKey, event: Events, newData: unknown)
{
  debug("diffAndSync for %o (event: %o)", identifier, event)

  if (diff(identifier, newData))
    sync(event, identifier)
}





function diff(identifier: IdentifierKey, newData: unknown)
{
  debug("diff: %o", identifier)

  if (!newData)
    return false

  let json: string
  try { json = JSON.stringify(newData) }
  catch(error)
  {
    console.error(`diff: failed to stringify newData for identifier ${identifier}:`, error)
    return false
  }

  debug("diff: datavalid, json stringified")



  if (!ITERATION_STORE[identifier] || ITERATION_STORE[identifier].size === 0)
  {
    const diff = jdp.diff(undefined, newData)

    const iteration: StoredIteration = { json, diff }
    const map = new Map<number, StoredIteration>()
    map.set(1, iteration)

    ITERATION_STORE[identifier] = map

    debug("diff: no previous data, storing initial iteration")
    return true
  }
  else
  {
    const iterations = ITERATION_STORE[identifier]
    const [lastIterationNumber, { json: lastJson }] = iterations.entries().toArray().pop()!


    const oldData = JSON.parse(lastJson) as unknown

    const diff = jdp.diff(oldData, newData)
    debug("diff: diff computed")

    if (!diff)
    {
      debug("diff: completed, no changes detected")
      return false
    }


    const newIterationNumber = lastIterationNumber + 1
    iterations.set(newIterationNumber, { json, diff })

    if (iterations.size > 10)
    {
      debug("diff: iteration store for %o exceeded 10 entries, deleting oldest entry", identifier)
      iterations.delete(iterations.keys().next().value!)
    }

    debug("diff: completed, stored new iteration %d", newIterationNumber)
    return true
  }

}





export function sync(event: Events, identifier: IdentifierKey)
{
  debug("sync: identifier %o, event %o", identifier, event)
  if (!identifier || !event || !ITERATION_STORE[identifier])
    return

  const iterationNumber = getLastIterationNumber(identifier)
  const diff = ITERATION_STORE[identifier].get(iterationNumber)?.diff
  const io = getSocketIOInstance()
  io.emit(event, { iterationNumber, diff })
  debug(
    "sync: emitted event %o with iteration %d for identifier %o",
    event,
    iterationNumber,
    identifier,
  )
}





export function getLastIterationNumber(identifier: IdentifierKey)
{
  const iterations = ITERATION_STORE[identifier]
  if (!iterations)
    return -1

  return iterations.keys().toArray().pop() ?? -1
}




export function getDeltaForIteration(identifier: IdentifierKey, iterationNumber: number)
{
  const lastIteration = getLastIterationNumber(identifier)
  const iterations = ITERATION_STORE[identifier]
  debug(
    "getDeltaForIteration: identifier %o, iterationNumber %d, lastIteration %d, iterations %d",
    identifier,
    iterationNumber,
    lastIteration,
    iterations?.size ?? 0,
  )

  if (!iterations)
    return

  const iteration = iterations.get(iterationNumber)
  if (!iteration)
    return

  if (iterationNumber === lastIteration)
    return

  const deltas: Delta[] = []
  for (let i = iterationNumber + 1; i <= lastIteration; i++)
    deltas.push(iterations.get(i)!.diff)

  debug("getDeltaForIteration: returning %d deltas", deltas.length)
  return deltas
}





export function applyDelta(data: unknown, delta: Delta)
{
  debug("applying delta to data")

  if (!delta || !data)
    return

  try
  {
    jdp.patch(data, delta)
    debug("delta applied successfully")
  }
  catch (error)
  {
    console.error("diff.service:failed to apply delta:", error)
  }
}


export function storeDelta(identifier: IdentifierKey, delta: Delta, newData: unknown)
{
  debug("storeDelta: %o", identifier)

  if (!delta || !identifier || !newData)
    return

  let json: string
  try { json = JSON.stringify(newData) }
  catch(error)
  {
    console.error(`diff: failed to stringify newData for identifier ${identifier}:`, error)
    return false
  }

  const iterations = ITERATION_STORE[identifier]

  if (!iterations)
  {
    const map = new Map<number, StoredIteration>()
    map.set(1, { json, diff: delta })
    ITERATION_STORE[identifier] = map
    debug("storeDelta: no previous data, storing initial iteration")
    return
  }
  else
  {
    const newIterationNumber = getLastIterationNumber(identifier) + 1
    iterations.set(newIterationNumber, { json, diff: delta })
    debug("storeDelta: stored new iteration %d for identifier %o", newIterationNumber, identifier)

    if (iterations.size > 10)
    {
      debug(
        "storeDelta: iteration store for %o exceeded 10 entries, deleting oldest entry",
        identifier,
      )
      iterations.delete(iterations.keys().next().value!)
    }
    return
  }
}


export function clearIterationStore(identifier: IdentifierKey)
{
  debug("clearIterationStore: %o", identifier)
  if (ITERATION_STORE[identifier])
  {
    delete ITERATION_STORE[identifier]
    debug("clearIterationStore: cleared iteration store for %o", identifier)
  }
}





export const Identifier = {
  InfoLayer: "InfoLayer",
  MapData: "MapData",
  OpsBase: "OpsBase",
  Orders: "Orders",
  Presence: "Presence",
  Templates: "Templates",
} as const

export type IdentifierKey = keyof typeof Identifier

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
type IterationStore = {
  -readonly [identifier in IdentifierKey]?: Map<number, StoredIteration>
}

interface StoredIteration {
  json: string
  diff: Delta
}