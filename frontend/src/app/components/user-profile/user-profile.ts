import { Component, computed, ElementRef, inject, viewChild } from "@angular/core"
import { provideIcons } from "@ng-icons/core"
import {
  lucideLogIn, lucideMoreVertical, lucideSettings2, lucideShieldCog, lucideUndo2,
  lucideUserRoundArrowLeft,
} from "@ng-icons/lucide"
import { HlmAvatarImports } from "@spartan-ng/helm/avatar"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { HlmItemImports } from "@spartan-ng/helm/item"
import { HlmSkeletonImports } from "@spartan-ng/helm/skeleton"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { UserAvatar } from "../user-avatar/user-avatar"
import { AuthService } from "../../services/auth.service"
import { HlmPopoverImports } from "@spartan-ng/helm/popover"
import { UserProfilePopover } from "./user-profile-popover"
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner"
import { HlmDialogService } from "../../../../libs/ui/dialog/src/lib/hlm-dialog.service"
import { AdminDialog, adminDialogOptions } from "../admin-dialog/admin-dialog"

@Component({
  imports: [
    HlmItemImports,
    HlmButtonImports,
    HlmAvatarImports,
    HlmIconImports,
    HlmSkeletonImports,
    HlmDropdownMenuImports,
    UserAvatar,
    HlmPopoverImports,
    UserProfilePopover,
    HlmSpinnerImports,
  ],
  providers: [
    provideIcons({
      lucideLogIn,
      lucideMoreVertical,
      lucideSettings2,
      lucideShieldCog,
      lucideUndo2,
      lucideUserRoundArrowLeft,
    }),
  ],
  selector: "app-user-profile",
  styles: ``,
  templateUrl: "./user-profile.html",
})
export class UserProfile
{
  private readonly auth = inject(AuthService)
  private readonly hlmDialogService = inject(HlmDialogService)



  public readonly authenticationInitialized = computed(() =>
    this.auth.isPending() === false
    && this.auth.isRefetching() === false)

  public readonly hasSessionError = computed(() => !!this.auth.error())
  public readonly isAuthenticated = computed(() => this.auth.session() !== null)
  public readonly isImpersonated = computed(() => !!this.auth.session()?.impersonatedBy)
  public readonly isAdmin = computed(() => this.auth.user()?.role === "admin")
  public readonly user = computed(() => this.auth.user())
  public login = this.auth.signIn
  public logout = this.auth.signOut
  public stopImpersonating = () => this.auth.stopImpersonating()


  readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>("PopoverAnchor")

  clickHandler()
  {
    const button = this.menuButton()
    if (button)
      button.nativeElement.click()
  }

  public openAdminDialog()
  {
    this.hlmDialogService.open(AdminDialog, adminDialogOptions)
  }
}