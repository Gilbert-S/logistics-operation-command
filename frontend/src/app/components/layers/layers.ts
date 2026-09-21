import { Component, inject } from "@angular/core"
import { MapService } from "../../services/map.service"
import { Map } from "@loc/types"
import { NgIcon, provideIcons } from "@ng-icons/core"
import {
  lucideType, lucideHexagon, lucideTag, lucideEye,
  lucideTags, lucideImage, lucideImages, lucideEyeOff,
  lucideMap,
} from "@ng-icons/lucide"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { HlmToggleImports } from "@spartan-ng/helm/toggle"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { HlmPopoverImports } from "@spartan-ng/helm/popover"


@Component({
  imports: [
    HlmButtonImports,
    HlmIconImports,
    HlmToggleImports,
    HlmTooltipImports,
    NgIcon,
    HlmPopoverImports,
  ],
  providers: [
    provideIcons({
      lucideEye,
      lucideEyeOff,
      lucideHexagon,
      lucideImage,
      lucideImages,
      lucideMap,
      lucideTag,
      lucideTags,
      lucideType,
    }),
  ],
  selector: "app-layers",
  styles: `:host { display: contents; }`,


  template: `
  <hlm-popover align="end" offsetX="0" sideOffset="1">

    <button hlmBtn hlmItem hlmPopoverTrigger variant="secondary"
      class="fixed top-4 right-4 z-1000 px-2!">
      <ng-icon hlm name="lucideMap"/>
    </button>

    <hlm-popover-content *hlmPopoverPortal="let ctx"
      class="box-border flex w-full max-w-[400px] justify-between gap-3">
      @for (layer of layers(); track $index)
      {
        <button hlmToggle variant="outline" size="lg"
          class="
            relative w-full justify-start hover:border-neutral-500
            data-[state=on]:border-neutral-600 data-[state=on]:hover:border-neutral-500
            data-[state=off]:*:[ng-icon#btnicon]:*:[svg]:stroke-neutral-300
            data-[state=on]:*:[ng-icon#btnicon]:*:[svg]:stroke-lime-500
          "
          position="right"
          [state]="layer.enabled() ? 'on' : 'off'"
          (stateChange)="layer.enabled.set($event === 'on')"
        >
          <ng-icon id="btnicon" hlm [name]="layer.icon" />

          <div class="flex grow flex-col items-start gap-1 text-left leading-none font-normal">
            {{ layer.name }}
            <small class="font-light text-muted-foreground">zoom level {{ layer.zoomMin }} - {{ layer.zoomMax }}</small>
          </div>

          @if(isVisible(layer)) {
            <ng-icon hlm size="sm" name="lucideEye" class="[&_svg]:stroke-neutral-100"/>
          } @else {
            <ng-icon hlm size="sm" name="lucideEyeOff" class="[&_svg]:stroke-neutral-500"/>
          }

        </button>
      }
    </hlm-popover-content>
  </hlm-popover>
  `,
})
export class Layers
{
  layers = inject(MapService).layers
  zoomLevel = inject(MapService).zoomLevel



  variant = (enabled: boolean) => enabled ? "success" : "neutral"
  isVisible = (layer: Map.Layer) =>
  {
    if (!layer.enabled())
      return false

    const zoom = this.zoomLevel()
    return layer.zoomMin <= zoom && zoom <= layer.zoomMax
  }


}
