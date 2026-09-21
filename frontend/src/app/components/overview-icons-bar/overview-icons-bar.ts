import { Component, computed, inject } from "@angular/core"
import { OrderService } from "../../services/order.service"
import { PresenceService } from "../../services/presence.service"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { lucideShoppingCart, lucidePackageOpen, lucideTruck, lucideUsers, lucidePackageSearch }
  from "@ng-icons/lucide"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"

@Component({
  selector: "app-overview-icons-bar",

  imports: [NgIcon, HlmTooltipImports],
  providers: [
    provideIcons({
      lucidePackageOpen,
      lucidePackageSearch,
      lucideShoppingCart,
      lucideTruck,
      lucideUsers,
    }),
  ],
  templateUrl: "./overview-icons-bar.html",
})
export class OverviewIconsBar
{
  orderList = inject(OrderService).orderList.asReadonly()
  presences = inject(PresenceService).presences


  readonly completedOrderList = computed(() => this.orderList().filter((o) => o().completed))





  readonly openOrders = computed(() => this.orderList().filter((o) => !o().completed).length)

  readonly completedOrders = computed(() => this.completedOrderList().length)

  readonly deliveriesInPickup = computed(() =>
    this.orderList().reduce((acc, o) => acc + o().deliveries()
      .filter((d) => d.status === "pickup").length, 0))

  readonly deliveriesInTransit = computed(() =>
    this.orderList().reduce((acc, o) => acc + o().deliveries()
      .filter((d) => d.status === "delivery").length, 0))

  readonly presentUsers =
    computed(() => this.presences().filter((p) => p.sessions[0]?.online).length)

  readonly openDeliveries = computed(() =>
    Math.ceil(this.orderList().reduce((acc, o) => acc + o().stats.leftToDeliver.total, 0) / 15))

}
