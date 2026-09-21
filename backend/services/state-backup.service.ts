import Debug from "debug"
const debug = Debug("loc:service:state-backup")

import db from "./db.service.ts"
import { stateBackupsTable } from "../database/schema/schema.ts"
import { and, desc, eq, lt, notInArray, sql } from "drizzle-orm"
import { getLastIterationNumber, Identifier } from "./diff.service.ts"
import { initializeOpsBaseData, opsBaseList } from "./ops-base.service.ts"
import { initializeOrderData, orderList } from "./order.service.ts"
import { initializeInfoLayerData, infoLayer } from "./info-layer.service.ts"


let lastOrdersIteration = -1
let lastOpsBasesIteration = -1
let lastInfoLayerIteration = -1


export async function backupRelevantState()
{
  debug("backing up relevant state to database")
  if (lastOrdersIteration === getLastIterationNumber(Identifier.Orders) &&
     lastOpsBasesIteration === getLastIterationNumber(Identifier.OpsBase) &&
     lastInfoLayerIteration === getLastIterationNumber(Identifier.InfoLayer))
  {
    debug("no changes in relevant state since last backup, skipping")
    return
  }

  lastOrdersIteration = getLastIterationNumber(Identifier.Orders)
  lastOpsBasesIteration = getLastIterationNumber(Identifier.OpsBase)
  lastInfoLayerIteration = getLastIterationNumber(Identifier.InfoLayer)


  const orders = orderList
  const opsBases = opsBaseList
  const infoLayerObject = infoLayer

  await db.insert(stateBackupsTable).values({
    opsBases: opsBases,
    orders: orders,
    infoLayer: infoLayerObject,
  }).catch((e) => debug("error backing up state to database: %o", e))

  debug("state backup completed")


  try
  {
  /** cleanup backups older than 60min - keep at least ten */
    const lastTenBackups = db.$with("lastTenBackups")
      .as(db.select({ id: stateBackupsTable.id })
        .from(stateBackupsTable)
        .limit(10)
        .orderBy(desc(stateBackupsTable.time)))

    const del = await db.with(lastTenBackups)
      .delete(stateBackupsTable)
      .where(and(
        lt(stateBackupsTable.time, new Date(Date.now() - 1000 * 60 * 60)),
        notInArray(stateBackupsTable.id, sql`(select id from ${lastTenBackups})`),
      )).catch((e) => debug("error cleaning up old state backups: %o", e))

    if (del)
      debug("cleaned up %o old state backups", del.changes)
  }
  catch(e)
  {
    debug("error cleaning up old state backups: %o", e)
  }
}





export async function restoreStateFromBackup(id?: number)
{
  if (id)
  {
    debug("restoring state backup with id %o from backup", id)
    const backup = await db.select()
      .from(stateBackupsTable)
      .where(eq(stateBackupsTable.id, id))
      .limit(1)
      .catch((e) =>
      {
        debug("error fetching backup with id %o from state backup: %o", id, e)
        return null
      })

    if (!backup || backup.length === 0)
      return debug("no state backup found with id %o", id)

    initializeOpsBaseData(backup[0]?.opsBases)
    initializeOrderData(backup[0]?.orders)
    initializeInfoLayerData(backup[0]?.infoLayer)
  }
  else
  {
    debug("restoring latest state backup from backup")
    const backup = await db.select()
      .from(stateBackupsTable)
      .orderBy(desc(stateBackupsTable.time))
      .limit(1)
      .catch((e) =>
      {
        debug("error fetching latest state backup: %o", e)
        return null
      })

    if (!backup || backup.length === 0)
      return debug("no state backup found")

    initializeOpsBaseData(backup[0]?.opsBases)
    initializeOrderData(backup[0]?.orders)
    initializeInfoLayerData(backup[0]?.infoLayer)
  }
}





export async function getStateBackupsList()
{
  debug("fetching state backups list from database")
  const backups = await db.select({
    id: stateBackupsTable.id,
    time: stateBackupsTable.time,
  })
    .from(stateBackupsTable)
    .orderBy(desc(stateBackupsTable.time))
    .catch((e) =>
    {
      debug("error fetching state backups list from database: %o", e)
      return []
    })
  return backups
}