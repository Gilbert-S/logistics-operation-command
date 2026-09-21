import { effect, inject, Injectable, signal, untracked } from "@angular/core"
import { SocketService } from "./socket.service"
import { Events } from "@loc/common"
import type { Presence, RequestResponse } from "@loc/types"
import jsondiffpatch, { type Delta } from "@loc/jdp"
import { toast } from "@spartan-ng/brain/sonner"


@Injectable({ providedIn: "root" })
export class PresenceService
{
  protected readonly socket = inject(SocketService).socket

  public readonly presences = signal<Presence[]>([])
  private readonly presencesIteration = signal(-1)



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
    this.socket().on(Events.SYNC_PRESENCE, this.syncPresenceHandler)
    this.requestPresenceUpdate()
  }





  private requestPresenceUpdate()
  {
    const socket = this.socket()
    if (!socket || !socket.connected) return

    toast.loading("Requesting presences", { duration: 20000, id: "requesting-presences" })
    socket.emit(
      Events.REQUEST_PRESENCE,
      this.presencesIteration(),
      this.requestResponseHandler,
    )
  }

  private requestResponseHandler = (error: Error, response: RequestResponse<Presence[]>) =>
  {
    toast.dismiss("requesting-presences")
    if (error)
      toast.error(`Error requesting presences update: ${error.message}`, { duration: 10000 })

    if (!response)
      return

    this.presencesIteration.set(response.iteration)

    if (response.full)
      this.presences.set(response.full)

    const presences = this.presences()

    if (response.delta && presences)
    {
      response.delta.forEach((delta) =>
      {
        jsondiffpatch.patch(presences, delta)
      })
      this.presences.set([...presences])
    }
  }


  private syncPresenceHandler = (data: { iterationNumber: number, diff: Delta }) =>
  {
    const { iterationNumber, diff } = data
    const presences = this.presences()

    if (!presences || !iterationNumber || !diff)
      return

    if (iterationNumber < this.presencesIteration())
    {
      this.presencesIteration.set(-1)
      return this.requestPresenceUpdate()
    }

    if (iterationNumber - this.presencesIteration() !== 1)
      return this.requestPresenceUpdate()
    else
      jsondiffpatch.patch(presences, diff)

    this.presences.set([...presences])
    this.presencesIteration.set(iterationNumber)
  }
}
