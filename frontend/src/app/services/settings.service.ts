import { effect, inject, Injectable, signal, untracked } from "@angular/core"
import { SocketService } from "./socket.service"
import { defaultSettings, Events } from "@loc/common"
import { Settings } from "@loc/types"

@Injectable({ providedIn: "root" })
export class SettingsService
{

  public readonly settings = signal<Settings>(defaultSettings)
  private readonly socket = inject(SocketService).socket

  private _socketEffect = effect(() =>
  {
    const socket = this.socket()
    untracked(() =>
    {
      if (!socket) return

      if (!socket.connected)
        socket.once("connect", () => this.setupSocketHandlers())
      else
        this.setupSocketHandlers()
    })
  })

  private setupSocketHandlers = () =>
  {
    this.socket().on(Events.SYNC_SETTINGS, this.syncSettingsHandler)
  }

  private syncSettingsHandler = (settings: Settings) => this.settings.set(settings)

}
