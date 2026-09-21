import { computed, inject, Injectable, linkedSignal } from "@angular/core"
import { OrderService } from "./order.service"
import { AuthService } from "./auth.service"





@Injectable({ providedIn: "root" })
export class MyDeliveryService
{
  protected orderService = inject(OrderService)
  protected user = inject(AuthService).user.asReadonly()




  public readonly orderWithMyDelivery = computed(() =>
  {
    const user = this.user()?.id
    const orderList = this.orderService.orderList()

    for (const orderSignal of orderList)
    {
      const order = orderSignal()
      const deliveries = order.deliveries()
      const myDelivery = deliveries
        .find((delivery) => delivery.user.id === user && delivery.status !== "completed")

      if (myDelivery)
        return order
    }
    return null
  })





  public readonly myDelivery = linkedSignal(() =>
  {
    const user = this.user()?.id
    const orderWithMyDelivery = this.orderWithMyDelivery()
    if (!orderWithMyDelivery)
      return

    const myDelivery = orderWithMyDelivery.deliveries()
      .find((delivery) => delivery.user.id === user && delivery.status !== "completed")

    return myDelivery
  })



  public readonly itemTotal = computed(() =>
    this.myDelivery()?.items.reduce((sum, item) => sum + item.quantity, 0) || NaN)



  public readonly itemCounts = computed(() =>
  {
    const items = this.myDelivery()?.items || []
    const counts = new Map<string, number>()

    items.forEach((item) =>
      counts.set(item.itemId, item.quantity))

    return counts
  })
}