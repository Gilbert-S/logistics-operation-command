import { Component, computed, inject, input } from "@angular/core"
import { OrderService } from "../../../services/order.service"
import { HlmContextMenuImports } from "@spartan-ng/helm/context-menu"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmInputImports } from "@spartan-ng/helm/input"
import { FormsModule } from "@angular/forms"
import { HlmToggleGroupImports } from "@spartan-ng/helm/toggle-group"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { lucideChevronDown, lucideDelete, lucideMinus, lucidePlus, lucideTrash2 }
  from "@ng-icons/lucide"
import { DeliveryItemsVariant, Order, OrderItem as OrderItemType } from "@loc/types"
import { MyDeliveryService } from "../../../services/my-delivery.service"
import { SocketService } from "../../../services/socket.service"
import Events from "@loc/common"
import items, { EMPTY_ITEM } from "../../../config/items"
import { FoxholeItemImage } from "../../../directives/foxhole-item-image"
import { HlmHoverCardImports } from "@spartan-ng/helm/hover-card"
import { ItemHoverCard } from "../../item-hover-card/item-hover-card"





@Component({
  imports: [
    HlmContextMenuImports,
    HlmDropdownMenuImports,
    HlmButtonImports,
    HlmInputImports,
    FormsModule,
    HlmToggleGroupImports,
    HlmIconImports,
    NgIcon,
    FoxholeItemImage,
    HlmHoverCardImports,
    ItemHoverCard,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideDelete,
      lucideMinus,
      lucidePlus,
      lucideTrash2,
    }),
  ],
  selector: "app-order-item",
  styles: ":host {display: contents}",
  templateUrl: "./order-item.html",
})
export class OrderItem
{
  readonly order = input.required<Order>()
  readonly orderItem = input.required<OrderItemType>()
  readonly variant = input<DeliveryItemsVariant>("icon")
  readonly mode = input<"order-edit" | "view">("order-edit")

  readonly editMode = computed(() => this.mode() === "order-edit")

  orderService = inject(OrderService)
  orderItems = this.orderService.currentOrder()?.items

  myDelivery = inject(MyDeliveryService)

  readonly canPickDelivery = computed(() =>
  {
    if (this.mode() === "order-edit")
      return false

    if (!this.myDelivery.myDelivery())
      return true

    if (this.myDelivery.orderWithMyDelivery() &&
      this.myDelivery.orderWithMyDelivery()?.id !== this.order().id
    )
      return false

    if (this.myDelivery.myDelivery()?.status !== "pickup")
      return false

    const myDeliveryQuant = this.myDelivery.myDelivery()?.quantity
    if (myDeliveryQuant && myDeliveryQuant >= 15)
      return false

    const delivered = this.orderItem().delivered
    const inDelivery = this.orderItem().inDelivery
    const quantity = this.orderItem().quantity
    return delivered + inDelivery < quantity
  })

  readonly canReduceDelivery = computed(() =>
  {
    if (this.mode() === "order-edit")
      return false

    if (!this.myDelivery.orderWithMyDelivery())
      return false

    if (this.myDelivery.orderWithMyDelivery()?.id !== this.order().id)
      return false

    if (this.myDelivery.myDelivery()?.status !== "pickup")
      return false

    const myDeliveryCount = this.myDelivery.itemCounts().get(this.orderItem().id) || 0
    return myDeliveryCount > 0
  })

  readonly canDeleteOrderItem = computed(() =>
  {
    if (this.mode() !== "order-edit")
      return false

    const delivered = this.orderItem().delivered
    const inDelivery = this.orderItem().inDelivery
    return delivered === 0 && inDelivery === 0
  })

  socket = inject(SocketService).socket

  iconClasses = `
    w-16
    hover:shadow-lg hover:cursor-pointer
    transition-all duration-150 cursor-pointer border-2 rounded-sm p-1
  `


  readonly foxholeItem = computed(() => items[this.orderItem().id] ?? EMPTY_ITEM)


  readonly low = computed(() => this.orderItem().priority === "low")
  readonly medium = computed(() => this.orderItem().priority === "medium")
  readonly high = computed(() => this.orderItem().priority === "high")

  readonly priorityIndicator = computed(() =>
  {
    switch (this.orderItem().priority)
    {
      case "low": return "˅"
      case "medium": return "∽"
      case "high": return "˄"
    }
  })

  readonly stats = computed(() =>
  {
    const delivered = this.orderItem().delivered
    const inDelivery = this.orderItem().inDelivery
    const quantity = this.orderItem().quantity

    let myDelivery = 0
    if (this.myDelivery.orderWithMyDelivery() &&
      this.myDelivery.orderWithMyDelivery()?.id === this.order().id
    )
      myDelivery = this.myDelivery.itemCounts().get(this.orderItem().id) || 0


    return {
      delivered: `${delivered / quantity * 100 }%`,
      myDelivery: `${myDelivery / quantity * 100 }%`,
      inDelivery: `${(inDelivery - myDelivery) / quantity * 100 }%`,
      myDeliveryN: myDelivery,
    }
  })

  readonly allPicked = computed(() =>
  {
    const delivered = this.orderItem().delivered
    const inDelivery = this.orderItem().inDelivery
    const quantity = this.orderItem().quantity
    return delivered + inDelivery >= quantity
  })


  get item ()
  {
    return this.orderItems?.()?.find((item) => item === this.orderItem())
  }

  updateOrderItems = () =>
  {
    this.orderItems?.set([...this.orderItems()])
    this.syncOrderChanges()
  }


  setPriority = (priority: "low" | "medium" | "high") =>
  {
    if (!this.editMode() || !this.item || !this.orderItems)
      return

    this.item.priority = priority
    this.orderItems.set([...this.orderItems()])
    this.syncOrderChanges()
  }

  changeQuantity = (delta: number) =>
  {
    if (!this.editMode() || !this.item || !this.orderItems)
      return

    const minimum = this.item.delivered + this.item.inDelivery || 0
    this.item.quantity = Math.max(minimum, this.item.quantity + delta)
    if (this.item.quantity === 0)
      this.orderItems.set(this.orderItems().filter((item) => item !== this.item))
    else
      this.orderItems.set([...this.orderItems()])
    this.syncOrderChanges()
  }

  removeItem = () =>
  {
    if (!this.editMode() || !this.item || !this.orderItems)
      return

    if (this.item.delivered > 0 || this.item.inDelivery > 0)
      return

    this.orderItems.set(this.orderItems().filter((item) => item !== this.item))
    this.syncOrderChanges()
  }





  lowerMyDeliveryCount = (event: Event | undefined, amount?: number) =>
  {
    event?.stopPropagation()

    if (!this.canReduceDelivery())
      return

    const orderId = this.myDelivery.orderWithMyDelivery()?.id
    const itemId = this.orderItem().id
    const quantity = amount || 0

    if (!orderId || !itemId || !Number.isInteger(quantity))
      return

    this.socket()?.emit(Events.DELIVERY_PICK, orderId, itemId, quantity)
  }


  pickItem(event: Event | undefined)
  {
    event?.stopPropagation()

    if (!this.canPickDelivery())
      return

    const orderId = this.order().id
    const itemId = this.orderItem().id
    if (!orderId || !itemId)
      return

    let quantity = 1

    if (event && "shiftKey" in event && event.shiftKey)
      quantity = 3

    if (event && "ctrlKey" in event && event.ctrlKey)
      quantity = 5


    this.socket()?.emit(Events.DELIVERY_PICK, orderId, itemId, quantity)
  }


  syncOrderChanges()
  {
    const order = this.order()
    if (!order)
      return

    if (!order.unsaved)
      this.orderService.updateSyncOrder(order)
  }


  mouseWheelHandler($event: WheelEvent)
  {
    if (!$event.shiftKey)
      return

    $event.preventDefault()

    const amount = $event.deltaY < 0 ? 1 : -1

    if (amount === -1 && !this.editMode())
      this.lowerMyDeliveryCount(undefined, amount)
    else if (amount === 1 && !this.editMode())
      this.pickItem(undefined)
    else if (amount === -1 && this.editMode())
      this.changeQuantity(-1)
    else if (amount === 1 && this.editMode())
      this.changeQuantity(1)
  }
}
