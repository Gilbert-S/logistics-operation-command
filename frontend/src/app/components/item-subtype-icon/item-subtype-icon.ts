import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal }
  from "@angular/core"
import { environment } from "../../../environments/environment"
import { LocalUserPreferenceService } from "../../services/local-user-preference.service"
import { Item, SubtypeIcons } from "../../config/items"

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-item-subtype-icon",
  imports: [],
  templateUrl: "./item-subtype-icon.html",
})
export class ItemSubtypeIcon
{
  readonly foxholeItem = input.required<Item>()

  private CDNBaseUrl = environment.CDNBaseUrl

  private readonly _iconMod = inject(LocalUserPreferenceService).iconMod.asReadonly()
  private readonly iconMod = linkedSignal(() => this._iconMod())

  readonly src = computed(() =>
  {
    const icon = SubtypeIcons[this.foxholeItem().CodeName]
    const mod = this.iconMod()
    if (icon)
      return `${this.CDNBaseUrl}/item-icons/${mod}/${icon}.png`

    return undefined
  })
}
