import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core"
import { HlmToggleGroupImports } from "@spartan-ng/helm/toggle-group"
import { Order } from "@loc/types"
import { OrderItem } from "../order-item/order-item"
import { LocalUserPreferenceService } from "../../../services/local-user-preference.service"
import { provideIcons } from "@ng-icons/core"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { lucideImage, lucideImagePlus, lucideList, lucideDock } from "@ng-icons/lucide"


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmToggleGroupImports,
    OrderItem,
    HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideImage,
      lucideImagePlus,
      lucideList,
      lucideDock,
    }),
  ],
  selector: "app-order-items",
  styles: ":host { display: contents };",
  templateUrl: "./order-items.html",
})
export class OrderItems
{
  readonly order = input.required<Order>()
  readonly mode = input<"order-edit" | "view">("order-edit")


  readonly highPriorityItems = computed(() =>
    this.order()?.items().filter((item) => item.priority === "high") || [])

  readonly mediumPriorityItems = computed(() =>
    this.order()?.items().filter((item) => item.priority === "medium") || [])

  readonly lowPriorityItems = computed(() =>
    this.order()?.items().filter((item) => item.priority === "low") || [])


  variant = inject(LocalUserPreferenceService).itemListVariant
}
