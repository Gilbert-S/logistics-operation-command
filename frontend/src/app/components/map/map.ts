import { Component, computed, effect, ElementRef, inject, viewChild } from "@angular/core"
import { MapService } from "../../services/map.service"
import { ContextMenu } from "../context-menu/context-menu"
import { default as L } from "leaflet"

import { HlmContextMenuImports } from "@spartan-ng/helm/context-menu"
import { SocketService } from "../../services/socket.service"





@Component({
  host: { "[style.--zoom-level]": "zoomLevel()" },
  imports: [
    ContextMenu,
    HlmContextMenuImports,
  ],
  selector: "app-map",
  styleUrl: "./map.scss",
  templateUrl: "./map.html",
})
export class Map
{
  protected readonly mapContainerRef = viewChild.required<ElementRef>("map")
  protected readonly mapContainer =
    computed(() => this.mapContainerRef().nativeElement as HTMLElement)

  protected mapService = inject(MapService)

  private map = this.mapService.map
  zoomLevel = this.mapService.zoomLevel

  readonly socket = inject(SocketService).socket
  readonly connected = inject(SocketService).connected.asReadonly()



  private mapOptions: L.MapOptions = {
    attributionControl: false,
    crs: L.CRS.Simple,
    maxZoom: 8,
    minZoom: 2,
    preferCanvas: true,
    renderer: L.canvas({ padding: 0 }),
    zoomAnimation: false,
    zoomControl: false,
  }





  constructor()
  {
    effect(() => // initialize map when mapContainer becomes available
    {
      if (!this.mapContainer())
        return

      // initialize map next frame after DOM container has been rendered (so it has an actual size)
      requestAnimationFrame(() => this.initializeMap())
    })
  }

  initializeMap()
  {
    const map = L.map(this.mapContainer(), this.mapOptions)

    /** add some nice spacing around the actual map bounds to be able to scroll over the map
     * edges. This way, map border areas arent cramped to the screen edge.
     */
    map.setMaxBounds(L.latLngBounds(L.latLng(19, 396), L.latLng(-275, -140)))

    /** center map view */
    map.setView([-128, 128], 2, { animate: false })


    this.map.set(map)
  }

}