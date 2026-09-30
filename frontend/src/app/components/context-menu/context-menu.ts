import { Component, computed, inject } from "@angular/core"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { ContextMenu as Context } from "../../services/context-menu"
import { OrderService } from "../../services/order.service"
import { Base, BaseService } from "../../services/base.service"
import { MapService } from "../../services/map.service"
import { KeyValuePipe } from "@angular/common"
import { InfoLayerService } from "../../services/info-layer.service"
import { HlmDialogService } from "@spartan-ng/helm/dialog"
import { OrderTransfer } from "../orders/order-transfer/order-transfer"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { lucideArrowRightLeft, lucideMove, lucideShoppingCart, lucideSquarePen }
  from "@ng-icons/lucide"





@Component({
  imports: [HlmDropdownMenuImports, KeyValuePipe, NgIcon],
  providers: [
    provideIcons({
      lucideArrowRightLeft,
      lucideMove,
      lucideShoppingCart,
      lucideSquarePen,
    }),
  ],
  selector: "app-context-menu",
  styles: ":host {display: contents;}",
  templateUrl: "./context-menu.html",
})
export class ContextMenu
{
  private baseService = inject(BaseService)
  private contextEvent = inject(Context).contextEvent
  private editingBase = this.baseService.editingBase
  private readonly event = computed(() => this.contextEvent()?.event || null)


  public readonly isSelected = computed(() => this.base() === this.editingBase())
  public readonly isDraggable = computed(() => this.base()?.draggable?.())
  public readonly isOpsBase = computed(() => this.base()?.baseClass === "OpsBase")
  public readonly base = computed(() => this.contextEvent()?.base || null)
  public clickHandlerBaseEdit = this.baseService.clickHandlerBaseEdit

  protected newOrder = inject(OrderService).newOrder
  private readonly map = inject(MapService).map.asReadonly()




  newOpsBase(): void
  {
    this.baseService.newOpsBase(this.event()!)
  }



  infoLayerService = inject(InfoLayerService)
  markers = this.infoLayerService.markers

  drawMarker(marker: typeof this.markers[keyof typeof this.markers]): void
  {
    const map = this.map()
    if (!map)
      return

    const icon = this.infoLayerService.createIcon(marker.alt)

    map.pm.enableDraw("Marker", {
      continueDrawing: false,
      markerEditable: false,
      markerStyle: { title: marker.title, alt: marker.alt, icon },
    })
  }

  private readonly _hlmDialogService = inject(HlmDialogService)

  transferOrders(base: Base | null)
  {
    if (!base)
      return

    this._hlmDialogService.open(OrderTransfer, {
      contentClass: "sm:max-w-[80vw] max-w-[80vw] w-[500px]",
      context: { base },
    })
  }
}
