import { effect, Injectable, signal } from "@angular/core"
import { DeliveryItemsVariant } from "@loc/types"
import { environment } from "../../environments/environment"




@Injectable({ providedIn: "root" })
export class LocalUserPreferenceService
{
  private storage = localStorage

  private defaults = {
    audioVolume: [0.8] as [number],
    iconMod: "default" as (typeof environment.availableIconMods)[number]["key"],
    itemListVariant: "icon" as DeliveryItemsVariant,
    mapMod: "WG-IX-02A" as (typeof environment.availableMapMods)[number]["key"],
    orderLayout: [27, 55, 18] as number[],
    sidebarLayout: [20, 80] as number[],
    theme: "dark" as "light" | "dark",
  }


  public readonly audioVolume = signal<[number]>(this.defaults.audioVolume)
  public readonly itemListVariant = signal<DeliveryItemsVariant>(this.defaults.itemListVariant)
  public readonly orderLayout = signal<number[]>(this.defaults.orderLayout)
  public readonly sidebarLayout = signal<number[]>(this.defaults.sidebarLayout)
  public readonly theme = signal<"light" | "dark">(this.defaults.theme)
  public readonly iconMod = signal<typeof this.defaults.iconMod>(this.defaults.iconMod)
  public readonly mapMod = signal<typeof this.defaults.mapMod>(this.defaults.mapMod)





  constructor()
  {
    const storedVariant = this.getStoredValue("itemListVariant")
    if (storedVariant)
      this.itemListVariant.set(storedVariant as ReturnType<typeof this.itemListVariant>)

    effect(() => this.setStoredValue("itemListVariant", this.itemListVariant()))

    // ---

    const storedTheme = this.getStoredValue("theme")
    if (storedTheme)
      this.theme.set(storedTheme as ReturnType<typeof this.theme>)

    effect(() => this.setStoredValue("theme", this.theme()))

    // ---

    const storedSidebarLayout = this.getStoredValue("sidebarLayout")
    if (storedSidebarLayout)
      this.sidebarLayout.set(storedSidebarLayout as ReturnType<typeof this.sidebarLayout>)

    effect(() => this.setStoredValue("sidebarLayout", this.sidebarLayout()))

    // ---

    const storedOrderLayout = this.getStoredValue("orderLayout")
    if (storedOrderLayout)
      this.orderLayout.set(storedOrderLayout as ReturnType<typeof this.orderLayout>)

    effect(() => this.setStoredValue("orderLayout", this.orderLayout()))

    // ---

    const storedAudioVolume = this.getStoredValue("audioVolume")
    if (storedAudioVolume)
    {
      const validVolume = Number(storedAudioVolume) < 0 || Number(storedAudioVolume) > 1
        ? this.defaults.audioVolume : [Number(storedAudioVolume)] as [number]
      this.audioVolume.set(validVolume)
    }

    effect(() => this.setStoredValue("audioVolume", this.audioVolume()))

    // ---

    const storedIconMod = this.getStoredValue("iconMod")
    if (storedIconMod)
      this.iconMod.set(storedIconMod as ReturnType<typeof this.iconMod>)

    effect(() => this.setStoredValue("iconMod", this.iconMod()))

    // ---

    const storedMapMod = this.getStoredValue("mapMod")
    if (storedMapMod)
      this.mapMod.set(storedMapMod as ReturnType<typeof this.mapMod>)

    effect(() => this.setStoredValue("mapMod", this.mapMod()))
  }





  private getStoredValue(key:string): unknown
  {
    const storedValue = this.storage.getItem(key)
    try { return JSON.parse(storedValue || "null") }
    catch { console.error(`Error parsing setting from local storage`, key) }
    return null
  }

  private setStoredValue(key:string, value: unknown): void
  {
    try
    {
      const json = JSON.stringify(value || null)
      this.storage.setItem(key, json)
    }
    catch { console.error(`Failed to save user settings to local storage`, key) }
  }

  public resetDefaults(): void
  {
    this.itemListVariant.set(this.defaults.itemListVariant)
    this.theme.set(this.defaults.theme)
    this.sidebarLayout.set(this.defaults.sidebarLayout)
    this.orderLayout.set(this.defaults.orderLayout)
    this.audioVolume.set(this.defaults.audioVolume)
    this.iconMod.set(this.defaults.iconMod)
    this.mapMod.set(this.defaults.mapMod)
  }
}
