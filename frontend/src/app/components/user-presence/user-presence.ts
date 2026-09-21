import { Component, computed, inject } from "@angular/core"
import { PresenceService } from "../../services/presence.service"
import { HlmItemImports } from "@spartan-ng/helm/item"
import { UserAvatar } from "../user-avatar/user-avatar"
import { FromNowPipe } from "../../pipes/from-now-pipe"
import { SignalPipe } from "../../pipes/signal-pipe"

@Component({
  selector: "app-user-presence",
  imports: [HlmItemImports, UserAvatar, FromNowPipe, SignalPipe],
  template: `
    @for (user of presence(); track user.id)
    {
      <hlm-item class="flex-nowrap border border-border py-1.5 hover:bg-muted" variant="muted">
        <hlm-item-media class="relative">
          <app-user-avatar size="large"  [userName]="user.name"
            [avatarUrl]="user.image"  />
          <span id="indicator" class="
            absolute right-0 bottom-0 size-2.5 rounded-full bg-ring outline-3 outline-background
          " [class.bg-success]="user.sessions[0]?.online"  [class.bg-muted]="!user.sessions[0]?.online"></span>
        </hlm-item-media>
        <hlm-item-content class="overflow-hidden">
          <hlm-item-title class="w-full" [class.text-muted-foreground]="!user.sessions[0]?.online">
            <span class="truncate text-sm font-normal">{{user.name}}</span>
          </hlm-item-title>
        </hlm-item-content>
        @if(!user.sessions[0]?.online)
        {
          <hlm-item-actions>
            {{user.sessions[0]?.last_seen | fromNow | signal}}
          </hlm-item-actions>
        }
      </hlm-item>
    }
  `,
})
export class UserPresence
{
  presenceService = inject(PresenceService)
  readonly presence = computed(() =>
    this.presenceService.presences()
      .sort((a, b) =>
      {
        const aOnline = a.sessions[0]?.online ? 1 : 0
        const bOnline = b.sessions[0]?.online ? 1 : 0
        return bOnline - aOnline
      }))

  readonly online = computed(() => this.presence()?.filter((p) => p.sessions[0]?.online) ?? [])
  readonly offline = computed(() => this.presence()?.filter((p) => !p.sessions[0]?.online) ?? [])

}
