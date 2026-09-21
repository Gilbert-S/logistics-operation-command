import { booleanAttribute, Component, effect, inject, input, linkedSignal, untracked }
  from "@angular/core"
import { HlmTextareaImports } from "@spartan-ng/helm/textarea"
import { Order } from "@loc/types"
import { OrderService } from "../../../services/order.service"

@Component({
  selector: "app-order-details",
  imports: [HlmTextareaImports],
  templateUrl: "./order-details.html",
})
export class OrderDetails
{
  readonly order = input.required<Order>()
  readonly readonly = input(false, { transform: booleanAttribute })
  readonly orderService = inject(OrderService)

  readonly details = linkedSignal(() => this.order().details || "")

  constructor()
  {
    effect(() =>
    {
      const details = this.details()
      untracked(() =>
      {
        if (!!details === !!this.order().details || details === this.order().details)
          return

        this.order().details = details

        if (!this.order().unsaved)
          this.orderService.updateSyncOrder(this.order())
      })
    })
  }
}
