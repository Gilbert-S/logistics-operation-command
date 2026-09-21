import { Component, inject } from "@angular/core"
import { HlmAccordionImports } from "@spartan-ng/helm/accordion"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmIconImports } from "@spartan-ng/helm/icon"
import { BaseViewer } from "../base-viewer/base-viewer"
import { OrderList } from "../orders/order-list/order-list"
import { UserProfile } from "../user-profile/user-profile"
import { MyDelivery } from "../deliveries/my-delivery/my-delivery"
import { HlmTabsImports } from "@spartan-ng/helm/tabs"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { lucidePackage, lucideTruck, lucideUsers } from "@ng-icons/lucide"
import { DeliveryList } from "../deliveries/delivery-list/delivery-list"
import { PresenceService } from "../../services/presence.service"
import { UserPresence } from "../user-presence/user-presence"
import { SocketService } from "../../services/socket.service"
import { OverviewIconsBar } from "../overview-icons-bar/overview-icons-bar"

@Component({
  imports: [
    HlmButtonImports,
    HlmAccordionImports,
    HlmIconImports,
    BaseViewer,
    OrderList,
    UserProfile,
    MyDelivery,
    HlmTabsImports,
    NgIcon,
    DeliveryList,
    UserPresence,
    OverviewIconsBar,
  ],
  providers: [provideIcons({ lucidePackage, lucideUsers, lucideTruck })],
  selector: "app-sidebar",
  template: `
      <hlm-tabs tab="orders" class="
        relative flex h-full max-h-screen flex-col gap-6 overflow-hidden bg-sidebar p-6 pt-0
      ">
        @if (connected()) {
          <div class="absolute top-0 left-0 h-3 w-full bg-muted"></div>

          <div class="flex flex-row justify-center">
            <hlm-tabs-list>
              <button hlmTabsTrigger="orders"><ng-icon name="lucidePackage"/>Orders</button>
              <button hlmTabsTrigger="deliveries"><ng-icon name="lucideTruck"/>Deliveries</button>
              <button hlmTabsTrigger="presence"><ng-icon name="lucideUsers"/>Presence</button>
            </hlm-tabs-list>
          </div>

          <app-overview-icons-bar class="-my-3" />

          <div hlmTabsContent="orders" class="
            -mr-2 flex-auto shrink overflow-auto pr-2 not-firefox:scroll-fade-b
          ">
            <app-order-list />
          </div>

          <div hlmTabsContent="deliveries" class="
            -mr-2 flex flex-auto shrink flex-col gap-2 overflow-auto pr-2
          ">
            <app-delivery-list />
          </div>

          <div hlmTabsContent="presence" class="-mx-3 flex flex-auto flex-col overflow-auto">
            <app-user-presence class="
              flex flex-col gap-1 overflow-y-auto not-firefox:scroll-fade-y
            " />
          </div>
        }
        <div class="shrink-9999 grow"></div>
        <app-my-delivery class="contents"/>
        <app-base-viewer/>

        <app-user-profile />

      </hlm-tabs>


  `,
})
export class Sidebar
{
  test = inject(PresenceService).presences
  connected = inject(SocketService).connected.asReadonly()
}
