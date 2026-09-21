import { Component, computed, inject } from "@angular/core"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmFieldImports } from "@spartan-ng/helm/field"
import { HlmItemImports } from "@spartan-ng/helm/item"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { lucidePlay, lucideVolumeX } from "@ng-icons/lucide"
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { LocalUserPreferenceService } from "../../services/local-user-preference.service"
import { HlmResizableImports } from "@spartan-ng/helm/resizable"
import { ItemVariant } from "../shared/item-variant"
import { HlmSliderImports } from "@spartan-ng/helm/slider"
import { AudioService } from "../../services/audio.service"
import { environment } from "../../../environments/environment"
import { HlmSelectImports } from "@spartan-ng/helm/select"
import { FormsModule } from "@angular/forms"
import { DeliveryItems } from "../deliveries/delivery-items/delivery-items"
import { Delivery } from "@loc/types"
import { MapService } from "../../services/map.service"





@Component({
  selector: "app-user-profile-settings",

  imports: [
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmFieldImports,
    HlmItemImports,
    HlmResizableImports,
    HlmSelectImports,
    HlmSliderImports,
    HlmSpinnerImports,
    HlmTooltipImports,
    ItemVariant,
    NgIcon,
    FormsModule,
    DeliveryItems,
  ],
  providers: [provideIcons({ lucidePlay, lucideVolumeX })],

  template: `
    <fieldset hlmFieldSet class="">
      <section class="flex flex-row items-start gap-1">
        <div class="grow">
          <legend hlmFieldLegend>User Settings</legend>
          <p hlmFieldDescription>These settings are local and and stored in your browser data.</p>
        </div>
        <button hlmBtn variant="outline" size="sm" class="cursor-pointer" (click)="resetAll()">
          Reset All
        </button>
      </section>

      <div hlmFieldGroup class="rounded-sm border bg-input/10 p-3">
          <div hlmField>
            <section class="flex flex-row items-start gap-1">
              <div class="grow">
                <label hlmFieldLabel for="volume">Audio Volume</label>
                <p hlmFieldDescription>Notification playback volume: {{ audioVolumeValue() }}</p>
              </div>
              <button hlmBtn variant="outline" size="icon" class="cursor-pointer" hlmTooltip="Play Test Notification"
                [showDelay]="500" [disabled]="!audioVolume()[0]" (click)="playTestNotification()"
              >
                @if(audioVolume()[0] === 0) { <ng-icon name="lucideVolumeX"/> }
                @else { <ng-icon name="lucidePlay"/> }
              </button>
            </section>
            <hlm-slider id="volume" [min]="0" [max]="1" [step]="0.05" [showTicks]="true"
              [formatTick]="formatTick" [(value)]="audioVolume" />
        </div>
      </div>

      <div hlmFieldGroup class="rounded-sm border bg-input/10 p-3">
        <div class="flex flex-row gap-4">
          <div hlmField class="w-[50%]">
            <label hlmFieldLabel for="field-select-department">Foxhole Items Icon Mod</label>
            <hlm-select [itemToString]="iconModToString" [(ngModel)]="iconMod">
              <hlm-select-trigger class="min-w-60">
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  @for (iconMod of iconMods; track iconMod.key) {
                    <hlm-select-item [value]="iconMod.key">
                      {{ iconMod.name }}
                    </hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>
          <app-delivery-items class="flex shrink-0 grow flex-row justify-center" [forceIconVariant]="true" [delivery]="fakeDelivery"/>
        </div>
      </div>

      <div hlmFieldGroup class="rounded-sm border bg-input/10 p-3">
        <div class="flex flex-row gap-4">
          <div hlmField class="w-[50%]">
            <label hlmFieldLabel for="field-select-department">Foxhole Map Mod</label>
            <hlm-select [itemToString]="mapModToString" [(ngModel)]="mapMod">
              <hlm-select-trigger class="min-w-60">
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  @for (mapMod of mapMods; track mapMod.key) {
                    <hlm-select-item [value]="mapMod.key">
                      {{ mapMod.name }}
                    </hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>
          <img alt="Example Map Tile" class="max-h-16 w-65 rounded-sm object-none" [src]="exampleMapTile()"/>
        </div>
      </div>

      <div hlmFieldGroup class="rounded-sm border bg-input/10 p-3">
        <div hlmField>
          <label hlmFieldLabel for="order-editor">Order Item Display Variant</label>
          <app-item-variant size="large"/>
          <p hlmFieldDescription>Adjust the display variant of the Order Items.</p>
        </div>
      </div>

      <div hlmFieldGroup class="rounded-sm border bg-input/10 p-3">
          <div hlmField>
            <label hlmFieldLabel for="sidebar">Sidebar width</label>
            <hlm-resizable-group id="sidebar" class="
              w-full rounded-sm border border-input bg-muted
            " [(layout)]="sidebarLayout">
              <hlm-resizable-panel minSize="20"  maxSize="50" collapsible="false">
                <div class="flex h-full flex-col items-center justify-center p-1">
                  <span class="font-semibold">Sidebar</span>
                  <span class="font-extralight">{{sidebarLayoutValue().sidebar}}</span>
                </div>
              </hlm-resizable-panel>
              <hlm-resizable-handle withHandle class="
                transition-colors duration-200 ease-out *:transition-colors *:duration-200
                *:ease-out
              "/>
              <hlm-resizable-panel minSize="50" collapsible="false">
                <div class="flex h-full flex-col items-center justify-center p-1">
                  <span class="font-semibold">Map</span>
                  <span class="font-extralight">{{sidebarLayoutValue().content}}</span>
                </div>
              </hlm-resizable-panel>
            </hlm-resizable-group>
            <p hlmFieldDescription>Adjust the width of the sidebar and map panels.</p>
        </div>
      </div>

      <div hlmFieldGroup class="rounded-sm border bg-input/10 p-3">
          <div hlmField>
            <label hlmFieldLabel for="order-editor">Order Editor Layout</label>
            <hlm-resizable-group id="order-editor" class="
              w-full rounded-sm border border-input bg-muted
            " [(layout)]="orderLayout">
              <hlm-resizable-panel collapsible="false" minSize="10">
                <div class="flex h-full flex-col items-center justify-center p-1">
                  <span class="font-semibold">Items</span>
                  <span class="font-extralight">{{orderLayoutValue().items}}</span>
                </div>
              </hlm-resizable-panel>
              <hlm-resizable-handle withHandle class="
                transition-colors duration-200 ease-out *:transition-colors *:duration-200
                *:ease-out
              "/>
              <hlm-resizable-panel collapsible="false" minSize="20">
                <div class="flex h-full flex-col items-center justify-center p-1">
                  <span class="font-semibold">Order</span>
                  <span class="font-extralight">{{orderLayoutValue().order}}</span>
                </div>
              </hlm-resizable-panel>
              <hlm-resizable-handle withHandle class="
                transition-colors duration-200 ease-out *:transition-colors *:duration-200
                *:ease-out
              "/>
              <hlm-resizable-panel collapsible="true">
                <div class="flex h-full flex-col items-center justify-center p-1">
                  <span class="font-semibold">Templates</span>
                  <span class="font-extralight">{{orderLayoutValue().templ}}</span>
                </div>
              </hlm-resizable-panel>
            </hlm-resizable-group>
            <p hlmFieldDescription>Adjust the the Order Editor layout.</p>
        </div>
      </div>




    </fieldset>


  `,

  styles: `
    :host { display: block }
    hlm-resizable-group:hover {
      --border: var(--color-accent-foreground);
    }
  `,
})
export class UserProfileSettings
{
  private readonly settings = inject(LocalUserPreferenceService)
  private readonly audio = inject(AudioService)
  private readonly map = inject(MapService)

  public readonly sidebarLayout = this.settings.sidebarLayout
  public readonly sidebarLayoutValue = computed(() =>
  {
    const layout = this.sidebarLayout()
    const sidebar = `${Math.round(layout[0]) }%`
    const content = `${Math.round(layout[1]) }%`
    return { sidebar, content }
  })

  public readonly orderLayout = this.settings.orderLayout
  public readonly orderLayoutValue = computed(() =>
  {
    const layout = this.orderLayout()
    const total = layout[0] + layout[1] + layout[2]
    const items = `${Math.round(layout[0] / total * 100) }%`
    const order = `${Math.round(layout[1] / total * 100) }%`
    const templ = `${Math.round(layout[2] / total * 100) }%`
    return { items, order, templ }
  })

  public readonly audioVolume = this.settings.audioVolume
  public readonly audioVolumeValue = computed(() =>
  {
    const volume = this.audioVolume()[0]
    return this.formatTick(volume)
  })
  formatTick = (value: number): string => `${Math.round(value * 100) }%`


  public readonly iconMod = this.settings.iconMod
  public readonly iconMods = environment.availableIconMods
  public iconModToString = (iconModKey: string) =>
    this.iconMods.find((mod) => mod.key === iconModKey)?.name ?? ""

  public readonly fakeDelivery = {
    items: [
      { itemId: "RifleAutomaticW", quantity: 1, priority: "medium" },
      { itemId: "SoldierSupplies", quantity: 5, priority: "high" },
      { itemId: "Cloth", quantity: 15, priority: "low" },
    ],
  } as Delivery


  public readonly mapMod = this.settings.mapMod
  public readonly mapMods = environment.availableMapMods
  public mapModToString = (mapModKey: string) =>
    this.mapMods.find((mod) => mod.key === mapModKey)?.name ?? ""

  public readonly exampleMapTile = computed(() =>
  {
    const baseUrl = environment.CDNBaseUrl
    const mapModKey = this.mapMod()
    return `${baseUrl}/map-tiles/${mapModKey}/3/2/3.webp`
  })





  resetAll()
  {
    this.settings.resetDefaults()
  }

  playTestNotification()
  {
    this.audio.newOrderNotification()
  }

}
