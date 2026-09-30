import { Component, computed, inject, signal, AfterViewInit } from "@angular/core"
import { HlmAutocompleteImports } from "@spartan-ng/helm/autocomplete"
import { HlmDialogImports } from "@spartan-ng/helm/dialog"
import { BaseService, Base } from "../../../services/base.service"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { Order } from "@loc/types"
import { BrnDialogRef, injectBrnDialogContext } from "@spartan-ng/brain/dialog"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { lucideMoveRight, lucidePackage, lucideTruck } from "@ng-icons/lucide"
import { OrderService } from "../../../services/order.service"
import { BasePipe } from "../../../pipes/base-pipe"
import { SignalPipe } from "../../../pipes/signal-pipe"
import { HlmFieldImports } from "@spartan-ng/helm/field"
import { HlmCheckboxImports } from "@spartan-ng/helm/checkbox"
import { FormsModule, NgForm } from "@angular/forms"

@Component({
  host: { class: "flex flex-col gap-4 w-full overflow-hidden" },
  imports: [
    BasePipe,
    FormsModule,
    HlmAutocompleteImports,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmDialogImports,
    HlmFieldImports,
    NgIcon,
    SignalPipe,
  ],
  providers: [provideIcons({ lucideMoveRight, lucideTruck, lucidePackage })],
  selector: "app-order-transfer",
  templateUrl: "./order-transfer.html",
})
export class OrderTransfer implements AfterViewInit
{
  private readonly _dialogContext = injectBrnDialogContext<{ order?: Order, base?: Base }>()
  private readonly _dialogRef = inject(BrnDialogRef)
  public readonly close = () => this._dialogRef.close()
  private readonly orderService = inject(OrderService)

  public readonly order = this._dialogContext.order
  public readonly base = this._dialogContext.base
  private baseService = inject(BaseService)

  public readonly autocompleteState = signal<"closed" | "open">("closed")

  public readonly orderList = computed(() =>
    this.orderService.orderList().filter((order) => !order().completed))



  ngAfterViewInit()
  {
    // auto open the autocomplete without user typing. delay is the dialog open animation duration
    setTimeout(() => this.autocompleteState.set("open"), 125)
  }





  public readonly search = signal("")
  public readonly targetBase = signal<Base | null>(null)
  public readonly targetBaseName = computed(() => this.targetBase()?.name() || "(unnamed)")
  public readonly targetBaseType =
    computed(() => this.targetBase()?.iconName || this.targetBase()?.baseType?.() || "")



  public itemToString = () => ""

  hasSelectedOrders(form: NgForm): boolean
  {
    const selections = form.value as Record<string, unknown>
    return Object.values(selections).some((selected) => selected === true)
  }

  transfer(orders?: Record<string, boolean>)
  {
    if (orders && this.base)
      Object.entries(orders).forEach(([orderId, selected]) =>
      {
        if (selected)
          this.orderService.transferOrder(orderId, this.base!.id)
      })

    else
    {
      const order = this.order
      const targetMarkerId = this.targetBase()?.id
      if (!targetMarkerId || !order)
        return

      this.orderService.transferOrder(order.id, targetMarkerId)
    }

    this.close()
  }



  public readonly opsBaseList = computed(() =>
  {
    const search = this.search().toLowerCase()
    const baseList = this.baseService.baseList()

    return baseList.filter((base) =>
      base.baseClass === "OpsBase" &&
        (
          base.name().toLowerCase().includes(search) ||
          base.baseType?.().toLowerCase().includes(search)
        ))
  })



  public readonly mapIconList = computed(() =>
  {
    const search = this.search().toLowerCase()
    const baseList = this.baseService.baseList()
    return baseList.filter((base) => base.baseClass === "MapIcon" && base.name() &&
      (
        base.name().toLowerCase().includes(search) ||
        base.iconName?.toLowerCase().includes(search) ||
        base.id.toLowerCase().includes(search)
      ))
      .map((base) => ({ ...base, region: base.id.split(".")[0].replace("Hex", "") }))
  })
}
