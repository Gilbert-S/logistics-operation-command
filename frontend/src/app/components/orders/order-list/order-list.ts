import { Component, computed, inject, viewChild } from "@angular/core"
import { OrderService } from "../../../services/order.service"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { HlmItemImports } from "@spartan-ng/helm/item"
import { OrderTruck } from "../../shared/order-truck"
import { BasePipe } from "../../../pipes/base-pipe"
import { SignalPipe } from "../../../pipes/signal-pipe"
import { HlmPopoverImports } from "@spartan-ng/helm/popover"
import { OrderPopover } from "../order-popover/order-popover"
import { NgIcon, provideIcons } from "@ng-icons/core"
import {
  lucidePackage, lucidePackageCheck, lucidePackageOpen, lucideRadar, lucideShoppingCart, lucideStar,
  lucideTimer,
  lucideTruck,
} from "@ng-icons/lucide"
import { MyDeliveryService } from "../../../services/my-delivery.service"
import { FromNowPipe } from "../../../pipes/from-now-pipe"
import { OrderDurationPipe } from "../../../pipes/order-duration-pipe"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { interval } from "rxjs"
import { toSignal } from "@angular/core/rxjs-interop"
import { HlmTooltip } from "@spartan-ng/helm/tooltip"
import { SettingsService } from "../../../services/settings.service"
import { BrnPopoverImports } from "@spartan-ng/brain/popover"

dayjs.extend(relativeTime)





@Component({
  imports: [
    HlmItemImports,
    HlmIconImports,
    OrderTruck,
    BasePipe,
    SignalPipe,
    HlmPopoverImports,
    OrderPopover,
    NgIcon,
    FromNowPipe,
    OrderDurationPipe,
    HlmTooltip,
    BrnPopoverImports,
  ],
  providers: [
    provideIcons({
      lucidePackage,
      lucidePackageCheck,
      lucidePackageOpen,
      lucideRadar,
      lucideShoppingCart,
      lucideStar,
      lucideTimer,
      lucideTruck,
    }),
  ],
  selector: "app-order-list",
  templateUrl: "./order-list.html",

  styles: `
    @property --angle {
      syntax: "<angle>";
      inherits: true;
      initial-value: 0deg;
    }

    @keyframes rotate {
      to {
        --angle: 360deg;
      }
    }

    #NoOrdersBox {
      border: 1px solid transparent;
      background: linear-gradient(var(--sidebar),var(--sidebar)) padding-box,
      conic-gradient(from var(--angle) at 38px 50%, var(--color-amber-500) 5deg, var(--input) 20deg 340deg, var(--color-amber-500) 355deg) border-box;
      animation: rotate 5s linear infinite;
    }

    #NoOrdersBox ng-icon {
      transform: rotate(calc(var(--angle) - 45deg));
    }
  `,
})
export class OrderList
{

  readonly test = viewChild("PopoverAnchor")

  orderService = inject(OrderService)
  orderWithMyDelivery = inject(MyDeliveryService).orderWithMyDelivery
  myItemTotal = inject(MyDeliveryService).itemTotal

  private readonly settings = inject(SettingsService).settings.asReadonly()
  private readonly recentlyFinishedCutoff =
    computed(() => (this.settings().frontend["orders.display-completed-for"] * -1))

  readonly updateInterval = toSignal(interval(1000 * 60))


  readonly orderList = computed(() =>
  {
    this.updateInterval()
    const list = this.orderService.orderList()
    return list.filter((order) =>
    {
      const finishedSince = dayjs(order().timeEnd).diff(undefined, "minutes")
      const isRecentlyFinished = finishedSince >= this.recentlyFinishedCutoff()

      return !order().completed || isRecentlyFinished
    })
  })

  readonly completedOrderList = computed(() =>
    this.orderService.orderList().filter((order) => order().completed))

  readonly openOrders =
    computed(() => this.orderList().filter((o) => o().completed === false).length)
  readonly completedOrders = computed(() => this.completedOrderList().length)

  readonly deliveriesInPickup = computed(() =>
    this.orderList().reduce((acc, o) => acc + o().deliveries()
      .filter((d) => d.status === "pickup").length, 0))

  readonly deliveriesInTransit = computed(() =>
    this.orderList().reduce((acc, o) => acc + o().deliveries()
      .filter((d) => d.status === "delivery").length, 0))


}
