import { Component, inject, signal } from "@angular/core"
import { SocketService } from "../../../../services/socket.service"
import { Events } from "@loc/common"
import { toast } from "@spartan-ng/brain/sonner"
import { FromNowPipe } from "../../../../pipes/from-now-pipe"
import { SignalPipe } from "../../../../pipes/signal-pipe"
import { DatePipe } from "@angular/common"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { lucideDatabaseBackup, lucideInfo } from "@ng-icons/lucide"
import { HlmButtonImports } from "@spartan-ng/helm/button"


@Component({
  selector: "app-admin-tab-backups",
  imports: [FromNowPipe, SignalPipe, DatePipe, NgIcon, HlmButtonImports],
  providers: [provideIcons({ lucideDatabaseBackup, lucideInfo })],
  templateUrl: "./admin-tab-backups.html",
})
export class AdminTabBackups
{
  private readonly socket = inject(SocketService).socket
  public readonly backups = signal<{ id: number, time: Date }[]>([])


  constructor()
  {
    this.getBackupList()
  }

  getBackupList()
  {
    this.socket().timeout(5000).emit(
      Events.ADMIN_BACKUP_LIST,
      (error: unknown, backups: { id: number, time: Date }[]) =>
      {
        this.backups.set(backups)
      },
    )
  }

  restoreBackup(id: number)
  {
    toast.loading(`Restoring backup...`, { id: "restore-backup", duration: 1000 * 60 * 60 })

    this.socket().emit(Events.ADMIN_BACKUP_RESTORE, id, (error: Error, success: boolean) =>
    {
      if (success)
        toast.success(`Backup restored.`, { id: "restore-backup", duration: 1000 * 5 })
      else
        toast.error(`Failed to restore backup. ${error}`, { id: "restore-backup", duration: 1000 * 10 })
    })
  }

}
