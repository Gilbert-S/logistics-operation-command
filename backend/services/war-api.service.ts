import type { WarAPI } from "@loc/types"


import Debug from "debug"
const debug = Debug("loc:service:war-api")
debug("loading war-api service module")





const ROOT_URL = "https://war-service-live.foxholeservices.com/api"
// const ROOT_URL = "https://war-service-live-2.foxholeservices.com/api"
// const ROOT_URL = "https://war-service-dev.foxholeservices.com/api"

debug("Root URL: %s", ROOT_URL)





export async function fetchMapList()
{
  const endpointUrl = `/worldconquest/maps`
  debug("fetching map list")

  try
  {
    const response = await fetch(`${ROOT_URL}${endpointUrl}`)
    const data = await response.json()

    debug("map list response %O", response)
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

  const response = await fetch(`${ROOT_URL}${endpointUrl}`)
  const data = await response.json()

  debug("fetchStaticMapData response %O", response)
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

  const response = await fetch(`${ROOT_URL}${endpointUrl}`)
  const data = await response.json()

  debug("fetchDynamicMapData response %O", response)
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