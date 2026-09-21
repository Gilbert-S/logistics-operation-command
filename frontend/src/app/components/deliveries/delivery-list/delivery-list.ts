import { Component, computed, inject } from "@angular/core"
import { OrderService } from "../../../services/order.service"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { HlmItemImports } from "@spartan-ng/helm/item"
import { OrderTruck } from "../../shared/order-truck"
import { BasePipe } from "../../../pipes/base-pipe"
import { SignalPipe } from "../../../pipes/signal-pipe"
import { HlmPopoverImports } from "@spartan-ng/helm/popover"
import { NgIcon, provideIcons } from "@ng-icons/core"
import {
  lucideLocateFixed,
  lucideMoreVertical,
  lucidePackage, lucidePackageCheck, lucidePackageOpen, lucideRadar, lucideShoppingCart, lucideStar,
  lucideTimer,
  lucideTruck,
} from "@ng-icons/lucide"
import { FromNowPipe } from "../../../pipes/from-now-pipe"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { interval } from "rxjs"
import { toSignal } from "@angular/core/rxjs-interop"
import { UserAvatar } from "../../user-avatar/user-avatar"
import { DeliveryDurationPipe } from "../../../pipes/delivery-duration-pipe"
import { DeliveryItems } from "../delivery-items/delivery-items"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { Delivery, User } from "@loc/types"
import { PresenceService } from "../../../services/presence.service"
import { SettingsService } from "../../../services/settings.service"

dayjs.extend(relativeTime)





@Component({
  imports: [
    HlmItemImports,
    HlmIconImports,
    OrderTruck,
    BasePipe,
    SignalPipe,
    HlmPopoverImports,
    NgIcon,
    FromNowPipe,
    DeliveryDurationPipe,
    UserAvatar,
    DeliveryItems,
    HlmTooltipImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
  ],
  providers: [
    provideIcons({
      lucideLocateFixed,
      lucideMoreVertical,
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
  selector: "app-delivery-list",
  templateUrl: "./delivery-list.html",
})
export class DeliveryList
{

  orderService = inject(OrderService)
  public readonly presences = inject(PresenceService).presences.asReadonly()

  readonly updateInterval = toSignal(interval(1000 * 60))

  private readonly settings = inject(SettingsService).settings.asReadonly()
  private readonly recentlyFinishedDeliveriesCutoff =
    computed(() => (this.settings().frontend["deliveries.display-completed-for"] * -1))
  private readonly recentlyFinishedOrdersCutoff =
    computed(() => (this.settings().frontend["orders.display-completed-for"] * -1))


  readonly deliveriesList = computed(() =>
  {
    this.updateInterval()
    const list = this.orderService.orderList()
    const currentOrders = list.filter((order) =>
    {
      const finishedSince = dayjs(order().timeEnd).diff(undefined, "minutes")
      const isRecentlyFinished = finishedSince >= this.recentlyFinishedOrdersCutoff()

      return !order().completed || isRecentlyFinished
    })

    const deliveries = currentOrders
      .flatMap((order) => order().deliveries().filter((d) =>
      {
        const finishedSince = dayjs(d.timeEnd).diff(undefined, "minutes")
        const isRecentlyFinished = finishedSince >= this.recentlyFinishedDeliveriesCutoff()
        return d.status !== "completed" || isRecentlyFinished
      }).map((d) => ({ ...d, orderId: order().id, markerId: order().markerId })))


    return deliveries
  })

  cancelDelivery(orderId: string, userId: string)
  {
    this.orderService.cancelDelivery(orderId, userId)
  }

  changeDeliveryState(orderId: string, userId: string, newState: Delivery["status"])
  {
    this.orderService.changeDeliveryState(orderId, userId, newState)
  }

  transferDelivery(orderId: string, from: User, to: User)
  {
    this.orderService.transferDelivery(orderId, from, to)
  }

  readonly usersWithDelivery = computed(() =>
  {
    const presences = this.presences() || []
    const activeDeliveries = this.deliveriesList().filter((d) => d.status !== "completed")
      .map((d) => d.user.id)
    return presences.filter((p) => activeDeliveries.includes(p.id)).map((p) => p.id)
  })
}
