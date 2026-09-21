import { Component, inject, signal } from "@angular/core"
import { HlmFieldImports } from "@spartan-ng/helm/field"
import { HlmRadioGroupImports } from "@spartan-ng/helm/radio-group"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { SocketService } from "../../../../services/socket.service"
import Events from "@loc/common"
import { toast } from "@spartan-ng/brain/sonner"
import { FormsModule } from "@angular/forms"
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner"
import { SettingsService } from "../../../../services/settings.service"
import { HlmInputImports } from "@spartan-ng/helm/input"
import { HlmInputGroupImports } from "@spartan-ng/helm/input-group"
import { BackendSettings, FrontendSettings } from "@loc/types"

@Component({
  selector: "app-admin-tab-settings",
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputGroupImports,
    HlmInputImports,
    HlmRadioGroupImports,
    HlmSpinnerImports,
  ],
  templateUrl: "./admin-tab-settings.html",
  styles: ``,
})
export class AdminTabSettings
{
  public readonly settings = inject(SettingsService).settings.asReadonly()
  private readonly socket = inject(SocketService).socket

  readonly selectedData = signal<"orders" | "bases" | "all">("orders")


  saveFrontendSettings(v: Partial<FrontendSettings>)
  {
    const socket = this.socket()
    socket.emit(Events.ADMIN_FRONTEND_SETTINGS, v)
    toast.success(`Frontend settings saved.`, { id: "save-frontend-settings", duration: 1000 * 5 })
  }


  saveBackendSettings(v: Partial<BackendSettings>)
  {
    const perms = v["auth.permitted-roles"]?.toString().split(/[\s,]+/).filter((s) => s.length > 0)
    const admin = v["auth.admin-roles"]?.toString().split(/[\s,]+/).filter((s) => s.length > 0)

    const update = {
      ...v,
      "auth.permitted-roles": perms,
      "auth.admin-roles": admin,
    }

    const socket = this.socket()
    socket.emit(Events.ADMIN_BACKEND_SETTINGS, update)
    toast.success(`Backend settings saved.`, { id: "save-backend-settings", duration: 1000 * 5 })
  }
}
