/* eslint-disable sort-keys */
import { defaultBackendSettings, defaultFrontendSettings } from "@loc/common"
import { sql } from "drizzle-orm/sql"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import type { BackendSettings, FrontendSettings, OpsBase, SyncOrder, Template } from "@loc/types"





export const settingsTable = sqliteTable("settings", {
  backend: text({ mode: "json" }).$type<BackendSettings>().default(defaultBackendSettings),
  frontend: text({ mode: "json" }).$type<FrontendSettings>().default(defaultFrontendSettings),
})





export const templatesTable = sqliteTable("templates", {
  id: text({ length: 36 }).unique().primaryKey(),
  template: text({ mode: "json" }).$type<Template>().notNull(),
})




export const stateBackupsTable = sqliteTable(
  "state_backups",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    time: integer({ mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
    opsBases: text({ mode: "json" }).$type<OpsBase[]>(),
    orders: text({ mode: "json" }).$type<SyncOrder[]>(),
    infoLayer: text({ mode: "json" }).$type<Record<string, unknown>>(),
  },
)