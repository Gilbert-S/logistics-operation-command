import { Component, computed, input } from "@angular/core"
import { HlmBadgeImports } from "@spartan-ng/helm/badge"
import { OrderItem } from "@loc/types"





@Component({
  selector: "app-order-truck",
  imports: [HlmBadgeImports],
  template: `
    <div class="group grid" [attr.data-small]="size() === 'small'">
      @if(orderItem15() >= 45) {
        <img src="images/HeavyTruckWItemIcon.png" alt="Truck Icon" class="
          col-1 row-1 ml-0 h-14 opacity-55 group-has-data-[small=true]:h-11
        ">
      }
      @if(orderItem15() >= 30) {
        <img src="images/HeavyTruckWItemIcon.png" alt="Truck Icon" class="
          col-1 row-1 h-14 opacity-77 filter-[drop-shadow(0_0_4px_#000)_drop-shadow(0_0_4px_#000)]
          group-has-data-[small=true]:h-11 nth-2:ml-4
        ">
      }
      <img src="images/HeavyTruckWItemIcon.png" alt="Truck Icon" class="
        col-1 row-1 h-14 opacity-99 filter-[drop-shadow(0_0_4px_#000)_drop-shadow(0_0_4px_#000)]
        group-has-data-[small=true]:h-11 nth-2:ml-4 nth-3:ml-8
      ">
    </div>
    @if(orderItem15() > 45) {
      <span hlmBadge class="
        absolute mr-1 border border-ring bg-secondary px-2 py-0 text-xs text-foreground
      ">x{{orderItem15() / 15}}</span>
    }
  `,
  styles: `
    :host {display: grid; align-items: center; justify-items: end;}
    :host > * {grid-area: 1 / 1}
  `,
})
export class OrderTruck
{
  readonly items = input<OrderItem[]>()
  readonly size = input<"small" | "normal">("normal")

  readonly orderItemCount = computed(() => this.items()
    ?.reduce((acc, item) => acc + item.quantity, 0) || 0)

  readonly orderItem15 = computed(() => Math.ceil(this.orderItemCount() / 15) * 15 || 15)
}
