import {
  computed, inject, isSignal, Pipe, PipeTransform, Signal, signal,
  untracked,
} from "@angular/core"
import { OrderService } from "../services/order.service"
import { Order } from "@loc/types"





@Pipe({ name: "order", standalone: true, pure: true })
export class OrderPipe implements PipeTransform
{
  orderService = inject(OrderService)

  readonly inputOrderId = signal<string>("")
  readonly inputOrderSignal = signal<Order | null | Signal<Order | null>>(null)

  readonly order = computed(() =>
  {
    const orderId = this.inputOrderId()
    if (!orderId)
    {
      const o = this.inputOrderSignal()
      if (isSignal(o))
        return o()
      return o
    }

    const o = undefined// this.orderService.getOrderById(orderId)
    // if (isSignal(o))
    //   return o()
    return o
  })


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





  transform(
    orderInput: string | Order | null | Signal<Order | null>,
    property: "itemCount" | "name" | "high" | "medium" | "low",
  ): Signal<string | number | undefined | null>
  {
    if (typeof orderInput === "string")
      untracked(() => this.inputOrderId.set(orderInput))
    else
      untracked(() => this.inputOrderSignal.set(orderInput))



    if (property === "itemCount")
      return this.itemCount

    if (property === "name")
      return this.name

    if (property === "high")
      return this.highPriorityItems

    if (property === "medium")
      return this.mediumPriorityItems

    if (property === "low")
      return this.lowPriorityItems

    return signal(undefined).asReadonly()
  }
}