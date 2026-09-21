import { Component, computed, inject } from "@angular/core"
import { HlmFieldImports } from "@spartan-ng/helm/field"
import { AuthService } from "../../services/auth.service"
import { UserAvatar } from "../user-avatar/user-avatar"
import { HlmItemImports } from "@spartan-ng/helm/item"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { UserProfileSessions } from "./user-profile-sessions"
import { UserProfileSettings } from "./user-profile-settings"

@Component({
  selector: "app-user-profile-popover",
  imports: [
    HlmFieldImports,
    UserAvatar,
    HlmItemImports,
    HlmButtonImports,
    HlmTooltipImports,
    UserProfileSessions,
    UserProfileSettings,
  ],
  template: `
    <div hlmFieldGroup class="size-full overflow-hidden p-5">
      <fieldset hlmFieldSet class="min-h-0 w-full min-w-0 flex-1 gap-6">
        <header class="flex flex-row items-center gap-4">
          <app-user-avatar size="large" class="" [avatarUrl]="user()?.image" [userName]="user()?.name" />
          <section>
            <legend hlmFieldLegend>{{user()?.name}}</legend>
            <p hlmFieldDescription>User Profile</p>
          </section>
        </header>
        <div class="-m-4 flex min-h-0 flex-col gap-6 overflow-auto p-4 not-firefox:scroll-fade">
          <app-user-profile-settings/>
          <app-user-profile-sessions/>
        </div>
      </fieldset>
    </div>
  `,
})
export class UserProfilePopover
{
  private readonly auth = inject(AuthService)
  public readonly user = computed(() => this.auth.user())
}
