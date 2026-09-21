import { Component, computed, inject } from "@angular/core"
import { MyDeliveryService } from "../../../services/my-delivery.service"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { HlmItemImports } from "@spartan-ng/helm/item"
import { OrderService } from "../../../services/order.service"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmCollapsibleImports } from "@spartan-ng/helm/collapsible"
import {
  lucideArrowLeftRight, lucideCheckCircle, lucideChevronsUpDown, lucideMoreVertical,
  lucideLocateFixed, lucidePackage, lucideTruck, lucidePackageX,
  lucideSkull,
} from "@ng-icons/lucide"
import { BaseService } from "../../../services/base.service"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { SocketService } from "../../../services/socket.service"
import Events from "@loc/common"
import { Delivery, User } from "@loc/types"
import { DeliveryItems } from "../delivery-items/delivery-items"
import { ItemVariant } from "../../shared/item-variant"
import { PresenceService } from "../../../services/presence.service"
import { UserAvatar } from "../../user-avatar/user-avatar"
import { OrderDetails } from "../../orders/order-details/order-details"

@Component({
  selector: "app-my-delivery",
  imports: [
    HlmButtonImports,
    HlmCollapsibleImports,
    HlmIconImports,
    HlmItemImports,
    HlmTooltipImports,
    NgIcon,
    HlmDropdownMenuImports,
    DeliveryItems,
    ItemVariant,
    UserAvatar,
    OrderDetails,
  ],
  providers: [
    provideIcons({
      lucideArrowLeftRight,
      lucideCheckCircle,
      lucideChevronsUpDown,
      lucideLocateFixed,
      lucideMoreVertical,
      lucidePackage,
      lucidePackageX,
      lucideSkull,
      lucideTruck,
    }),
  ],
  templateUrl: "./my-delivery.html",
})
export class MyDelivery
{
  protected myDeliveryService = inject(MyDeliveryService)
  protected orderService = inject(OrderService)
  protected socketService = inject(SocketService)

  myDelivery = this.myDeliveryService.myDelivery
  myOrder = this.myDeliveryService.orderWithMyDelivery
  itemTotal = this.myDeliveryService.itemTotal

  readonly markerId = computed(() => this.myOrder()?.markerId)


  baseService = inject(BaseService)
  readonly base = computed(() => this.baseService.getBase(this.markerId() || ""))

  public readonly presences = inject(PresenceService).presences.asReadonly()


  readonly baseName = computed(() =>
  {
    if (this.base() === null)
      return "(deleted base)"

    return this.base()?.name() || "(unnamed)"
  })

  readonly type = computed(() =>
  {
    if (this.base() === null)
      return "(deleted base)"

    return this.base()?.iconName || this.base()?.baseType?.() || ""
  })

  cancelDelivery()
  {
    this.socketService.socket()?.emit(Events.DELIVERY_CANCEL)
  }

  changeDeliveryState(newState: Delivery["status"])
  {
    this.socketService.socket()?.emit(Events.DELIVERY_CHANGESTATE, newState)
  }


  transferDelivery(toUser: User)
  {
    const orderId = this.myOrder()?.id
    const fromUser = this.myDelivery()?.user
    if (!orderId || !fromUser || !toUser)
      return

    this.orderService.transferDelivery(orderId, fromUser, toUser)
  }


  readonly usersWithDelivery = computed(() =>
  {
    const presences = this.presences() || []
    const deliveries = this.orderService.orderList()
      .flatMap((order) => order().deliveries().filter((d) => d.status !== "completed"))
    const deliveryUserIds = deliveries.map((d) => d.user.id)


    return presences.filter((p) => deliveryUserIds.includes(p.id)).map((p) => p.id)
  })
}
