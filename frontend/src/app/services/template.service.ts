import { effect, inject, Injectable, signal, untracked } from "@angular/core"
import { SocketService } from "./socket.service"
import { Events } from "@loc/common"
import { RequestResponse, Template } from "@loc/types"
import jsondiffpatch, { type Delta } from "@loc/jdp"
import { toast } from "@spartan-ng/brain/sonner"


@Injectable({ providedIn: "root" })
export class TemplateService
{
  protected readonly socket = inject(SocketService).socket

  public readonly templates = signal<Template[] | null>(null)
  private readonly templatesIteration = signal(-1)



  private readonly socketEffect = effect(() =>
  {
    const socket = this.socket()

    untracked(() =>
    {
      if (!socket)
        return

      if (!socket.connected)
        socket.once("connect", () => this.setupSocketHandlers())

      else
        this.setupSocketHandlers()
    })
  })



  private setupSocketHandlers = () =>
  {
    this.socket().on(Events.SYNC_TEMPLATES, this.syncTemplatesHandler)
    this.requestTemplatesUpdate()
  }



  public saveTemplate(template: Template)
  {
    if (!template || !template.id || !template.name || !template.items)
      return toast.error("Cannot save template: invalid template", { duration: 10000 })

    const socket = this.socket()
    if (!socket || !socket.connected)
      return toast.error("Cannot save template: no connection. to backend", { duration: 10000 })


    socket.emit(
      Events.TEMPLATE_UPDATE,
      template,
    )

    toast.success(`Template "${ template.name }" saved`)
    return
  }



  public deleteTemplate(templateId: string)
  {
    if (!templateId)
      return toast.error("Cannot delete template: invalid template id", { duration: 10000 })

    const socket = this.socket()
    if (!socket || !socket.connected)
      return toast.error("Cannot delete template: no connection to backend", { duration: 10000 })

    socket.emit(
      Events.TEMPLATE_DELETE,
      templateId,
    )
    toast.success(`Template deleted`)
    return
  }



  private requestTemplatesUpdate()
  {
    const socket = this.socket()
    if (!socket || !socket.connected) return

    toast.loading("Requesting templates", { duration: 20000, id: "requesting-templates" })
    socket.emit(
      Events.REQUEST_TEMPLATES,
      this.templatesIteration(),
      this.requestResponseHandler,
    )
  }

  private requestResponseHandler = (error: Error, response: RequestResponse<Template[]>) =>
  {
    toast.dismiss("requesting-templates")

    if (error)
      toast.error(`Error requesting templates update: ${ error.message}`, { duration: 10000 })

    if (!response)
      return

    this.templatesIteration.set(response.iteration)

    if (response.full)
      return this.templates.set(response.full)

    const templates = this.templates()

    if (response.delta && templates)
    {
      response.delta.forEach((delta) =>
      {
        jsondiffpatch.patch(templates, delta)
      })
      this.templates.set([...templates])
    }
  }


  private syncTemplatesHandler = (data: { iterationNumber: number, diff: Delta }) =>
  {
    const { iterationNumber, diff } = data
    const templates = this.templates()

    if (!templates || !iterationNumber || !diff)
      return

    if (iterationNumber < this.templatesIteration())
    {
      this.templatesIteration.set(-1)
      return this.requestTemplatesUpdate()
    }

    if (iterationNumber - this.templatesIteration() !== 1)
      return this.requestTemplatesUpdate()
    else
      jsondiffpatch.patch(templates, diff)

    this.templates.set([...templates])
    this.templatesIteration.set(iterationNumber)
  }
}
