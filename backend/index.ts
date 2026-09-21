import Debug from "debug"
const debug = Debug("loc:index")
debug("initializing backend")


import { hono, startHonoServer } from "./services/hono.service.ts"
import { attachBetterAuthToHono } from "./services/auth.service.ts"
import { attachSocketEventHandlers, attachSocketIOToServer } from "./services/socket.service.ts"
import { initializeMapData, registerSocketMapDataHandlers, startDynamicMapDataUpdateInterval }
  from "./services/map-data.service.ts"
import { registerSocketOpsBaseHandlers } from "./services/ops-base.service.ts"
import { initializeTemplateData, registerSocketTemplatesHandlers }
  from "./services/template.service.ts"
import { registerSocketOrdersHandlers } from "./services/order.service.ts"
import { initializePresenceData, registerSocketPresenceHandlers }
  from "./services/presence.service.ts"
import { backupRelevantState, restoreStateFromBackup } from "./services/state-backup.service.ts"
import { registerSocketAdminHandlers } from "./services/admin.service.ts"
import { getSettingsFromDb, registerSocketSettingsHandlers } from "./services/settings.service.ts"
import { registerSocketInfoLayerHandlers } from "./services/info-layer.service.ts"





await getSettingsFromDb()
attachBetterAuthToHono(hono)
const honoServer = startHonoServer()
attachSocketIOToServer(honoServer)





attachSocketEventHandlers(
  registerSocketSettingsHandlers,
  registerSocketPresenceHandlers,
  registerSocketMapDataHandlers,
  registerSocketOpsBaseHandlers,
  registerSocketOrdersHandlers,
  registerSocketTemplatesHandlers,
  registerSocketAdminHandlers,
  registerSocketInfoLayerHandlers,
)





debug("starting map data initialization")
void initializeMapData()
void startDynamicMapDataUpdateInterval()

debug("starting opsBase, order & info-layer data backups interval")
setInterval(() => void backupRelevantState(), 5 * 60 * 1000)

void restoreStateFromBackup() // initializes opsBaseList, orderList and info-layer from last backup
void initializeTemplateData()
void initializePresenceData()