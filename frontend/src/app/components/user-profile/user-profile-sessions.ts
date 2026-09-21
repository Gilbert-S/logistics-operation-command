import { Component, computed, inject, signal } from "@angular/core"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmFieldImports } from "@spartan-ng/helm/field"
import { HlmIcon } from "@spartan-ng/helm/icon"
import { HlmItemImports } from "@spartan-ng/helm/item"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { FromNowPipe } from "../../pipes/from-now-pipe"
import { SignalPipe } from "../../pipes/signal-pipe"
import { UserAgentPipe } from "../../pipes/user-agent-pipe"
import { AuthService } from "../../services/auth.service"
import { toast } from "@spartan-ng/brain/sonner"
import {
  lucideMonitor,
  lucideMonitorCheck,
  lucideRefreshCw,
  lucideTrash2,
} from "@ng-icons/lucide"
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"

@Component({
  selector: "app-user-profile-sessions",

  imports: [
    HlmFieldImports,
    FromNowPipe,
    SignalPipe,
    HlmItemImports,
    NgIcon,
    HlmIcon,
    UserAgentPipe,
    HlmButtonImports,
    HlmTooltipImports,
    HlmSpinnerImports,
    HlmDropdownMenuImports,
  ],
  providers: [
    provideIcons({
      lucideMonitor,
      lucideMonitorCheck,
      lucideRefreshCw,
      lucideTrash2,
    }),
  ],

  template: `
    <fieldset hlmFieldSet class="gap-10 rounded-sm border bg-input/10 p-3">
      <section class="flex flex-row items-start gap-1">
        <div class="grow">
          <legend hlmFieldLegend>User Sessions</legend>
          <p hlmFieldDescription>Manage your authentication sessions</p>
        </div>
        <button hlmBtn variant="destructive" size="sm" class="cursor-pointer" hlmTooltip="Revoke All Sessions"
          [disabled]="sessionList().length === 0" [showDelay]="500" (click)="revokeAll()">
          Revoke All
        </button>
        <button hlmBtn variant="outline" size="sm" class="cursor-pointer" hlmTooltip="Revoke all other Sessions except your current one"
          [disabled]="sessionList().length <= 1" [showDelay]="500" (click)="revokeOther()">
          Revoke Others
        </button>
        <div class="shrink-0" hlmTooltip="recently refreshed. please wait."
          [showDelay]="500" [tooltipDisabled]="!recentlyUpdated()">
          <button hlmBtn variant="ghost" class="cursor-pointer" hlmTooltip="Refresh Sessions List"
            [disabled]="recentlyUpdated()"  [showDelay]="500" (click)="updateSessionList()">
            @if(updating()) {
              <hlm-spinner/>
            }
            @else {
              <ng-icon hlm name="lucideRefreshCw" size="sm" hlmTooltip="test"/>
            }
          </button>
        </div>
      </section>
      <div hlmFieldGroup class="max-h-55 min-h-0 gap-2 overflow-y-auto not-firefox:scroll-fade">
        @for (session of sessionList(); track session.id)
        {
          <div hlmField>
            <hlm-item variant="outline" class="bg-popover">
              <hlm-item-media variant="icon" class="">
                @if (isMySession(session)) {
                  <span hlmTooltip="Current Session">
                    <ng-icon class="text-accent-foreground" hlm name="lucideMonitorCheck"/>
                  </span>
                }
                @else {
                  <ng-icon hlm name="lucideMonitor" />
                }
              </hlm-item-media>
              <hlm-item-content class="min-w-0">
                <hlm-item-title class="w-full">
                  <span class="w-full truncate">
                    {{session.userAgent | userAgent}}
                  </span>
                </hlm-item-title>
                <p hlmItemDescription>
                  Updated: {{session.updatedAt | fromNow | signal}} &mdash;
                  Created: {{session.createdAt | fromNow | signal}} &mdash;
                  Expires: {{session.expiresAt | fromNow | signal}}
                </p>
              </hlm-item-content>
              <hlm-item-actions>
                <button hlmBtn size="icon" variant="ghost" hlmTooltip="Revoke Session"
                  [disabled]="isMySession(session)" [showDelay]="500" (click)="revoke(session)">
                  <ng-icon hlm name="lucideTrash2" size="sm" />
                </button>
              </hlm-item-actions>
            </hlm-item>
          </div>
        }
      </div>
    </fieldset>


  `,

  styles: `:host { display: block }`,
})
export class UserProfileSessions
{
  private readonly auth = inject(AuthService)

  readonly sessionList = signal<Awaited<ReturnType<typeof this.getSessionList>>>([])
  readonly currentSessionId = computed(() => this.auth.session()?.id)

  readonly updating = signal(false)
  readonly recentlyUpdated = signal(false)

  constructor()
  {
    void this.updateSessionList()
  }



  async updateSessionList()
  {
    if (this.recentlyUpdated())
      return

    this.updating.set(true)
    this.recentlyUpdated.set(true)
    const startTime = Date.now()
    const sessions = await this.getSessionList()

    this.sessionList.set(sessions)

    const timeout = 1500 - (Date.now() - startTime)
    setTimeout(() => this.recentlyUpdated.set(false), 20 * 1000)
    setTimeout(() => this.updating.set(false), timeout)
  }

  async getSessionList()
  {
    try
    {
      const response = await this.auth.getSessions()
      return response?.data || []
    }
    catch (error)
    {
      const message = error instanceof Error ? error.message : String(error)

      toast.error(
        "Failed to fetch sessions list",
        { duration: 10000, description: message },
      )

      return []
    }
  }

  isMySession(session: Awaited<ReturnType<typeof this.getSessionList>>[number]): boolean
  {
    return session.id === this.currentSessionId()
  }

  revoke(session: Awaited<ReturnType<typeof this.getSessionList>>[number])
  {
    void this.auth.revoke(session)
  }

  revokeOther()
  {
    void this.auth.revokeOther()
  }

  revokeAll()
  {
    void this.auth.revokeAll()
  }

}
