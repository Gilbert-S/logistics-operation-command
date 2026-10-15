import type { Socket } from "socket.io"
import type { Template } from "@loc/types"
import { Events } from "@loc/common"
import { diffAndSync, Identifier } from "./diff.service.ts"
import { standardRequestHandler } from "../utils/standard-request-handler.ts"
import { logHandlerErrors } from "./socket.service.ts"
import db from "./db.service.ts"
import { templatesTable } from "../database/schema/schema.ts"
import { eq } from "drizzle-orm"


import Debug from "debug"
const debug = Debug("loc:service:templates")
debug("loading templates service module")




let templateList: Template[] = []





async function getTemplatesList()
{
  const result = await db.select().from(templatesTable)
  if (!result || result.length === 0)
    return

  templateList = result.map((row) => row.template)
  sortTemplatesByName(templateList)
}

export async function initializeTemplateData()
{
  debug("initializing Template data and syncing with clients")
  await getTemplatesList()
  diffAndSync(Identifier.Templates, Events.SYNC_TEMPLATES, templateList)
}





export function registerSocketTemplatesHandlers(socket: Socket)
{
  debug("registering handlers for socket %o", socket.id)
  const dlog = debug.extend(`socket:${ socket.id}`)



  standardRequestHandler({
    debugger: debug,
    event: Events.REQUEST_TEMPLATES,
    getData: () => templateList,
    identifier: Identifier.Templates,
    socket,
  })

  const updateTemplatesHandler = async (template: Template) =>
  {
    if (!template || !template.id || template.id.length != 36)
      return dlog("Invalid template data received for template update, ignoring")

    dlog("Template update received for template %o", template.id)

    if (template.name.length < 1 || template.name.length > 100)
      return dlog("Invalid template name received for template update, ignoring")

    try
    {
      await db.insert(templatesTable).values({ id: template.id, template }).onConflictDoUpdate({
        target: templatesTable.id,
        set: { template },
      })

      dlog("Template %o updated successfully in db", template.id)
      templateList = templateList.filter((t) => t.id !== template.id)
      templateList.push(template)
      sortTemplatesByName(templateList)
      diffAndSync(Identifier.Templates, Events.SYNC_TEMPLATES, templateList)
      dlog("Template %o update synced to clients", template.id)
    }
    catch (error)
    {
      dlog("Error updating template %o: %o", template.id, error)
    }
  }



  const deleteTemplatesHandler = async (templateId: string) =>
  {
    if (!templateId || templateId.length != 36)
      return dlog("Invalid template id received for template deletion, ignoring")

    dlog("Template deletion received for template %o", templateId)

    try
    {
      await db.delete(templatesTable).where(eq(templatesTable.id, templateId))
      dlog("Template %o deleted successfully from db", templateId)
      templateList = templateList.filter((t) => t.id !== templateId)
      diffAndSync(Identifier.Templates, Events.SYNC_TEMPLATES, templateList)
      dlog("Template %o deletion synced to clients", templateId)
    }
    catch (error)
    {
      dlog("Error deleting template %o: %o", templateId, error)
    }
  }




  socket.on(Events.TEMPLATE_UPDATE, logHandlerErrors(updateTemplatesHandler))
  socket.on(Events.TEMPLATE_DELETE, logHandlerErrors(deleteTemplatesHandler))
  dlog("handlers registered")
}


function sortTemplatesByName(templates: Template[]): Template[]
{
  return templates.sort((a, b) => a.name.localeCompare(b.name))
}