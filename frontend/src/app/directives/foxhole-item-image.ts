import { booleanAttribute, computed, Directive, inject, input, linkedSignal } from "@angular/core"
import { ItemCategory, type Item } from "../config/items"
import { classes } from "@spartan-ng/helm/utils"
import { environment } from "../../environments/environment"
import { LocalUserPreferenceService } from "../services/local-user-preference.service"

@Directive({
  selector: "[appFoxholeItemImage]",
  host: {
    "(error)": "onError()",
    "[attr.alt]": "alt()",
    "[attr.data-codeName]": "appFoxholeItemImage().CodeName",
    "[attr.data-listvariant]": "forListVariant() ? '' : null",
    "[attr.src]": "src()",
  },
})
export class FoxholeItemImage
{
  readonly appFoxholeItemImage = input.required<Item>()
  readonly forListVariant = input(false, { transform: booleanAttribute })

  private CDNBaseUrl = environment.CDNBaseUrl

  private readonly _iconMod = inject(LocalUserPreferenceService).iconMod.asReadonly()
  private readonly iconMod = linkedSignal(() => this._iconMod())

  readonly alt = computed(() => this.appFoxholeItemImage().DisplayName)
  readonly src = computed(() =>
  {
    const icon = this.appFoxholeItemImage().Icon.replace(/\.[^/.]+$/, "")
    if (icon)
    {
      const mod = this.iconMod()
      return `${this.CDNBaseUrl}/item-icons/${mod}/${icon}.png`
    }
    else
      return `${this.CDNBaseUrl}/item-icons/default/War/Content/Textures/UI/ItemIcons/LoreRock.png`

  })


  constructor()
  {
    classes(() =>
      [
        "size-16 rounded-sm border-2 p-1 select-none",
        "data-listvariant:size-12 relative",
        this.categoryClasses(),
        this.ShirtStackClasses(),
      ])
  }


  readonly categoryClasses = computed(() =>
  {
    switch (this.appFoxholeItemImage().ItemCategory)
    {
      case ItemCategory.HeavyAmmo: return "border-red-500/50 bg-red-500/10"
      case ItemCategory.HeavyArms: return "border-amber-500/50 bg-amber-500/10"
      case ItemCategory.Medical: return "border-lime-500/50 bg-lime-500/10"
      case ItemCategory.Parts: return "border-violet-500/50 bg-violet-500/10"
      case ItemCategory.SmallArms: return "border-yellow-300/50 bg-yellow-300/10"
      case ItemCategory.Supplies: return "border-stone-500 bg-stone-500/10"
      case ItemCategory.Utility: return "border-sky-500/50 bg-sky-500/10"
      case ItemCategory.Custom: return "border-pink-500/50 bg-pink-500/20"
      case ItemCategory.Uniform: return "border-mist-500/50 bg-mist-500/10"
      default: return ""
    }
  })

  readonly ShirtStackClasses = computed(() =>
  {
    if (this.appFoxholeItemImage().CodeName === "ShirtStack")
      return "animate-pulse border-red-500 bg-transparent shadow-md shadow-red-500/50"
    return ""
  })

  onError = () => this.iconMod.set("default")

}