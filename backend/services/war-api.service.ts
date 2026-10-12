import type { WarAPI } from "@loc/types"


import Debug from "debug"
const debug = Debug("loc:service:war-api")
debug("loading war-api service module")





const ROOT_URL = "https://war-service-live.foxholeservices.com/api"
// const ROOT_URL = "https://war-service-live-2.foxholeservices.com/api"
// const ROOT_URL = "https://war-service-dev.foxholeservices.com/api"

debug("Root URL: %s", ROOT_URL)





const REQUEST_TIMEOUT_MS = 10 * 1000

async function fetchJson(url: string): Promise<unknown>
{
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok)
    throw Error(`WarAPI responded with status ${response.status} for ${url}`)

  return response.json()
}





export async function fetchMapList()
{
  const endpointUrl = `/worldconquest/maps`
  debug("fetching map list")

  try
  {
    const data = await fetchJson(`${ROOT_URL}${endpointUrl}`)
    debug("map list data %o", data)

    if (isMapList(data))
    {
      debug(`received ${data.length} maps`)
      return data
    }
    else throw Error("Invalid response from WarAPI")

  }
  catch (error)
  {
    debug("fetchMapList error %O", error)
    throw Error("Invalid response from WarAPI", { cause: error })
  }
}





export async function fetchStaticMapData(mapId: string)
{
  if (!mapId) throw Error("InvalidInput")

  const endpointUrl = `/worldconquest/maps/${mapId}/static`
  debug(`fetchStaticMapData`)

  const data = await fetchJson(`${ROOT_URL}${endpointUrl}`)
  debug("fetchStaticMapData data %o", data)

  if (isMapDataStatic(data))
  {
    debug(`fetchStaticMapData: received static map data,
      regionId=${data.regionId}, textItems=${data.mapTextItems.length}`)
    return data
  }
  else throw Error("Invalid response from WarAPI")
}





export async function fetchDynamicMapData(mapId: string)
{
  if (!mapId) throw Error("InvalidInput")

  const endpointUrl = `/worldconquest/maps/${mapId}/dynamic/public`
  debug(`fetchDynamicMapData`)

  const data = await fetchJson(`${ROOT_URL}${endpointUrl}`)
  debug("fetchDynamicMapData data %o", data)

  if (isMapDataDynamic(data))
  {
    debug(`fetchDynamicMapData: received dynamic map data,
      regionId=${data.regionId}, items=${data.mapItems.length}`)
    return data
  }
  else throw Error("Invalid response from WarAPI")
}





// #region Type Guards





function isMapList(data: unknown): data is WarAPI.MapList
{
  if (!Array.isArray(data))
    return false

  return data.every((item) => typeof item === "string")
}





function isMapDataDynamic(data: unknown): data is WarAPI.MapDataDynamic
{
  if (typeof data !== "object" || data === null)
    return false

  if (!("regionId" in data && Number.isInteger(data.regionId)))
    return false

  if ("mapItems" in data && Array.isArray(data.mapItems))
    return true

  return false
}





function isMapDataStatic(data: unknown): data is WarAPI.MapDataStatic
{
  if (typeof data !== "object" || data === null)
    return false

  if (!("regionId" in data && Number.isInteger(data.regionId)))
    return false

  if ("mapTextItems" in data && Array.isArray(data.mapTextItems))
    return true

  return false
}