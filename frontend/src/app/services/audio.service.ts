import { inject, Injectable } from "@angular/core"
import dayjs from "dayjs"
import { LocalUserPreferenceService } from "./local-user-preference.service"

@Injectable({ providedIn: "root" })
export class AudioService
{
  private readonly playbackThrottleSeconds = 3
  private lastPlayed = dayjs()
  private volume = inject(LocalUserPreferenceService).audioVolume



  private canPlayAudio(): boolean // throttle audio playback, once every n seconds
  {
    return dayjs().diff(this.lastPlayed, "second") > this.playbackThrottleSeconds
  }



  public playAudio(url: string): void
  {
    if (this.canPlayAudio())
    {
      const audio = new Audio(url)
      audio.volume = this.volume()[0]
      audio.addEventListener("canplaythrough", () => void audio.play())
      this.lastPlayed = dayjs()
    }
  }





  public newOrderNotification(): void
  {
    setTimeout(() => this.playAudio("/audio/supplies.mp3"))
  }

  public orderCompletedNotification(): void
  {
    setTimeout(() => this.playAudio("/audio/supp_completed.mp3"))
  }
}
