import { inject, Injectable, signal, WritableSignal } from "@angular/core"
import { default as L } from "leaflet"
import { Base } from "./base.service"
import { SocketService } from "./socket.service"





@Injectable({ providedIn: "root" })
export class ContextMenu
{
  private readonly connected = inject(SocketService).connected.asReadonly()
  public readonly contextEvent: WritableSignal<ContextMenuPayload | null> = signal(null)



  public contextMenuEventHandler = (event: L.LeafletMouseEvent, base: Base | null = null) =>
  {
    if (this.connected())
      this.contextEvent.set({ event, base })
  }
}


interface ContextMenuPayload { event: L.LeafletMouseEvent; base: Base | null }