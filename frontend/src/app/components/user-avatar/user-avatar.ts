import { Component, computed, input } from "@angular/core"
import { HlmAvatarImports } from "@spartan-ng/helm/avatar"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"

@Component({
  selector: "app-user-avatar",
  imports: [HlmAvatarImports, HlmTooltipImports],
  template: `
    <hlm-avatar [class.size-7]="small()" [class.size-10]="large()" [hlmTooltip]="userName()||''">
      <img hlmAvatarImage [alt]="'Avatar for ' + userName()" [src]="avatarUrl()" />
      <span hlmAvatarFallback>{{userNameInitial()}}</span>
    </hlm-avatar>
  `,
})
export class UserAvatar
{
  public readonly avatarUrl = input<string | null | undefined>(null)
  public readonly userName = input<string | null | undefined>(null)

  public readonly size = input<"small" | "large">("large")
  public readonly small = computed(() => this.size() === "small")
  public readonly large = computed(() => this.size() === "large")


  public readonly userNameInitial = computed(() =>
  {
    const name = this.userName()
    if (!name)
      return "?"

    // first letter after [82DK ...] clan tag
    return name.match(/\[.*\]\s(\w)/)?.[1] || "?"
  })
}
