import { Component, computed, inject, signal } from "@angular/core"
import { AuthService } from "../../../../services/auth.service"
import { HlmSpinner } from "@spartan-ng/helm/spinner"
import { UserAvatar } from "../../../user-avatar/user-avatar"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { FromNowPipe } from "../../../../pipes/from-now-pipe"
import { SignalPipe } from "../../../../pipes/signal-pipe"
import { HlmBadgeImports } from "@spartan-ng/helm/badge"
import { NgIcon, provideIcons } from "@ng-icons/core"
import {
  lucideChevronLeft, lucideChevronRight, lucideLogOut, lucideMoreVertical, lucideSearch,
  lucideTrash, lucideUserCheck, lucideUserX, lucideVenetianMask,
} from "@ng-icons/lucide"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { HlmInputImports } from "@spartan-ng/helm/input"
import { HlmButtonGroupImports } from "@spartan-ng/helm/button-group"
import { HlmFieldImports } from "@spartan-ng/helm/field"


@Component({
  selector: "app-admin-tab-user",
  imports: [
    FromNowPipe,
    HlmBadgeImports,
    HlmButtonGroupImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmInputImports,
    HlmSpinner,
    NgIcon,
    SignalPipe,
    UserAvatar,
    HlmFieldImports,
  ],
  providers: [
    provideIcons({
      lucideChevronLeft,
      lucideChevronRight,
      lucideLogOut,
      lucideMoreVertical,
      lucideSearch,
      lucideTrash,
      lucideUserCheck,
      lucideUserX,
      lucideVenetianMask,
    }),
  ],
  templateUrl: "./admin-tab-user.html",
})
export class AdminTabUser
{
  auth = inject(AuthService)


  readonly page = signal(1)
  readonly search = signal<string | undefined>(undefined)
  readonly limit = signal(10)

  readonly users = this.auth.getUsers(this.page, this.limit, this.search)

  readonly maxPage = computed(() => Math.ceil((this.users.value().total ?? 0) / this.limit()))

  nextPage()
  {
    if (this.page() < this.maxPage())
      this.page.set(this.page() + 1)
  }

  prevPage()
  {
    if (this.page() > 1)
      this.page.set(this.page() - 1)
  }





  impersonate = async (userId: string) =>
  {
    await this.auth.impersonate(userId)
    this.users.reload()
  }

  stopImpersonating = async () =>
  {
    await this.auth.stopImpersonating()
    this.users.reload()
  }

  ban = async (userId: string) =>
  {
    await this.auth.ban(userId)
    this.users.reload()
  }

  unban = async (userId: string) =>
  {
    await this.auth.unban(userId)
    this.users.reload()
  }

  revokeSessions = async (userId: string) =>
  {
    await this.auth.revokeSessions(userId)
    this.users.reload()
  }

  remove = async (userId: string) =>
  {
    await this.auth.remove(userId)
    this.users.reload()
  }

}
