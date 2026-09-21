import { Component, effect, inject, linkedSignal } from "@angular/core"
import { HlmResizableImports } from "@spartan-ng/helm/resizable"
import { Sidebar } from "../sidebar/sidebar"
import { Map } from "../map/map"
import { MapService } from "../../services/map.service"
import { Layers } from "../layers/layers"
import { OrderEditor } from "../orders/order-editor/order-editor"
import { LocalUserPreferenceService } from "../../services/local-user-preference.service"
import { HlmToasterImports } from "@spartan-ng/helm/sonner"

@Component({
  selector: "app-root",
  imports: [
    HlmResizableImports,
    Sidebar,
    Map,
    Layers,
    OrderEditor,
    HlmToasterImports,
  ],
  template: `

    <hlm-resizable-group class="h-screen max-h-screen w-screen max-w-screen overflow-hidden"
      [(layout)]="layout" (dragEnd)="onResize()">

      <hlm-resizable-panel class="min-w-87.5" minSize="20"  maxSize="50" collapsible="false">
        <app-sidebar />
      </hlm-resizable-panel>

      <hlm-resizable-handle withHandle class="
        z-401 after:w-4 hover:bg-ring [&>div]:bg-ring hover:[&>div]:bg-[#8c8c8c]
      " />

      <hlm-resizable-panel  minSize="50" collapsible="false">
        <app-map/>
      </hlm-resizable-panel>

    </hlm-resizable-group>


    <section id="triggered-components-container" class="size-0 overflow-hidden">
      <app-order-editor/>
      <app-layers/>
    </section>

    <hlm-toaster richColors="true" theme="dark" position="top-center" visibleToasts="10" />
  `,
  styles: `hlm-toaster { --radius: 3px; }`,
})
export class AppRoot
{
  private map = inject(MapService).map

  onResize()
  {
    requestAnimationFrame(() => this.map()?.invalidateSize())
  }

  userStoredLayout = inject(LocalUserPreferenceService).sidebarLayout
  readonly layout = linkedSignal<number[]>(() => this.userStoredLayout())


  private debounce = 0
  private layoutEffect = effect(() =>
  {
    const layout = this.layout()
    clearTimeout(this.debounce)
    this.debounce = setTimeout(() => this.userStoredLayout.set(layout), 1000)
  })
}
