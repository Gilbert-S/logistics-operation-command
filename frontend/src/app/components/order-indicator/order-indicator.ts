import {
  ChangeDetectionStrategy, Component,
  computed, inject, input, signal,
} from "@angular/core"
import { Base } from "../../services/base.service"
import { OrderService } from "../../services/order.service"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { lucideClock, lucidePackage, lucideStar, lucideTruck, lucideUsers } from "@ng-icons/lucide"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { FromNowPipe } from "../../pipes/from-now-pipe"
import { SignalPipe } from "../../pipes/signal-pipe"
import { MyDeliveryService } from "../../services/my-delivery.service"


/**
 * This component is used to display an indicator next to map markers / bases that do have
 * active orders. component is created dynamically in the base service as an base effect.
 */



@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmIconImports,
    NgIcon,
    HlmTooltipImports,
    FromNowPipe,
    SignalPipe,
  ],
  providers: [provideIcons({ lucideClock, lucidePackage, lucideStar, lucideTruck, lucideUsers })],
  selector: "app-order-indicator",
  styles: ``,
  template: `
  @if(base() && activeOrders().length > 0)
  {
    <div class="flex flex-row items-center justify-center gap-1 text-xs whitespace-nowrap flex-nowrap {{cssPositionClasses()}}">

      @if(openDeliveries() > 0)
      {
        <span class="
          flex flex-row items-center gap-1 rounded-sm bg-black/70 px-1 py-0.5 leading-0 text-white
        " [hlmTooltip]="openDeliveriesTooltip">
          <ng-icon name="lucideTruck"/> {{openDeliveries()}}
        </span>
      }

      @if(activeDeliveriesCount() > 0)
      {
        <span class="
          flex flex-row items-center gap-1 rounded-sm border border-yellow-800 bg-yellow-600 px-1
          py-0.5 leading-0 text-black
        " [hlmTooltip]="activeDeliveriesTooltip">
          @if(hasMyDelivery()) {
            <ng-icon name="lucideStar" class="animate-pulse animation-duration-1000"/>
          }
          <ng-icon name="lucideTruck"/> {{activeDeliveriesCount()}}
        </span>
      }

    </div>

    <ng-template #activeDeliveriesTooltip>
      <span class="flex flex-col p-1">
        @for (delivery of activeDeliveries(); track $index) {
          <span class="flex flex-row items-center gap-1 align-middle leading-0">
            @if(delivery === myDelivery()) {
              <ng-icon name="lucideStar" class="text-accent-foreground"/>
            }
            <ng-icon name="lucideUsers"/>
            <span>{{delivery.user.name}}</span>
            <ng-icon name="lucideClock"/>
            <span>{{delivery.timeStart | fromNow | signal}}</span>
            <span class="inline-block rounded-md border bg-blue-300/50 leading-2.5">{{delivery.status}}</span>
          </span>
        }
      </span>
    </ng-template>

    <ng-template #openDeliveriesTooltip>
      <span class="flex flex-col">
        <b>Left for delivery:</b>
        <span><b>{{this.activeOrders().length}}</b> @if(this.activeOrders().length > 1){ orders}@else{ order}</span>
        <span><b>{{leftToDeliverItemCount()}}</b> @if(this.leftToDeliverItemCount() > 1){ items}@else{ item}</span>
        <span><b>{{openDeliveries()}}</b> @if(this.openDeliveries() > 1){ trips}@else{ trip}</span>
      </span>
    </ng-template>
  }
  `,
})
export class OrderIndicator
{

  readonly base = input<Base>()
  orderService = inject(OrderService)
  public readonly myDelivery = inject(MyDeliveryService).myDelivery.asReadonly()

  readonly vehicleSlots = signal<number>(15)

  readonly orderIndicatorPosition = computed(() => this.base()?.orderIndicatorPosition() ?? "top")

  readonly cssPositionClasses = computed(() =>
  {
    switch (this.orderIndicatorPosition())
    {
      case "top":
        return "relative bottom-[33px]"
      case "bottom":
        return "relative top-[14px]"
      case "left":
        return "relative right-[16px] bottom-1 justify-end"
      case "right":
        return "relative left-[15px] bottom-1 justify-start"
    }
  })

  readonly activeOrders = computed(() =>
    this.orderService.orderList().filter((orderSignal) =>
    {
      const order = orderSignal()
      return order.markerId === this.base()?.id && !order.completed
    }))


  readonly activeDeliveries = computed(() => this.activeOrders().flatMap((orderSignal) =>
  {
    const order = orderSignal()
    return order.deliveries().filter((delivery) => delivery.status !== "completed")
  }))

  readonly hasMyDelivery = computed<boolean>(() =>
  {
    const myDelivery = this.myDelivery()
    const activeDeliveries = this.activeDeliveries()
    if (!myDelivery || activeDeliveries.length === 0)
      return false

    return activeDeliveries.some((delivery) => delivery === myDelivery)
  })


  readonly activeDeliveriesCount = computed(() => this.activeDeliveries().length)



  readonly leftToDeliverItemCount =
    computed(() => this.activeOrders().reduce((count, orderSignal) =>
    {
      const order = orderSignal()
      return count + order.stats.leftToDeliver.total
    }, 0))

  readonly openDeliveries =
    computed(() => Math.ceil(this.leftToDeliverItemCount() / this.vehicleSlots()))
}
