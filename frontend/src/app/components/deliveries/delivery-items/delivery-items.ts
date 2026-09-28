import { Component, computed, inject, input } from "@angular/core"
import { Delivery } from "@loc/types"
import { OrderService } from "../../../services/order.service"
import { HlmToggleGroupImports } from "@spartan-ng/helm/toggle-group"
import { provideIcons } from "@ng-icons/core"
import { lucideImage, lucideList } from "@ng-icons/lucide"
import { LocalUserPreferenceService } from "../../../services/local-user-preference.service"
import { FoxholeItemPipe } from "../../../pipes/foxhole-item-pipe"
import { FoxholeItemImage } from "../../../directives/foxhole-item-image"
import { FoxholeItemHovercard } from "../../../directives/foxhole-item-hovercard"
import { ItemSubtypeIcon } from "../../item-subtype-icon/item-subtype-icon"

@Component({
  selector: "app-delivery-items",

  imports: [
    FoxholeItemImage,
    FoxholeItemPipe,
    HlmToggleGroupImports,
    FoxholeItemHovercard,
    ItemSubtypeIcon,
  ],

  template: `
  <section class="
    flex h-full flex-row flex-wrap content-start justify-center gap-2 overflow-x-hidden
    overflow-y-auto p-1 data-[variant=list]:gap-0
  " id="order" [attr.data-variant]="variant()">

    @for (item of items(); track item.itemId) {

      @let foxholeItem = item.itemId | foxholeItem;

      @switch (variant())
      {

        @case ("icon")
        {
          <div id="test" class="group/deliveryitem relative grid place-items-center rounded-sm">
            <img alt [appFoxholeItemImage]="foxholeItem" [appFoxholeItemHovercard]="foxholeItem"/>
            <app-item-subtype-icon [foxholeItem]="foxholeItem"/>

              <div class="
                absolute bottom-1 left-0.5 grid size-3 place-content-center rounded-full
                leading-none font-bold text-black outline outline-black/50 select-none
                group-hover/deliveryitem:hidden data-[priority=high]:bg-red-300
                data-[priority=low]:bg-lime-200 data-[priority=medium]:bg-amber-200
              " id="priority" [attr.data-priority]="item.priority">
                {{priorityIndicator(item.priority)}}
              </div>

              <span class="
                absolute right-1 bottom-1.5 z-2 rounded-sm border bg-primary px-1 pb-0.5 text-sm
                leading-none font-semibold text-primary-foreground outline outline-black/50
                select-none group-hover/deliveryitem:hidden
              ">
                x{{ item.quantity }}
              </span>
          </div>
        }


        @case ("list")
        {
          <div class="
            @container relative box-border flex shrink-0 basis-full flex-row items-center gap-3
            border-x border-b border-border bg-white/5 p-2 select-none first:rounded-t-sm
            first:border-y last:rounded-b-sm
          ">

            <section class="relative z-1 -my-1.5 -ml-1.5 shrink-0 bg-muted/80 @max-3xs:hidden" >
            <img alt class="data-listvariant:size-8" forListVariant [appFoxholeItemImage]="foxholeItem" [appFoxholeItemHovercard]="foxholeItem"/>
            <app-item-subtype-icon [foxholeItem]="foxholeItem"/>
            </section>

            <div class="w-1/10">
              x{{ item.quantity }}
            </div>

            <div class="max-w-full grow truncate overflow-hidden">
              {{ foxholeItem.DisplayName }}
            </div>

            <div class="
              data-[priority=high]:text-red-300 data-[priority=low]:text-lime-200
              data-[priority=medium]:text-amber-200
            " id="priority-indicator" [attr.data-priority]="item.priority">
              {{ priorityIndicator(item.priority) }}
            </div>


          </div>
        }

      }
    }
  </section>
  `,

  providers: [provideIcons({ lucideImage, lucideList })],
})
export class DeliveryItems
{
  readonly forceIconVariant = input<boolean>(false)
  orderService = inject(OrderService)

  readonly delivery = input.required<Delivery>()
  itemListVariant = inject(LocalUserPreferenceService).itemListVariant
  readonly variant = computed(() => this.forceIconVariant() ? "icon" : this.itemListVariant())

  readonly items = computed(() =>
  {
    const items = this.delivery()?.items ?? []
    return items
  })

  priorityIndicator = (priority:string) =>
  {
    switch (priority)
    {
      case "low": return "˅"
      case "medium": return "∽"
      case "high": return "˄"
      default: return ""
    }
  }

}
