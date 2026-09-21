import {
  ApplicationRef,
  computed,
  createComponent,
  effect, EffectRef, EnvironmentInjector, inject, Injectable, Injector, Signal, signal,
  WritableSignal,
  untracked,
  linkedSignal,
  ComponentRef,
  inputBinding,
} from "@angular/core"
import L from "leaflet"
import { DEFAULT_ICON, MAP_ICONS, MAP_ICONS_NAME, OPSBASE_ICONS } from "../config/mapicons"
import { OpsBase, RequestResponse, WarAPI } from "@loc/types"
import { ContextMenu } from "./context-menu"
import { MapService } from "./map.service"
import { SocketService } from "./socket.service"
import { Events } from "@loc/common"
import { jdp } from "@loc/jdp"
import { type Delta } from "jsondiffpatch"
import { OrderService } from "./order.service"
import { OrderIndicator } from "../components/order-indicator/order-indicator"
import { environment } from "../../environments/environment"





/*
  Base
  any map marker representing a base (custom OpsBases or game defined MapIcons)
  bases are logistics delivery locations for orders

  this service handles creation, management and storage
*/


@Injectable({ providedIn: "root" })
export class BaseService
{
  // list of all existing bases
  readonly baseList = signal<Base[]>([])

  // list of OpsBases used for syncing with server and other clients
  opsBaseSyncList: OpsBase[] = []
  readonly opsBaseIteration = signal(-1)
  opsBaseUpdateInterval: number | undefined


  // highlight a base marker on the map
  public readonly selectedBase = linkedSignal<Base | null>(() => this.editingBase())

  // open base viewer with selected base
  public readonly editingBase = signal<Base | null>(null)


  // cancels the timeout function that disables base dragging after 10 seconds
  private cancelDraggingBaseTimeout: (() => void) | undefined




  protected injector: Injector = inject(Injector)
  private contextMenu = inject(ContextMenu)

  private readonly environmentInjector = inject(EnvironmentInjector)
  private readonly applicationRef = inject(ApplicationRef)

  private readonly socket = inject(SocketService).socket

  private readonly orderService = inject(OrderService)





  public getBase(id: string): Base | null
  {
    return this.baseList().find((base) => base.id === id) || null
  }




  highlightEffect = effect((cleanup) =>
  {
    const base = this.selectedBase()
    if (!base) return

    base.iconUrl()
    base.name()
    const on = () => this.highlight(base.id, true)
    const off = () => this.highlight(base.id, false)

    on()
    const timeout = setTimeout(() =>
    {
      this.selectedBase.set(null)
    }, 10 * 1000)

    cleanup(() =>
    {
      clearTimeout(timeout)
      off()
    })
  })





  public newBase(options: BaseOptions): Base
  {

    const baseClass = options.baseClass || "MapIcon"
    const baseType = signal<BaseType>(options.baseType || "Bunker Base T1")
    const name = signal<string>(options.name || "")
    const team = signal<WarAPI.TeamId>(options.team || "NONE")
    const icon = signal<L.Icon | L.DivIcon>(options.icon)
    const marker = signal<L.Marker>(options.marker)
    const layer = signal<L.LayerGroup | L.CanvasIconLayer>(options.layer)
    const orderIndicatorComponent = signal<ComponentRef<unknown> | undefined>(undefined)
    const orderIndicatorMarker = signal<L.Marker | undefined>(undefined)
    const namePosition = signal<BaseLabelPosition>(options.namePosition || "bottom")
    const orderIndicatorPosition =
      signal<BaseLabelPosition>(options.orderIndicatorPosition || "top")

    let draggable: WritableSignal<boolean> | undefined
    if (baseClass === "OpsBase")
      draggable = signal<boolean>(false)

    /** auto-generate iconUrl based on baseClass, baseType and team using predefined
     * icon sets from the config */
    const iconUrl = computed<string | undefined>(() =>
    {
      const baseUrl = environment.CDNBaseUrl
      const teamSuffixes: Record<WarAPI.TeamId, string> = {
        WARDENS: "W",
        COLONIALS: "C",
        NONE: "",
      }
      const teamSuffix = teamSuffixes[team()]

      let icon
      if (baseClass === "OpsBase")
        icon = OPSBASE_ICONS[baseType()] || DEFAULT_ICON
      else
        icon = MAP_ICONS[options.iconType || 0] || DEFAULT_ICON

      return `${baseUrl}/map-icons/${icon}${teamSuffix}.png`
    })



    const panTo = () =>
    {
      const map = this.injector.get(MapService).map()
      if (!map) return

      const coord = base?.marker()?.getLatLng()
      const zoomTo = Math.max((map.getZoom() || 0), 6)

      if (coord)
        map.setView(coord, zoomTo, { animate: true, duration: .5 })

      this.selectedBase.set(base)
    }


    const base: Base = {
      baseClass: options.baseClass || "MapIcon",
      baseType,
      draggable,
      effects: [],
      icon,
      iconName: MAP_ICONS_NAME[options.iconType || 0],
      iconType: options.iconType,
      iconUrl,
      id: options.id || crypto.randomUUID(),
      layer,
      marker,
      name,
      namePosition,
      orderIndicatorComponent,
      orderIndicatorMarker,
      orderIndicatorPosition,
      panTo,
      team,
    }

    this.baseList.update((bases) => [...bases, base])


    // update & redraw leaflets DOM marker icon or the Canvas Icon when iconUrl signal changes
    // ofc also redraws if any other dependency changes (new map, new layer, marker, ...)
    const iconUrlEffect = effect(() =>
    {
      if (!icon() || !iconUrl() || !marker())
        return

      icon().options.iconUrl = iconUrl()

      const l = layer()
      const m = marker()

      // update leaflet Canvas icon marker (game dynamic map marker)
      if (base.baseClass == "MapIcon" && ("canvas_img" in m) && ("redraw" in l))
      {
        m.canvas_img = null
        l.redraw()
      }


      // update leaflet DOM marker (custom ops base)
      if (base.baseClass == "OpsBase" && "removeLayer" in l)
      {
        l.removeLayer(marker())
        l.addLayer(marker())
      }

    }, { injector: this.injector })
    base.effects.push(iconUrlEffect)





    // update marker name when name signal changes
    // also updates the name position when namePosition signal changes
    // only relevant for OpsBases, MapIcon names are predefined by the game and not editable
    const markerNameEffect = effect(() =>
    {
      if (!marker() || base.baseClass !== "OpsBase") return

      marker().options.title = name()

      const toolTip = marker().getTooltip()

      if (!name() && toolTip)
        marker().unbindTooltip()

      else if (!name())
        return

      if (!toolTip)
        marker().bindTooltip(name(), { permanent: true, direction: namePosition() })

      else

        if (toolTip.options.direction === namePosition())
          toolTip.setContent(name() || " ")

        else
        {
          marker().unbindTooltip()
          marker().bindTooltip(name() || " ", { permanent: true, direction: namePosition() })
        }

    }, { injector: this.injector })
    base.effects.push(markerNameEffect)





    const draggableEffect = effect(() =>
    {
      this.cancelDraggingBaseTimeout?.() // cancel previous timeout if existent

      if (!draggable) return

      if (draggable())
      {
        marker().dragging!.enable()
        const timeout = setTimeout(() => draggable.set(false), 10000)
        this.cancelDraggingBaseTimeout = () => clearTimeout(timeout)
      }
      else
        marker().dragging!.disable()

    }, { injector: this.injector })
    base.effects.push(draggableEffect)



    const syncEffect = effect(() =>
    {
      if (base.baseClass !== "OpsBase")
        return

      this.syncOpsBaseChange({
        id: base.id,
        name: name(),
        nPos: namePosition(),
        oPos: orderIndicatorPosition(),
        team: team(),
        type: baseType(),
      })

    }, { injector: this.injector })
    base.effects.push(syncEffect)



    const orderIndicatorEffect = effect((onCleanup) =>
    {
      const opsLayer = this.injector.get(MapService).opsLayer

      const cleanupFn = () =>
      {
        if (base.orderIndicatorComponent())
        {
          this.applicationRef.detachView(base.orderIndicatorComponent()!.hostView)
          base.orderIndicatorComponent()!.destroy()
          base.orderIndicatorComponent.set(undefined)
        }

        if (base.orderIndicatorMarker())
        {
          opsLayer().removeLayer(base.orderIndicatorMarker()!)
          base.orderIndicatorMarker.set(undefined)
        }
      }
      onCleanup(() => untracked(() => cleanupFn()))



      const orderList = this.orderService.orderList()
      const activeOrders = orderList.filter((orderSignal) =>
      {
        const order = orderSignal()
        return order && !order.completed && order.markerId === base.id
      })

      untracked(() =>
      {

        if (activeOrders.length > 0)
        {
          if (base.orderIndicatorMarker() || base.orderIndicatorComponent())
            return

          const icon = L.divIcon({ iconAnchor: [0, 0], iconSize: [0, 0] })
          const baserMarkerLatLng = base.marker().getLatLng()
          const indicatorMarker = L.marker(baserMarkerLatLng, { icon, pmIgnore: true })


          indicatorMarker.addTo(opsLayer())
          base.orderIndicatorMarker.set(indicatorMarker)

          const componentRef = createComponent(OrderIndicator, {
            environmentInjector: this.environmentInjector,
            hostElement: indicatorMarker.getElement(),
            bindings: [inputBinding("base", () => base)],
          })

          this.applicationRef.attachView(componentRef.hostView)
          base.orderIndicatorComponent.set(componentRef)
        }
        else
          cleanupFn()
      })

    }, { injector: this.injector })
    base.effects.push(orderIndicatorEffect)



    return base
  } // eo newBase()





  // highlight or remove highlight from base markers
  private highlight(baseId: string, on: boolean, className = "highlight")
  {
    const base = this.getBase(baseId)
    if (!base) return

    const marker = base.marker()
    const layer = base.layer()

    if (base.baseClass === "MapIcon")
    {
      // custom implmentation in leaflet canvas markers plugin
      marker.options.highlight = on

      if (base.baseClass == "MapIcon" && "canvas_img" in marker && "redraw" in layer)
      {
        marker.canvas_img = null
        layer.redraw()
      }
    }



    if (base.baseClass === "OpsBase")
    {
      // styles for default 'highlight' css class for leaflet DOM marker elements
      // are defined in map component css #app/components/map/map.css
      const classList = marker.getElement()?.classList

      if (classList)
        if (on)
          classList.add(className)
        else
          classList.remove(className)
    }
  }





  public clickHandlerBaseSelect = (event: Event, base?: Base) =>
    this.selectedBase.set(base ?? null)

  public clickHandlerBaseEdit = (event: Event, base?: Base) =>
    this.editingBase.set(base ?? null)





  // custom Base created by users (Bunker Bases, FOBs, etc.)
  public newOpsBase(options: L.LeafletMouseEvent | Partial<OpsBase>): void
  {
    let input: Partial<OpsBase> = {
      id: undefined,
      lat: undefined,
      lng: undefined,
      name: undefined,
      nPos: "bottom",
      oPos: "top",
      team: undefined,
      type: undefined,
    }

    let openForEditWhenDone = true

    if ("latlng" in options)
    {
      input.lat = options.latlng.lat
      input.lng = options.latlng.lng
    }
    else
    {
      input = { ...input, ...options }
      openForEditWhenDone = false
    }


    const opsLayer = this.injector.get(MapService).opsLayer

    const icon = L.icon({
      iconUrl: " ",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    const markerOptions: L.MarkerOptions = {
      icon,
      draggable: false,
      pmIgnore: true,
    }

    const marker = L.marker(L.latLng(input.lat!, input.lng!), markerOptions)

    const base = this.newBase({
      baseClass: "OpsBase",
      baseType: input.type as BaseType,
      icon: icon,
      id: input.id,
      layer: opsLayer(),
      marker: marker,
      name: input.name,
      namePosition: input.nPos as BaseLabelPosition,
      orderIndicatorPosition: input.oPos as BaseLabelPosition,
      team: input.team as WarAPI.TeamId,
    })

    marker.options.base = base

    marker.on("contextmenu", (event) => this.contextMenu.contextMenuEventHandler(event, base))

    marker.on("dragend", () =>
    {
      this.syncOpsBaseChange({
        id: base.id,
        lat: marker.getLatLng().lat,
        lng: marker.getLatLng().lng,
      })
    })

    marker.on("drag", () => base.orderIndicatorMarker()?.setLatLng(marker.getLatLng()))

    marker.on("click", () =>
    {
      this.selectedBase.set(base)
    })



    marker.addTo(opsLayer())
    if (openForEditWhenDone)
      this.editingBase.set(base)

    this.syncNewOpsBase(base)
  }





  public deleteOpsBase(base: Base | null, syncChanges = true): void
  {
    if (!base || base.baseClass !== "OpsBase")
      return

    base.effects.forEach((effect) => effect.destroy())
    base.effects = []

    const layer = base.layer()
    const marker = base.marker()

    if ("removeMarker" in layer)
    {
      layer.removeMarker(marker)
      layer.redraw()
    }

    marker.remove()
    this.baseList.update((bases) => bases.filter((b) => b !== base))

    if (syncChanges && base)
    {
      const oldOpsBaseSyncList = JSON.parse(JSON.stringify(this.opsBaseSyncList)) as OpsBase[]
      this.opsBaseSyncList = this.opsBaseSyncList.filter((b) => b.id !== base!.id)
      this.opsBaseIteration.set(this.opsBaseIteration() + 1)
      const diff = jdp.diff(oldOpsBaseSyncList, this.opsBaseSyncList)
      this.socket().emit(Events.SYNC_OPS_BASE, this.opsBaseIteration(), diff)
    }

    base = null
  }





  syncNewOpsBase(base: Base)
  {
    if (!this.socket()?.connected || base.baseClass !== "OpsBase")
      return

    if (this.opsBaseSyncList.find((b) => b.id === base.id))
      return

    const sync = {
      id: base.id,
      lat: base.marker().getLatLng().lat,
      lng: base.marker().getLatLng().lng,
      name: base.name(),
      nPos: base.namePosition(),
      oPos: base.orderIndicatorPosition(),
      team: base.team(),
      type: base.baseType!(),
    }

    const oldOpsBaseSyncList = JSON.parse(JSON.stringify(this.opsBaseSyncList)) as OpsBase[]
    this.opsBaseSyncList.push(sync)
    this.opsBaseIteration.set(this.opsBaseIteration() + 1)

    const diff = jdp.diff(oldOpsBaseSyncList, this.opsBaseSyncList)

    this.socket().emit(Events.SYNC_OPS_BASE, this.opsBaseIteration(), diff)
  }

  syncOpsBaseChange(options: Partial<OpsBase>)
  {
    if (!this.socket()?.connected)
      return

    const oldOpsBaseSyncList = JSON.parse(JSON.stringify(this.opsBaseSyncList)) as OpsBase[]

    const syncOpsBase = this.opsBaseSyncList.find((b) => b.id === options.id)
    if (!syncOpsBase)
      return

    syncOpsBase.name = options.name ?? syncOpsBase.name
    syncOpsBase.team = options.team ?? syncOpsBase.team
    syncOpsBase.type = options.type ?? syncOpsBase.type
    syncOpsBase.lat = options.lat ?? syncOpsBase.lat
    syncOpsBase.lng = options.lng ?? syncOpsBase.lng
    syncOpsBase.nPos = options.nPos ?? syncOpsBase.nPos
    syncOpsBase.oPos = options.oPos ?? syncOpsBase.oPos


    untracked(() =>
    {
      const diff = jdp.diff(oldOpsBaseSyncList, this.opsBaseSyncList)
      if (!diff) return

      this.opsBaseIteration.set(this.opsBaseIteration() + 1)
      this.socket().emit(Events.SYNC_OPS_BASE, this.opsBaseIteration(), diff)
    })
  }





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
    this.socket().on(Events.SYNC_OPS_BASE, this.syncOpsBaseHandler)
    this.requestOpsBaseUpdate()
    this.resetIdleUpdateTimout()
  }


  resetIdleUpdateTimout = () =>
  {
    const min = 1000 * 60 * 2.5 // 2.5 minutes
    const max = 1000 * 60 * 6 // 6 minutes
    const idleTimeout = Math.floor(Math.random() * (max - min + 1) + min) // random timeout between min and max

    clearTimeout(this.opsBaseUpdateInterval)
    this.opsBaseUpdateInterval = setTimeout(() => this.requestOpsBaseUpdate(), idleTimeout)
  }


  requestOpsBaseUpdate()
  {
    const socket = this.socket()
    if (!socket || !socket.connected) return

    socket.emit(
      Events.REQUEST_OPS_BASE,
      this.opsBaseIteration(),
      this.requestOpsBaseResponseHandler,
    )
  }

  requestOpsBaseResponseHandler = (error: Error, response:RequestResponse<OpsBase[]>) =>
  {
    if (error)
      console.error("Error requesting ops base update:", error)

    if (!response)
      return

    this.opsBaseIteration.set(response.iteration)
    this.resetIdleUpdateTimout()

    if (response.full)
      this.opsBaseSyncList = response.full

    else if (response.delta && this.opsBaseSyncList)
      response.delta.forEach((delta) =>
      {
        jdp.patch(this.opsBaseSyncList, delta)
      })

    this.mergeSyncedOpsBaseChanges()
  }


  syncOpsBaseHandler = (data: { iterationNumber: number, diff: Delta }) =>
  {
    const { iterationNumber, diff } = data
    const opsBase = this.opsBaseSyncList

    if (!opsBase || !iterationNumber || !diff)
      return

    this.resetIdleUpdateTimout()

    if (iterationNumber < this.opsBaseIteration())
    {
      this.opsBaseIteration.set(-1)
      return this.requestOpsBaseUpdate()
    }

    if (iterationNumber === this.opsBaseIteration())
      return

    if (iterationNumber - this.opsBaseIteration() !== 1)
      return this.requestOpsBaseUpdate()
    else
    {
      jdp.patch(this.opsBaseSyncList, diff)
      this.opsBaseIteration.set(iterationNumber)
      this.mergeSyncedOpsBaseChanges()
    }
  }


  mergeSyncedOpsBaseChanges()
  {
    const ids: string[] = []
    this.opsBaseSyncList.forEach((opsBase) =>
    {
      ids.push(opsBase.id)
      const localOpsBase = this.getBase(opsBase.id)

      if (!localOpsBase)
        return this.newOpsBase(opsBase)

      localOpsBase.name.set(opsBase.name)
      localOpsBase.team.set(opsBase.team as WarAPI.TeamId)
      localOpsBase.baseType?.set(opsBase.type as BaseType)
      localOpsBase.marker().setLatLng(L.latLng(opsBase.lat, opsBase.lng))
      localOpsBase.namePosition.set(opsBase.nPos as BaseLabelPosition)
      localOpsBase.orderIndicatorPosition.set(opsBase.oPos as BaseLabelPosition)
    })

    // delete local OpsBases that are not in the synced list
    this.baseList().forEach((base) =>
    {
      if (base.baseClass === "OpsBase" && !ids.includes(base.id))
        this.deleteOpsBase(base, false)
    })

    this.baseList.update((bases) => [...bases])
  }


}




export interface BaseOptions
{
  baseClass?: BaseClass
  baseType?: BaseType
  icon: L.Icon | L.DivIcon
  iconType?: number
  id?: string
  layer: L.LayerGroup | L.CanvasIconLayer
  marker: L.Marker
  name?: string
  namePosition?: BaseLabelPosition
  orderIndicatorPosition?: BaseLabelPosition
  team?: WarAPI.TeamId
}





export interface Base
{
  baseClass: BaseClass
  baseType?: WritableSignal<BaseType>
  draggable?: WritableSignal<boolean>
  effects: EffectRef[]
  icon: WritableSignal<L.Icon | L.DivIcon>
  iconName?: string
  iconType?: number
  iconUrl: Signal<string | undefined>
  id: string
  layer: WritableSignal<L.LayerGroup | L.CanvasIconLayer>
  marker: WritableSignal<L.Marker>
  name: WritableSignal<string>
  namePosition: WritableSignal<BaseLabelPosition>
  orderIndicatorComponent: WritableSignal<ComponentRef<unknown> | undefined>
  orderIndicatorMarker: WritableSignal<L.Marker | undefined>
  orderIndicatorPosition: WritableSignal<BaseLabelPosition>
  team: WritableSignal<WarAPI.TeamId>
  panTo: () => void
}





export type BaseClass = "MapIcon" | "OpsBase"


export const BASE_TYPES = [
  "Bunker Base T1",
  "Bunker Base T2",
  "Bunker Base T3",
  "Bober",
  "Event",
  "Forward Operating Base",
  "Staging Area",
] as const
export type BaseType = typeof BASE_TYPES[number]
export type BaseImages = Record<BaseType, string>

export type BaseLabelPosition = "top" | "bottom" | "left" | "right"