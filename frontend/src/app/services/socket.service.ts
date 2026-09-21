import { effect, inject, Injectable, signal, untracked } from "@angular/core"
import { io } from "socket.io-client"
import { AuthService } from "./auth.service"
import { toast } from "@spartan-ng/brain/sonner"





@Injectable({ providedIn: "root" })
export class SocketService
{
  private readonly auth = inject(AuthService)

  public readonly socket = signal(io({
    ackTimeout: 10000,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 23 * 1000,
    rememberUpgrade: true,
  }))

  public readonly connected = signal(false)



  constructor()
  {
    const socket = this.socket()

    socket.on("connect", this.socketConnectHandler)
    socket.on("disconnect", this.socketDisconnectHandler)

    this.socket.set(socket)

    effect(() =>
    {
      if (this.auth.session())
        socket.connect()
      else
        socket.disconnect()
    })

    effect(() =>
    {
      const connected = this.connected()
      const session = this.auth.session()

      untracked(() =>
      {
        if (!connected && session)
          toast.error(
            "Backend connection lost. attempting reconnect...",
            {
              id: "socket-io-connection-lost",
              duration: 1000 * 60 * 60,
              dismissible: false,
            },
          )
        else
          toast.dismiss("socket-io-connection-lost")
      })
    })
  }

  private socketConnectHandler = () => this.connected.set(true)
  private socketDisconnectHandler = () => this.connected.set(false)
}
