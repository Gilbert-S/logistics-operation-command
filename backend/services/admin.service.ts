import Debug from "debug"
const debug = Debug("loc:service:admin")


import type { Socket } from "socket.io"
import { clearIterationStore, Identifier } from "./diff.service.ts"
import { initializeOrderData } from "./order.service.ts"
import { initializeOpsBaseData } from "./ops-base.service.ts"
import { initializeMapData, startDynamicMapDataUpdateInterval, stopDynamicMapDataUpdateInterval }
  from "./map-data.service.ts"
import Events from "@loc/common"
import { getStateBackupsList, restoreStateFromBackup } from "./state-backup.service.ts"
import type { BackendSettings, FrontendSettings } from "@loc/types"
import { updateBackendSettings, updateFrontendSettings } from "./settings.service.ts"
import * as z from "zod"
import { initializeInfoLayerData } from "./info-layer.service.ts"





export function registerSocketAdminHandlers(socket: Socket)
{
  if (socket.session && socket.session.user && socket.session.user.role === "admin")
  {
    debug("registering socket admin handlers for socket %o", socket.id)
    socket.on(Events.ADMIN_RESET_DATA, resetData)
    socket.on(Events.ADMIN_BACKUP_LIST, getBackupsList)
    socket.on(Events.ADMIN_BACKUP_RESTORE, restoreBackup)
    socket.on(Events.ADMIN_FRONTEND_SETTINGS, saveFrontendSettings)
    socket.on(Events.ADMIN_BACKEND_SETTINGS, saveBackendSettings)
  }
  else
    debug("skipping registering admin handlers for socket. regular user")
}


async function resetData(
  type: "infolayer" | "orders" | "bases" | "all",
  callback: (response: boolean | Error) => void,
)
{
  debug("resetData: %o", type)

  try
  {
    if (type === "infolayer" || type === "bases" || type === "all")
    {
      clearIterationStore(Identifier.InfoLayer)
      initializeInfoLayerData({})
      debug("InfoLayer reset complete")
    }

    if (type === "orders" || type === "bases" || type === "all")
    {
      clearIterationStore(Identifier.Orders)
      initializeOrderData([])
      debug("Order data reset complete")
    }

    if (type === "bases" || type === "all")
    {
      clearIterationStore(Identifier.OpsBase)
      initializeOpsBaseData([])
      debug("OpsBase data reset complete")
    }

    if (type === "all")
    {
      stopDynamicMapDataUpdateInterval()
      clearIterationStore(Identifier.MapData)
      await initializeMapData()
      startDynamicMapDataUpdateInterval()
      debug("MapData reset complete")
    }

    callback(true)
  }
  catch(error)
  {
    const message = error instanceof Error ? error.message : "Unknown error"
    debug("resetData: error resetting data: %o", message)
    callback(Error(message))
    return
  }
}



type response = Awaited<ReturnType<typeof getStateBackupsList>>
async function getBackupsList(callback: (response: response) => void)
{
  debug("fetching state backups list from database")
  const backups = await getStateBackupsList()
  callback(backups)
}


async function restoreBackup(
  id: number | undefined,
  callback: (response: boolean | Error) => void,
)
{
  debug("restoring state backup with id %o", id)
  try
  {
    await restoreStateFromBackup(id)
    callback(true)
  }
  catch(error)
  {
    const message = error instanceof Error ? error.message : "Unknown error"
    debug("restoreBackup: error restoring backup: %o", message)
    callback(Error(message))
    return
  }
}



const frontendSchema = z.object({
  "orders.display-completed-for": z.number().positive().lte(9999).optional(),
  "deliveries.display-completed-for": z.number().positive().lte(9999).optional(),
})

async function saveFrontendSettings(settings: Partial<FrontendSettings>)
{
  debug("updating frontend settings in db: %o", settings)
  try
  {
    frontendSchema.parse(settings)
    await updateFrontendSettings(settings)
  }
  catch (error)
  {
    debug("updateFrontendSettings: error updating frontend settings: %o", error)
  }
}


const backendSchema = z.object({
  "auth.permitted-roles": z.array(z.string().min(17).max(19).regex(/^[0-9]+$/)).optional(),
  "auth.admin-roles": z.array(z.string().min(17).max(19).regex(/^[0-9]+$/)).optional(),
  "presence.cutoff-hours": z.number().positive().lte(9999),
})

async function saveBackendSettings(settings: Partial<BackendSettings>)
{
  debug("updating backend settings in db: %o", settings)
  try
  {
    backendSchema.parse(settings)
    await updateBackendSettings(settings)
  }
  catch (error)
  {
    debug("updateBackendSettings: error updating backend settings: %o", error)
  }
}
