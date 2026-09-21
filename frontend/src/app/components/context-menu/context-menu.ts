import { Component, computed, inject } from "@angular/core"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { ContextMenu as Context } from "../../services/context-menu"
import { OrderService } from "../../services/order.service"
import { BaseService } from "../../services/base.service"





@Component({
  imports: [HlmDropdownMenuImports],
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




  newOpsBase(): void
  {
    this.baseService.newOpsBase(this.event()!)
  }

}
