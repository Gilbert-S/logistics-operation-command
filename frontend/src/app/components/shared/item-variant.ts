import { Component, computed, inject, input } from "@angular/core"
import { provideIcons } from "@ng-icons/core"
import { lucideLayoutGrid, lucideMonitorCog, lucideRows3 } from "@ng-icons/lucide"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { HlmToggleGroupImports } from "@spartan-ng/helm/toggle-group"
import { LocalUserPreferenceService } from "../../services/local-user-preference.service"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { HlmButtonImports } from "@spartan-ng/helm/button"

@Component({
  imports: [HlmToggleGroupImports, HlmIconImports, HlmTooltipImports, HlmButtonImports],
  providers: [provideIcons({ lucideLayoutGrid, lucideRows3, lucideMonitorCog })],
  selector: "app-item-variant",

  template: `
    <hlm-toggle-group type="single" variant="outline" nullable="false"  class="
      [&>button]:cursor-pointer
    " [size]="groupSize()" [(value)]="variant"
     >

      <button hlmToggleGroupItem value="icon" aria-label="Icon Grid Variant"
        hlmTooltip="display items in a grid of icons" [showDelay]="500"
        (click)="$event.stopPropagation()">
        <ng-icon hlm name="lucideLayoutGrid" [size]="iconSize()" [strokeWidth]="strokeWidth()"/>
        @if(size() === "large")
        {
          Icon Grid
        }
      </button>

      <button hlmToggleGroupItem value="list" aria-label="Detail List Variant"
        hlmTooltip="display items in a list with details" [showDelay]="500"
        (click)="$event.stopPropagation()">
        <ng-icon hlm name="lucideRows3" [size]="iconSize()" [strokeWidth]="strokeWidth()"/>
        @if(size() === "large")
        {
          Detail List
        }
      </button>

    </hlm-toggle-group>
  `,
})
export class ItemVariant
{
  public variant = inject(LocalUserPreferenceService).itemListVariant

  readonly size = input<"small" | "large">("small")
  readonly groupSize = computed(() => this.size() === "small" ? "default" : "lg")
  readonly iconSize = computed(() => this.size() === "small" ? "sm" : "base")
  readonly strokeWidth = computed(() => this.size() === "small" ? undefined : 1)

}
