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
  private presencesEpoch: string | undefined



  private readonly socketEffect = effect(() =>
  {
    const socket = this.socket()

    untracked(() =>
    {
      if (!socket)
        return

      socket.on(Events.SYNC_PRESENCE, this.syncPresenceHandler)
      socket.on("connect", this.setupSocketHandlers)

      if (socket.connected)
        this.setupSocketHandlers()
    })
  })



  private setupSocketHandlers = () =>
  {
    this.requestPresenceUpdate()
  }





  private reset()
  {
    this.presencesIteration.set(-1)
    this.presencesEpoch = undefined
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
      this.presencesEpoch,
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


    if (response.full)
    {
      this.presences.set(response.full)
      this.presencesIteration.set(response.iteration)
      this.presencesEpoch = response.epoch
    }

    const presences = this.presences()

    if (response.delta && response.delta.length > 0 && presences)
    {
      if (response.epoch !== this.presencesEpoch || this.presencesIteration() < 0)
        return this.reset()

      if (response.iteration === this.presencesIteration())
        return

      if (response.iteration < this.presencesIteration())
        return this.reset()

      try
      {
        response.delta.forEach((delta) => jsondiffpatch.patch(presences, delta))
      }
      catch
      {
        return this.reset()
      }

      this.presences.set([...presences])
      this.presencesIteration.set(response.iteration)
    }
  }


  private syncPresenceHandler = (data: { iterationNumber: number, diff: Delta, epoch?: string }) =>
  {
    const { iterationNumber, diff, epoch } = data
    const presences = this.presences()

    if (!presences || !iterationNumber || !diff)
      return

    if (epoch !== this.presencesEpoch)
      return this.requestPresenceUpdate()

    if (iterationNumber === this.presencesIteration())
      return

    if (iterationNumber < this.presencesIteration())
    {
      this.presencesIteration.set(-1)
      return this.requestPresenceUpdate()
    }

    try
    {
      if (iterationNumber - this.presencesIteration() !== 1)
        return this.requestPresenceUpdate()
      else
        jsondiffpatch.patch(presences, diff)
    }
    catch
    {
      this.presencesIteration.set(-1)
      return this.requestPresenceUpdate()
    }

    this.presences.set([...presences])
    this.presencesIteration.set(iterationNumber)
  }
}
