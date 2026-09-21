import { fetchDynamicMapData, fetchMapList, fetchStaticMapData } from "./war-api.service.ts"
import type { MapData, RequestResponseHandler, WarAPI } from "@loc/types"
import { Events } from "@loc/common"
import type { Socket } from "socket.io"
import { diffAndSync, getDeltaForIteration, getLastIterationNumber, Identifier }
  from "./diff.service.ts"

import Debug from "debug"
const debug = Debug("loc:service:map-data")
debug("loading map-data service module")





/** in memory storage of the Foxhole MapData
 * will be synced to clients (full and incremental)
 */
let mapData: MapData | null = null





export async function initializeMapData()
{
  const dlog = debug.extend("initializeMapData")
  dlog("initializing")

  try
  {
    const mapList = await fetchMapList()
    dlog("fetched map list with %d entries", mapList.length)
    dlog("map list: %O", mapList)

    const staticMapDataPromises: Promise<WarAPI.MapDataStatic>[] = []
    const dynamicMapDataPromises: Promise<WarAPI.MapDataDynamic>[] = []

    dlog(`fetching static & dynamic data for all maps`)
    for (const mapId of mapList)
    {
      staticMapDataPromises.push(fetchStaticMapData(mapId))
      dynamicMapDataPromises.push(fetchDynamicMapData(mapId))
    }

    const staticPromise = Promise.all(staticMapDataPromises)
    const dynamicPromise = Promise.all(dynamicMapDataPromises)
    const [staticMapData, dynamicMapData] = await Promise.all([staticPromise, dynamicPromise])
    dlog(`data fetched`)

    const newMapData: MapData = { }

    for (let i = 0; i < mapList.length; i++)

      newMapData[mapList[i]!] = {
        dynamic: dynamicMapData[i]!.mapItems,
        static: staticMapData[i]!.mapTextItems,
        regionId: staticMapData[i]!.regionId,
        scorchedVictoryTowns: staticMapData[i]!.scorchedVictoryTowns,
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





async function updateDynamicMapDataInterval()
{
  if (!mapData)
    return initializeMapData()

  debug("updating dynamic map data")

  try
  {
    const promises: Promise<unknown>[] = []
    Object.entries(mapData).forEach(([mapId, map]) =>
    {
      const promise = fetchDynamicMapData(mapId)
        .then((dynamicData) => map.dynamic = dynamicData.mapItems)

      promises.push(promise)
    })

    await Promise.all(promises)
    debug("dynamic map data updated")

    syncMapData()
  }
  catch(error)
  {
    debug("error updating dynamic map data: %O", error)
    console.error("updateDynamicMapDataInterval: error updating dynamic map data", error)
  }
}


let updateIntervalTimeout: NodeJS.Timeout
export function startDynamicMapDataUpdateInterval()
{
  debug("starting 60-second dynamic map data update interval")
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


  const requestMapDataUpdateHandler: RequestResponseHandler<MapData> = (iteration, callback) =>
  {
    dlog("map data update requested for iteration %d", iteration)

    const lastIteration = getLastIterationNumber(Identifier.MapData)
    dlog("latest map data iteration is %d", lastIteration)

    if (iteration === lastIteration)
    {
      callback({ iteration: lastIteration })
      dlog("map data is up to date, no data sent")
      return
    }

    if (!mapData)
    {
      callback({ iteration: lastIteration })
      dlog("no map data available on server, no data sent", lastIteration)
      return
    }


    if (!iteration || iteration < 0)
    {
      callback({ iteration: lastIteration, full: mapData })
      dlog("update for invalid iteration requested, sending full map data")
      return
    }


    const delta = getDeltaForIteration(Identifier.MapData, iteration)
    if (!delta)
    {
      callback({ iteration: lastIteration, full: mapData })
      dlog(
        "no delta available for iteration %d to %d, sending full map data instead",
        iteration,
        lastIteration,
      )
      return
    }


    else
    {
      callback({ iteration: lastIteration, delta })
      dlog("sending delta for iteration %d to %d", iteration, lastIteration)
      return
    }
  }


  socket.on(Events.REQUEST_MAP_DATA, requestMapDataUpdateHandler)
  dlog("handlers registered")
}
