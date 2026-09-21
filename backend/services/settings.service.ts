import Debug from "debug"
const debug = Debug("loc:service:settings")
debug("loading settings service module")


import type { Socket } from "socket.io"
import type { BackendSettings, FrontendSettings } from "@loc/types"
import { defaultBackendSettings, defaultFrontendSettings, Events } from "@loc/common"
import db from "./db.service.ts"
import { settingsTable } from "../database/schema/schema.ts"
import { getSocketIOInstance } from "./socket.service.ts"
import { sql } from "drizzle-orm"





export const settings = {
  backend: defaultBackendSettings,
  frontend: defaultFrontendSettings,
}





export async function getSettingsFromDb()
{
  debug("fetching settings from db")
  try
  {
    const result = await db.select().from(settingsTable).limit(1)

    if (result.length === 0)
    {
      debug("no settings found in db, inserting default settings")
      await db.insert(settingsTable).values({
        backend: defaultBackendSettings,
        frontend: defaultFrontendSettings,
      })
    }

    if (result.length > 1)
    {
      debug("more than one settings row found in db, deleteing all but first one")
      db.delete(settingsTable).where(sql`1 = 1 LIMIT 9999 OFFSET 1`)
    }

    settings.backend = result[0]?.backend ?? defaultBackendSettings
    settings.frontend = result[0]?.frontend ?? defaultFrontendSettings
    debug("settings fetched from db: %o", settings)
  }
  catch (error)
  {
    debug("error fetching settings from db: %o", error)
  }
}





export async function updateFrontendSettings(update: Partial<FrontendSettings>)
{
  debug("updating frontend settings in db: %o", update)

  try
  {
    const newSettings = { ...settings.frontend, ...update }
    await db.update(settingsTable).set({ frontend: newSettings })

    debug("frontend settings updated in db")
    await getSettingsFromDb()
    syncSettings()
    debug("frontend settings synced to clients")
  }
  catch (error)
  {
    debug("error updating frontend settings in db: %o", error)
  }
}


export async function updateBackendSettings(update: Partial<BackendSettings>)
{
  debug("updating backend settings in db: %o", update)

  try
  {
    const newSettings = { ...settings.backend, ...update }
    await db.update(settingsTable).set({ backend: newSettings })
    debug("backend settings updated in db")
    await getSettingsFromDb()
  }
  catch (error)
  {
    debug("error updating backend settings in db: %o", error)
  }
}





export function registerSocketSettingsHandlers(socket: Socket)
{
  const dlog = debug.extend(`socket:${ socket.id}`)
  dlog("No socket handlers, only initial sync")
  socket.emit(Events.SYNC_SETTINGS, settings)
}


function syncSettings()
{
  debug("syncing settings to clients")
  const io = getSocketIOInstance()
  io.emit(Events.SYNC_SETTINGS, settings)
}