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
  private templatesEpoch: string | undefined



  private readonly socketEffect = effect(() =>
  {
    const socket = this.socket()

    untracked(() =>
    {
      if (!socket)
        return

      socket.on(Events.SYNC_TEMPLATES, this.syncTemplatesHandler)
      socket.on("connect", this.setupSocketHandlers)

      if (socket.connected)
        this.setupSocketHandlers()
    })
  })



  private setupSocketHandlers = () =>
  {
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



  private reset()
  {
    this.templatesIteration.set(-1)
    this.templatesEpoch = undefined
    this.requestTemplatesUpdate()
  }



  private requestTemplatesUpdate()
  {
    const socket = this.socket()
    if (!socket || !socket.connected) return

    toast.loading("Requesting templates", { duration: 20000, id: "requesting-templates" })
    socket.emit(
      Events.REQUEST_TEMPLATES,
      this.templatesIteration(),
      this.templatesEpoch,
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

    if (response.full)
    {
      this.templatesIteration.set(response.iteration)
      this.templatesEpoch = response.epoch
      return this.templates.set(response.full)
    }

    const templates = this.templates()

    if (response.delta && response.delta.length > 0 && templates)
    {
      if (response.epoch !== this.templatesEpoch || this.templatesIteration() < 0)
        return this.reset()

      if (response.iteration === this.templatesIteration())
        return

      if (response.iteration < this.templatesIteration())
        return this.reset()

      try
      {
        response.delta.forEach((delta) => jsondiffpatch.patch(templates, delta))
      }
      catch
      {
        return this.reset()
      }

      this.templates.set([...templates])
      this.templatesIteration.set(response.iteration)
    }
  }


  private syncTemplatesHandler = (data: { iterationNumber: number, diff: Delta, epoch?: string }) =>
  {
    const { iterationNumber, diff, epoch } = data
    const templates = this.templates()

    if (!templates || !iterationNumber || !diff)
      return

    if (epoch !== this.templatesEpoch)
      return this.requestTemplatesUpdate()

    if (iterationNumber === this.templatesIteration())
      return

    if (iterationNumber < this.templatesIteration())
    {
      this.templatesIteration.set(-1)
      return this.requestTemplatesUpdate()
    }

    try
    {
      if (iterationNumber - this.templatesIteration() !== 1)
        return this.requestTemplatesUpdate()
      else
        jsondiffpatch.patch(templates, diff)
    }
    catch
    {
      this.templatesIteration.set(-1)
      return this.requestTemplatesUpdate()
    }

    this.templates.set([...templates])
    this.templatesIteration.set(iterationNumber)
  }
}
