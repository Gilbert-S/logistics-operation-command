import { fetchDynamicMapData, fetchMapList, fetchStaticMapData } from "./war-api.service.ts"
import type { MapData, RequestResponse } from "@loc/types"
import { Events } from "@loc/common"
import type { Socket } from "socket.io"
import { diffAndSync, getDeltaForIteration, getEpoch, getLastIterationNumber, Identifier }
  from "./diff.service.ts"

import Debug from "debug"
const debug = Debug("loc:service:map-data")
debug("loading map-data service module")





/** in memory storage of the Foxhole MapData
 * will be synced to clients (full and incremental)
 */
let mapData: MapData | null = null





type HexData = MapData[string]

interface HexState
{
  /** WarAPI data version of the last accepted dynamic data */
  version: number
  failures: number
  /** timestamp before which this hex is not retried */
  retryAfter: number
}

const hexStates = new Map<string, HexState>()
const MAP_LIST_REFRESH_EVERY_N_TICKS = 10
const MAX_BACKOFF_MS = 5 * 60 * 1000
let tickCounter = 0
let updateRunning = false

/** the WarAPI version is optional at runtime, -1 means unknown (always treated as changed) */
function versionOf(data: { version?: unknown }): number
{
  return Number.isInteger(data.version) ? data.version as number : -1
}





/** clears the in memory map data, the next initialization starts from scratch */
export function resetMapData()
{
  mapData = null
  hexStates.clear()
}





function registerFailure(mapId: string, error: unknown)
{
  const state = hexStates.get(mapId) ?? { version: -1, failures: 0, retryAfter: 0 }
  state.failures++
  state.retryAfter =
    Date.now() + Math.min(60 * 1000 * 2 ** (state.failures - 1), MAX_BACKOFF_MS) - 1000
  hexStates.set(mapId, state)
  console.error(`map-data: failed to update hex ${mapId} (failure #${state.failures})`, error)
}





async function loadHex(mapId: string): Promise<HexData>
{
  const [staticData, dynamicData] = await Promise.all([
    fetchStaticMapData(mapId),
    fetchDynamicMapData(mapId),
  ])

  hexStates.set(mapId, { version: versionOf(dynamicData), failures: 0, retryAfter: 0 })

  return {
    dynamic: dynamicData.mapItems,
    static: staticData.mapTextItems,
    regionId: staticData.regionId,
    scorchedVictoryTowns: staticData.scorchedVictoryTowns,
  }
}





/** (re)loads the given hexes individually, a failing hex does not affect the others */
async function loadHexes(mapIds: string[], target: MapData)
{
  const results = await Promise.allSettled(mapIds.map((mapId) => loadHex(mapId)))
  let changed = false

  results.forEach((result, i) =>
  {
    const mapId = mapIds[i]!
    if (result.status === "fulfilled")
    {
      target[mapId] = result.value
      changed = true
    }
    else
      registerFailure(mapId, result.reason)
  })

  return changed
}





export async function initializeMapData()
{
  const dlog = debug.extend("initializeMapData")
  dlog("initializing")

  try
  {
    const mapList = await fetchMapList()
    dlog("fetched map list with %d entries", mapList.length)

    const newMapData: MapData = { }
    const changed = await loadHexes(mapList, newMapData)

    // keep last known data for hexes that failed to load
    for (const mapId of mapList)
      if (!newMapData[mapId] && mapData?.[mapId])
        newMapData[mapId] = mapData[mapId]

    if (!changed && !mapData)
    {
      dlog("no hex could be loaded, map-data cache NOT updated")
      return
    }

    mapData = newMapData
    dlog(`completed, map-data cache updated`)

    syncMapData()
  }
  catch(error)
  {
    dlog(`error, map-data cache NOT updated %O`, error)
    console.error("initializeMapData: error fetching and processing war API data", error)
  }
}





async function updateHex(mapId: string, current: HexData, target: MapData)
{
  const dynamicData = await fetchDynamicMapData(mapId)
  const state = hexStates.get(mapId)
  const version = versionOf(dynamicData)

  // data version went backwards (e.g. new war), static data may have changed too
  if (state && version !== -1 && version < state.version)
  {
    target[mapId] = await loadHex(mapId)
    return true
  }

  if (state && version !== -1 && version === state.version)
  {
    state.failures = 0
    return false
  }

  if (dynamicData.mapItems.length === 0 && current.dynamic.length > 0)
    throw Error("received empty dynamic data for hex with existing data, ignoring")

  target[mapId] = { ...current, dynamic: dynamicData.mapItems }
  hexStates.set(mapId, { version, failures: 0, retryAfter: 0 })
  return true
}





async function updateDynamicMapDataInterval()
{
  if (updateRunning)
    return debug("previous update still running, skipping tick")

  updateRunning = true
  try
  {
    tickCounter++
    if (!mapData)
      return await initializeMapData()

    debug("updating dynamic map data")
    const now = Date.now()
    const newMapData: MapData = { ...mapData }
    let changed = false

    // detect added / removed hexes from time to time
    if (tickCounter % MAP_LIST_REFRESH_EVERY_N_TICKS === 0)
      try
      {
        const mapList = await fetchMapList()
        const missing = mapList.filter((id) => !newMapData[id])

        for (const id of Object.keys(newMapData))
          if (!mapList.includes(id))
          {
            delete newMapData[id]
            hexStates.delete(id)
            changed = true
          }

        const dueMissing = missing.filter((id) => (hexStates.get(id)?.retryAfter ?? 0) <= now)
        if (await loadHexes(dueMissing, newMapData))
          changed = true
      }
      catch (error)
      {
        debug("updateDynamicMapDataInterval: error refreshing map list. %o", error)
      }

    const due = Object.entries(newMapData)
      .filter(([mapId]) => (hexStates.get(mapId)?.retryAfter ?? 0) <= now)

    const results =
      await Promise.allSettled(due.map(([mapId, hex]) => updateHex(mapId, hex, newMapData)))

    results.forEach((result, i) =>
    {
      if (result.status === "fulfilled")
        changed ||= result.value
      else
        registerFailure(due[i]![0], result.reason)
    })

    if (changed)
    {
      mapData = newMapData
      debug("dynamic map data updated")
      syncMapData()
    }
  }
  catch(error)
  {
    debug("error updating dynamic map data: %O", error)
    console.error("updateDynamicMapDataInterval: error updating dynamic map data", error)
  }
  finally
  {
    updateRunning = false
  }
}


let updateIntervalTimeout: NodeJS.Timeout | undefined
export function startDynamicMapDataUpdateInterval()
{
  debug("starting 60-second dynamic map data update interval")
  clearInterval(updateIntervalTimeout)
  updateIntervalTimeout = setInterval(() => void updateDynamicMapDataInterval(), 60 * 1000)
}

export function stopDynamicMapDataUpdateInterval()
{
  debug("stopping dynamic map data update interval")
  clearInterval(updateIntervalTimeout)
}




function syncMapData()
{
  debug("syncing map data to all clients")
  diffAndSync(Identifier.MapData, Events.SYNC_MAP_DATA, mapData)
}





export function registerSocketMapDataHandlers(socket: Socket)
{
  debug("registering handlers for socket %o", socket.id)

  const dlog = debug.extend(`socket:${ socket.id}`)


  // clients send (iteration, epoch, ack); outdated clients send (iteration, ack) without an epoch,
  // and misbehaving clients may send no ack at all - which must never crash the server
  const requestMapDataUpdateHandler = (...args: unknown[]) =>
  {
    const ack = args.at(-1)
    if (typeof ack !== "function")
      return dlog("invalid or missing callback provided, cannot send response")

    const callback = ack as (response: RequestResponse<MapData>) => void
    const iteration = args[0] as number
    const hasEpochArg = args.length >= 3
    const clientEpoch = typeof args[1] === "string" ? args[1] : undefined

    dlog("map data update requested for iteration %d", iteration)

    const lastIteration = getLastIterationNumber(Identifier.MapData)
    const epoch = getEpoch(Identifier.MapData)
    dlog("latest map data iteration is %d", lastIteration)

    // legacy clients (no epoch argument) are served by iteration only
    if (mapData && hasEpochArg && clientEpoch !== epoch)
    {
      callback({ iteration: lastIteration, epoch, full: mapData })
      dlog("client epoch differs from server epoch, sending full map data")
      return
    }

    if (iteration === lastIteration)
    {
      callback({ iteration: lastIteration, epoch })
      dlog("map data is up to date, no data sent")
      return
    }

    if (!mapData)
    {
      callback({ iteration: lastIteration, epoch })
      dlog("no map data available on server, no data sent", lastIteration)
      return
    }


    if (!iteration || iteration < 0)
    {
      callback({ iteration: lastIteration, epoch, full: mapData })
      dlog("update for invalid iteration requested, sending full map data")
      return
    }


    const delta = getDeltaForIteration(Identifier.MapData, iteration)
    if (!delta)
    {
      callback({ iteration: lastIteration, epoch, full: mapData })
      dlog(
        "no delta available for iteration %d to %d, sending full map data instead",
        iteration,
        lastIteration,
      )
      return
    }


    else
    {
      callback({ iteration: lastIteration, epoch, delta })
      dlog("sending delta for iteration %d to %d", iteration, lastIteration)
      return
    }
  }


  socket.on(Events.REQUEST_MAP_DATA, requestMapDataUpdateHandler)
  dlog("handlers registered")
}
