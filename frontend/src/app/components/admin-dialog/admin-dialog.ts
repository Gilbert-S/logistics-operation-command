import { Component } from "@angular/core"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { lucideDatabaseZap, lucideHardDrive, lucideSettings, lucideUsers } from "@ng-icons/lucide"
import { HlmDialogImports, HlmDialogOptions } from "@spartan-ng/helm/dialog"
import { HlmTabsImports } from "@spartan-ng/helm/tabs"
import { AdminTabData } from "./tabs/admin-tab-data/admin-tab-data"
import { AdminTabUser } from "./tabs/admin-tab-user/admin-tab-user"
import { AdminTabBackups } from "./tabs/admin-tab-backups/admin-tab-backups"
import { AdminTabSettings } from "./tabs/admin-tab-settings/admin-tab-settings"



export const adminDialogOptions: Partial<HlmDialogOptions<unknown>> = {
  showCloseButton: true,
  closeOnOutsidePointerEvents: false,
  hasBackdrop: true,
  contentClass: tw`w-230 max-w-[95vw] sm:max-w-[95vw] min-w-0 h-230 min-h-0 max-h-[95vh] p-7 overflow-auto`,
}



@Component({
  selector: "app-admin-dialog",
  imports: [
    HlmDialogImports,
    HlmTabsImports,
    NgIcon,
    AdminTabData,
    AdminTabUser,
    AdminTabBackups,
    AdminTabSettings,
  ],
  providers: [provideIcons({ lucideDatabaseZap, lucideUsers, lucideHardDrive, lucideSettings })],
  templateUrl: "./admin-dialog.html",
})
export class AdminDialog {}


function tw(...args: TemplateStringsArray[]): string
{
  return args.join(" ")
}