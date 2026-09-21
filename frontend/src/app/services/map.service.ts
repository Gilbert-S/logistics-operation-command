import {
  computed, effect, inject, Injectable, signal,
  untracked,
  WritableSignal,
} from "@angular/core"
import { default as L } from "leaflet"
import { Map, MapData, RequestResponse } from "@loc/types"
import { initializeDynamicMapLayers, initializeMap } from "./map.initialize"
import { ContextMenu } from "./context-menu"
import { MapIconsLayer } from "../map-layers/map-icons.layer"
import { SocketService } from "./socket.service"
import { Events } from "@loc/common"
import * as jsondiffpatch from "jsondiffpatch"
import { toast } from "@spartan-ng/brain/sonner"
import { environment } from "../../environments/environment"
import { LocalUserPreferenceService } from "./local-user-preference.service"
import { InfoLayerService } from "./info-layer.service"





@Injectable({ providedIn: "root" })
export class MapService
{
  public readonly map = signal<L.Map | null>(null)
  public readonly zoomLevel = signal(2)
  public readonly layers: WritableSignal<Map.Layer[]> = signal([])
  public readonly infoLayerService = inject(InfoLayerService)


  readonly mapData = signal<MapData | null>(null)
  readonly mapDataIteration = signal(-1)
  mapDataUpdateInterval: number | undefined

  public readonly opsLayer = signal<L.LayerGroup>(L.layerGroup())
  contextMenu = inject(ContextMenu)
  mapIconsLayer = inject(MapIconsLayer)

  socket = inject(SocketService).socket
  mapMod = inject(LocalUserPreferenceService).mapMod.asReadonly()

  infoLayer = L.layerGroup()

  readonly tileLayerUrlTemplate = computed(() =>
  {
    const CDNBaseUrl = environment.CDNBaseUrl
    let mapMod = this.mapMod()

    if (!environment.availableMapMods.find((mod) => mod.key === mapMod))
      mapMod = environment.availableMapMods[0].key

    const tileLayerDefaultUrlTemplate = `${CDNBaseUrl}/map-tiles/${mapMod}/{z}/{x}/{y}.webp`
    return tileLayerDefaultUrlTemplate
  })
  readonly tileLayer = signal<L.TileLayer | null>(null)



  // (re)initialized map as soon as the signal this.map() gets a (new) value
  private mapEffect = effect(() =>
  {
    if (this.map())
      untracked(() =>
      {
        initializeMap.call(this)
        this.infoLayerService.initialize(this.map()!, this.infoLayer)
      })
  })


  // initialize dynamic layers when both map and mapData are available
  private mapDataEffect = effect(() =>
  {
    if (this.map() && this.mapData())
      untracked(() => initializeDynamicMapLayers.call(this))
  })


  // update tile layer URL when user changes map mod
  private mapModEffect = effect(() =>
  {
    const tileLayerUrlTemplate = this.tileLayerUrlTemplate()
    untracked(() =>
    {
      const tileLayer = this.tileLayer()
      if (tileLayer)
      {
        tileLayer.setUrl(tileLayerUrlTemplate)

        if (tileLayerUrlTemplate.includes("/default/"))
          tileLayer.options.maxNativeZoom = 5
        else
          tileLayer.options.maxNativeZoom = 6
      }
    })
  })



  private readonly layerVisibility = computed(() =>
  {
    const zoom = this.zoomLevel()
    const layers = this.layers()
    const result = {
      visible: [] as Map.Layer[],
      invisible: [] as Map.Layer[],
    }

    layers.forEach((layer) =>
    {
      if (layer.enabled() && zoom >= layer.zoomMin && zoom <= layer.zoomMax)
        result.visible.push(layer)
      else
        result.invisible.push(layer)
    })

    return result
  })



  private onZoomendEventHandler = () => this.zoomLevel.set(this.map()?.getZoom() ?? 0)
  // add map event listener to update zoom level signal
  private mapZoomEffect = effect(() =>
  {
    const map = this.map()
    if (!map) return

    map.off("zoomend", this.onZoomendEventHandler)
    map.on("zoomend", this.onZoomendEventHandler)
  })



  // add/remove layers from map based on their visibility (determined by zoom level and user choice)
  private layerVisibilityEffect = effect(() =>
  {
    const map = this.map()
    if (!map) return

    this.layerVisibility().visible.forEach((layer) =>
    {
      if (!map.hasLayer(layer.leafletLayer))
      {
        layer.leafletLayer.addTo(map)
        if (isCanvasIconLayer(layer.leafletLayer))
          layer.leafletLayer.redraw()
        map.setZoom(map.getZoom())
      }
    })

    this.layerVisibility().invisible.forEach((layer) =>
    {
      if (map.hasLayer(layer.leafletLayer))
        map.removeLayer(layer.leafletLayer)
    })

  })





  socketEffect = effect(() =>
  {
    const socket = this.socket()

    untracked(() =>
    {
      if (!socket) return

      if (!socket.connected)
        socket.once("connect", () => this.setupSocketHandlers())
      else
        this.setupSocketHandlers()
    })
  })


  setupSocketHandlers = () =>
  {
    this.socket().on(Events.SYNC_MAP_DATA, this.syncMapDataHandler)
    this.requestMapDataUpdate()
    this.resetIdleUpdateTimout()
  }


  resetIdleUpdateTimout = () =>
  {
    const min = 1000 * 60 * 2.5 // 2.5 minutes
    const max = 1000 * 60 * 6 // 6 minutes
    const idleTimeout = Math.floor(Math.random() * (max - min + 1) + min) // random timeout between min and max

    clearTimeout(this.mapDataUpdateInterval)
    this.mapDataUpdateInterval = setTimeout(() => this.requestMapDataUpdate(), idleTimeout)
  }


  requestMapDataUpdate()
  {
    const socket = this.socket()
    if (!socket || !socket.connected) return

    socket.emit(
      Events.REQUEST_MAP_DATA,
      this.mapDataIteration(),
      this.requestMapDataResponseHandler,
    )

    toast.loading("Requesting map data update", { duration: 20000, id: "requesting-map-data" })
  }

  requestMapDataResponseHandler = (error: Error, response: RequestResponse<MapData>) =>
  {
    toast.dismiss("requesting-map-data")

    this.resetIdleUpdateTimout()

    if (error)
      console.error("Error requesting map data update:", error)

    if (!response)
      return

    this.mapDataIteration.set(response.iteration)

    if (response.full)
      this.mapData.set(response.full)

    if (response.delta && this.mapData())
    {
      const mapData = this.mapData()
      response.delta.forEach((delta) =>
      {
        jsondiffpatch.patch(mapData, delta)
      })
      this.mapData.set({ ...mapData })
    }
  }


  syncMapDataHandler = (data: { iterationNumber: number, diff: jsondiffpatch.Delta }) =>
  {
    const { iterationNumber, diff } = data
    const mapData = this.mapData()

    if (!mapData || !iterationNumber || !diff)
      return

    if (iterationNumber < this.mapDataIteration())
    {
      this.mapDataIteration.set(-1)
      return this.requestMapDataUpdate()
    }

    if (iterationNumber - this.mapDataIteration() !== 1)
      return this.requestMapDataUpdate()
    else
      jsondiffpatch.patch(mapData, diff)

    this.mapData.set({ ...mapData })
    this.mapDataIteration.set(iterationNumber)
    this.resetIdleUpdateTimout()
  }





  addLayerToggleToSidebar(
    leafletLayer: L.Layer | L.LayerGroup | L.CanvasIconLayer,
    options: Partial<Map.Layer>,
  ): void
  {
    const { maxZoom, minZoom } = this.map()?.options ?? {}

    const layer: Map.Layer = {
      enabled: signal(true),
      icon: "lucideHexagon",
      leafletLayer,
      name: "New Layer",
      zoomMax: maxZoom ?? 999,
      zoomMin: minZoom ?? 0,

      ...options,
    }

    if (this.layers().find((l) => l.leafletLayer === leafletLayer))
      return

    // replace layer with same name or add new layer
    const index = this.layers().findIndex((l) => l.name === layer.name)
    if (index !== -1)
    {
      this.layers()[index].leafletLayer.remove()
      this.layers.update((layers) =>
      {
        layers[index] = layer
        return [...layers]
      })
    }
    else
      this.layers.update((layers) => [...layers, layer])

  }

}





// CanvasIconLayer type guard
function isCanvasIconLayer(layer: unknown): layer is L.CanvasIconLayer
{
  return (layer as L.CanvasIconLayer).redraw !== undefined
}
