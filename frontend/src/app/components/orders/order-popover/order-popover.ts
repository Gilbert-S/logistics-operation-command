import { Component, computed, inject, input } from "@angular/core"
import { Order } from "@loc/types"
import { BaseService } from "../../../services/base.service"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import {
  lucideArrowLeftRight, lucideCopy, lucideLocateFixed, lucideMoreVertical, lucidePackage,
  lucidePackageOpen, lucidePackagePlus, lucidePackageX, lucideSkull, lucideTrash2,
} from "@ng-icons/lucide"
import { HlmTooltip } from "@spartan-ng/helm/tooltip"
import { OrderTruck } from "../../shared/order-truck"
import { OrderItems } from "../order-items/order-items"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { SocketService } from "../../../services/socket.service"
import Events from "@loc/common"
import { MyDeliveryService } from "../../../services/my-delivery.service"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { OrderService } from "../../../services/order.service"
import { HlmDialogImports, HlmDialogService } from "@spartan-ng/helm/dialog"
import { HlmAutocompleteImports } from "@spartan-ng/helm/autocomplete"
import { OrderTransfer } from "../order-transfer/order-transfer"
import { ItemVariant } from "../../shared/item-variant"
import { OrderDetails } from "../order-details/order-details"




@Component({
  imports: [
    HlmIconImports,
    NgIcon,
    HlmButtonImports,
    HlmTooltip,
    OrderTruck,
    OrderItems,
    HlmDropdownMenuImports,
    HlmDialogImports,
    HlmAutocompleteImports,
    ItemVariant,
    OrderDetails,
  ],
  providers: [
    provideIcons({
      lucideArrowLeftRight,
      lucideCopy,
      lucideLocateFixed,
      lucideMoreVertical,
      lucidePackage,
      lucidePackageOpen,
      lucidePackagePlus,
      lucidePackageX,
      lucideSkull,
      lucideTrash2,
    }),
  ],
  selector: "app-order-popover",
  styles: ":host {display: contents}",
  template: `
  <div class="relative flex size-full max-w-full flex-col">
    <header class="flex items-center gap-4 leading-none">
      <span class="rounded-sm border border-input bg-secondary p-1">
        @if(base()?.iconUrl())
        {
          <img alt="Marker Icon" class="size-9 shrink-0 grow-0" [src]="base()?.iconUrl()"/>
        }
        @else
        {
          <ng-icon name="lucideSkull" size="36px" strokeWidth="1.5" class="
            shrink-0 grow-0 text-muted-foreground/50
          "/>
        }
      </span>
      <div class="grow">
        {{baseName()}}
        <p class="text-sm text-muted-foreground">{{ type() }}</p>
      </div>
      <app-order-truck [items]="order().items()" />

      <button hlmBtn size="icon" variant="outline" [hlmDropdownMenuTrigger]="menu">
        <ng-icon hlm name="lucideMoreVertical" size="sm" />
      </button>

      <button hlmBtn variant="outline" size="icon" class="shrink-0 grow-0" hlmTooltip="Locate Marker"
        [showDelay]="500" [disabled]="!base()" (click)="base()?.panTo()">
        <ng-icon name="lucideLocateFixed" class=""/>
      </button>

    </header>



    <section class="my-3 mb-6 flex justify-center gap-4">
      @if(order().completed)
      {
        <button hlmBtn size="sm" variant="outline" class="text-success opacity-100!" disabled>
          <ng-icon hlm name="lucidePackagePlus" strokeWidth="1" />
          <span>Order Completed</span>
        </button>
      }
      @else if (notMyOrder()) {
        <button hlmBtn size="sm" variant="destructive" class="" disabled>
          <ng-icon hlm name="lucidePackage" strokeWidth="1" />
          <span>You have a delivery for a different order</span>
        </button>
      }
      @else {
        <button hlmBtn size="sm" variant="default" class="cursor-pointer" [disabled]="myCount() >= 15"
          (click)="autoPick15ItemsToDelivery()">
          <ng-icon hlm name="lucidePackage" strokeWidth="1" />
          auto pick
        </button>

        <button hlmBtn size="sm" variant="outline" disabled class="opacity-100!" [class.text-lime-300]="myCount() === 15">
          <ng-icon hlm name="lucidePackageOpen" strokeWidth="1" />
          {{ myCount() || 0 }} / 15
        </button>
      }
      <app-item-variant class="absolute right-0 mr-2"/>
    </section>

    <app-order-details class="mx-2 mb-3 *:min-h-0" [order]="order()"/>

    <app-order-items mode="view" [order]="order()"/>

    <!-- <pre>
    {{ order() | json }}
    </pre> -->
  </div>



  <ng-template #menu>

    <hlm-dropdown-menu>

        <button hlmDropdownMenuItem hlmTooltip="Change order items" position="right" (click)="editOrder()">
          <ng-icon name="lucidePackageOpen" />
          edit
        </button>

        <button hlmDropdownMenuItem hlmTooltip="Transfer this order to another base" position="right" (click)="openDynamicComponent()">
          <ng-icon name="lucideArrowLeftRight" />
          transfer
        </button>

        <button hlmDropdownMenuItem hlmTooltip="Create a new order with the same items" position="right" (click)="duplicateOrder()">
          <ng-icon name="lucideCopy" />
          duplicate
        </button>



        <hlm-dropdown-menu-separator />

        <button hlmDropdownMenuItem variant="destructive" hlmTooltip="Cancel order by removing all remaining open items from it"
          position="right" (click)="cancelOrder()">
          <ng-icon name="lucidePackageX" />
          cancel
        </button>

        <button hlmDropdownMenuItem variant="destructive" hlmTooltip="Cancel and delete order and all its ongoing deliveries"
          position="right" (click)="deleteOrder()">
          <ng-icon name="lucideTrash2" />
          delete
        </button>
    </hlm-dropdown-menu>
  </ng-template>
  `,
})
export class OrderPopover
{
  readonly order = input.required<Order>()
  readonly ctx = input.required<{ close: () => void }>()
  closePopover = () => this.ctx()?.close()

  readonly itemCount = computed(() => this.order()?.items()
    .reduce((sum, item) => sum + item.quantity, 0) || NaN)

  readonly name = computed(() => this.order()?.name)

  readonly highPriorityItems = computed(() =>
    this.order()?.items().filter((item) => item.priority === "high")
      .reduce((acc, item) => acc + item.quantity, 0) || NaN)

  readonly mediumPriorityItems = computed(() =>
    this.order()?.items().filter((item) => item.priority === "medium")
      .reduce((acc, item) => acc + item.quantity, 0) || NaN)

  readonly lowPriorityItems = computed(() =>
    this.order()?.items().filter((item) => item.priority === "low")
      .reduce((acc, item) => acc + item.quantity, 0) || NaN)


  orderService = inject(OrderService)

  baseService = inject(BaseService)
  readonly base = computed(() => this.baseService.getBase(this.order()?.markerId || ""))



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

  myDeliveryService = inject(MyDeliveryService)
  readonly notMyOrder = computed(() =>
    this.myDeliveryService.orderWithMyDelivery() &&
    this.myDeliveryService.orderWithMyDelivery() !== this.order())
  myCount = this.myDeliveryService.itemTotal



  socket = inject(SocketService).socket

  autoPick15ItemsToDelivery()
  {
    const socket = this.socket()
    const orderId = this.order()?.id

    if (!socket || !socket.connected || !orderId)
      return

    socket.emit(
      Events.DELIVERY_AUTOPICK15,
      orderId,
      () => { /** empty */ },
    )
  }

  editOrder()
  {
    this.orderService.editOrder.set(this.order().id)
    this.closePopover()
  }

  deleteOrder()
  {
    this.orderService.deleteOrder(this.order().id)
  }

  cancelOrder()
  {
    this.orderService.cancelOrder(this.order().id)
  }


  private readonly _hlmDialogService = inject(HlmDialogService)

  public openDynamicComponent()
  {
    this._hlmDialogService.open(OrderTransfer, {
      contentClass: "sm:max-w-[80vw] max-w-[80vw] w-[700px]",
      context: { order: this.order() },
    })
  }

  public duplicateOrder()
  {
    this.orderService.duplicateOrder(this.order().id)
  }
}
