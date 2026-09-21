import { Component, inject, computed, signal } from "@angular/core"
import { OrderService } from "../../../../services/order.service"
import { BaseService } from "../../../../services/base.service"
import { HlmFieldImports } from "@spartan-ng/helm/field"
import { HlmRadioGroupImports } from "@spartan-ng/helm/radio-group"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { SocketService } from "../../../../services/socket.service"
import Events from "@loc/common"
import { toast } from "@spartan-ng/brain/sonner"
import { FormsModule } from "@angular/forms"
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner"
import { InfoLayerService } from "../../../../services/info-layer.service"

@Component({
  selector: "app-admin-tab-data",
  imports: [
    HlmFieldImports,
    HlmRadioGroupImports,
    HlmButtonImports,
    FormsModule,
    HlmSpinnerImports,
  ],
  templateUrl: "./admin-tab-data.html",
  styles: ``,
})
export class AdminTabData
{
  private readonly orders = inject(OrderService).orderList
  private readonly bases = inject(BaseService).opsBaseSyncList
  private readonly socket = inject(SocketService).socket
  public readonly shapeCount = inject(InfoLayerService).shapeCount.asReadonly()

  readonly orderCount = computed(() => this.orders().length)
  readonly baseCount = computed(() => this.bases.length)
  readonly completedOrderCount = computed(() => this.orders().filter((o) => o().completed).length)

  readonly selectedData = signal<"infolayer" | "orders" | "bases" | "all">("infolayer")



  public readonly waitingForResponse = signal(false)

  resetData()
  {
    const type = this.selectedData()
    const socket = this.socket()

    if (this.waitingForResponse() || !socket.connected)
      return


    this.waitingForResponse.set(true)
    socket.timeout(10000).emit(Events.ADMIN_RESET_DATA, type, this.resetResponseHandler)
    toast.loading(`Resetting application data...`, { id: "reset-data", duration: 1000 * 60 * 60 })
  }

  resetResponseHandler = (error: Error | null, response: boolean) =>
  {
    this.waitingForResponse.set(false)
    if (error)
      toast.error(`Failed to reset application data: ${error.message}`, { id: "reset-data", duration: 1000 * 10 })
    else if (response)
      toast.success(`Application data reset successfully.`, { id: "reset-data", duration: 1000 * 5 })
    else
      toast.error(`Failed to reset application data.`, { id: "reset-data", duration: 1000 * 10 })
  }
}
