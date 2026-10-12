import { inject, Injectable } from "@angular/core"
import * as Leaflet from "leaflet"
import { regions } from "../config/regions"
import { MapData, WarAPI } from "@loc/types"
import {
  MAJOR_LOGISTICS_ICONS,
  MINOR_LOGISTICS_ICONS,
} from "../config/mapicons"

import CanvasMarkersFactory from "../leaflet-canvas-markers-plugin"
import { ContextMenu } from "../services/context-menu"
import { Base, BaseService } from "../services/base.service"





@Injectable({ providedIn: "root" })
export class MapIconsLayer
{

  contextMenu = inject(ContextMenu)
  baseService = inject(BaseService)

  contextMenuHandler = this.contextMenu.contextMenuEventHandler
  clickHandler = this.baseService.clickHandlerBaseSelect

  private layers: [Leaflet.CanvasIconLayer, Leaflet.CanvasIconLayer] | undefined
  private layersMap: Leaflet.Map | undefined
  /** all map icon bases currently managed by this layer, by id */
  private known = new Map<string, { base: Base, regionId: string }>()


  /** creates the icon layers once per map and (re)synchronizes them with the given map data */
  createMapIconsLayer(map: Leaflet.Map, mapData: MapData)
  {

    if (!map || !mapData)
      throw new Error("Map and MapData are required to add map icons layer.")

    if (!this.layers || this.layersMap !== map)
      this.createLayers(map)

    const layers = this.layers!

    // the canvas layers need to be attached to the map while markers get added
    const detached = layers.filter((layer) => !map.hasLayer(layer))
    detached.forEach((layer) => layer.addTo(map))

    try
    {
      this.updateMapIcons(mapData, layers)
    }
    catch (error)
    {
      // self healing: drop everything and rebuild from the current data
      console.error("MapIconsLayer: update failed, rebuilding map icons", error)
      try
      {
        this.clearAll(layers)
        this.updateMapIcons(mapData, layers)
      }
      catch (retryError)
      {
        console.error("MapIconsLayer: rebuild failed", retryError)
      }
    }
    finally
    {
      detached.forEach((layer) => layer.removeFrom(map))
    }

    return layers
  }


  private createLayers(map: Leaflet.Map)
  {
    // bases of a previous map instance belong to layers that no longer exist
    if (this.layers)
      this.clearAll(this.layers)

    CanvasMarkersFactory(Leaflet)

    const mapIconsLayerMajor = Leaflet.canvasIconLayer().addTo(map)
    const mapIconsLayerMinor = Leaflet.canvasIconLayer().addTo(map)

    mapIconsLayerMajor.addClass("map-icons-layer-major")
    mapIconsLayerMinor.addClass("map-icons-layer-minor")

    mapIconsLayerMajor.addOnContextmenuListener(this.contextMenuHandler)
    mapIconsLayerMajor.addOnClickListener(this.clickHandler)

    // the canvas layers only need the map reference while markers get added,
    // visibility on the map is handled by the MapService
    mapIconsLayerMajor.removeFrom(map)
    mapIconsLayerMinor.removeFrom(map)

    this.layers = [mapIconsLayerMajor, mapIconsLayerMinor]
    this.layersMap = map
  }


  private clearAll(layers: [Leaflet.CanvasIconLayer, Leaflet.CanvasIconLayer])
  {
    this.baseService.removeMapIconBases([...this.known.values()].map((entry) => entry.base))
    this.known.clear()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    layers.forEach((layer) => void layer.clearLayers())
  }


  /** adds new icons, updates the team of existing ones and removes vanished ones.
   * a hex that fails or delivers no data keeps its current icons. */
  private updateMapIcons(
    mapData: MapData,
    [layerMajor, layerMinor]: [Leaflet.CanvasIconLayer, Leaflet.CanvasIconLayer],
  )
  {
    const seen = new Set<string>()
    const processedRegions = new Set<string>()
    const newMajor: Leaflet.Marker[] = []
    const newMinor: Leaflet.Marker[] = []
    let redrawNeeded = false

    regions.forEach((region) =>
    {
      const mapItems = mapData[region.id]?.dynamic
      if (!Array.isArray(mapItems) || !region.mapIconPosition)
        return

      const regionSeen: string[] = []
      const regionNew: [Leaflet.Marker[], Leaflet.Marker, Base][] = []

      try
      {
        mapItems.forEach((item) =>
        {
          const isMajor = MAJOR_LOGISTICS_ICONS.includes(item.iconType)
          const isMinor = MINOR_LOGISTICS_ICONS.includes(item.iconType)

          if (!isMajor && !isMinor)
            return

          const id = this.generateMapIconId(region.id, item)
          regionSeen.push(id)

          const existing = this.known.get(id)
          if (existing)
          {
            if (existing.base.team() !== item.teamId)
              existing.base.team.set(item.teamId)
            return
          }

          const iconPosition = region.mapIconPosition!(item.x, item.y)
          const icon = Leaflet.icon({
            iconUrl: "",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })

          const marker = Leaflet.marker(iconPosition, { icon, zIndexOffset: 200 })
          const layer = isMajor ? layerMajor : layerMinor

          // each logistics map marker is treated as a 'base' (a valid target for delivery orders)
          // and therefore needs to be registered in the BaseService
          const base = this.baseService.newBase({
            baseClass: "MapIcon",
            icon: icon,
            iconType: item.iconType,
            id,
            layer,
            marker: marker,
            name: isMajor ? this.findClosest(mapData, item, region.id) : "",
            team: item.teamId,
          })

          marker.options.base = base
          regionNew.push([isMajor ? newMajor : newMinor, marker, base])
          this.known.set(id, { base, regionId: region.id })
        })
      }
      catch (error)
      {
        console.error(`MapIconsLayer: error processing icons of region ${region.id}`, error)
      }

      // icons are registered even if the loop aborted, so they are not added twice later
      regionNew.forEach(([target, marker]) => target.push(marker))
      regionSeen.forEach((id) => seen.add(id))
      processedRegions.add(region.id)
    })

    if (newMajor.length) layerMajor.addMarkers(newMajor)
    if (newMinor.length) layerMinor.addMarkers(newMinor)
    redrawNeeded ||= newMajor.length > 0 || newMinor.length > 0

    // remove icons that are no longer delivered (only for regions that were processed completely)
    const vanished: Base[] = []
    this.known.forEach(({ base, regionId }, id) =>
    {
      if (seen.has(id) || !processedRegions.has(regionId))
        return

      try
      {
        const layer = base.layer()
        if ("removeMarker" in layer) layer.removeMarker(base.marker())
      }
      catch (error) { console.error("MapIconsLayer: error removing marker", error) }

      vanished.push(base)
      this.known.delete(id)
      redrawNeeded = true
    })

    this.baseService.removeMapIconBases(vanished)

    if (redrawNeeded)
    {
      layerMajor.redraw()
      layerMinor.redraw()
    }
  }


  findClosest(mapData: MapData, mapItem: WarAPI.MapItem, regionId: string)
  {

    const closestNames: { text: string, distance: number }[] = []

    const majorStaticTextItems = (mapData[regionId]?.static ?? [])
      .filter((textItem) => textItem.mapMarkerType === "Major" as WarAPI.MapMarkerType)


    majorStaticTextItems.map((mapTextItem) =>
    {
      const xdif = Math.abs(mapItem.x - mapTextItem.x)
      const ydif = Math.abs(mapItem.y - mapTextItem.y)
      const distance = Math.sqrt(Math.pow(xdif, 2) + Math.pow(ydif, 2))
      closestNames.push({ text: mapTextItem.text, distance: distance })
    })

    closestNames.sort(this.compare)
    return closestNames[0]?.text ?? ""
  }

  private compare(this: void, a:{ distance: number }, b:{ distance: number })
  {
    if (a.distance < b.distance)
      return -1

    if (a.distance > b.distance)
      return 1

    return 0
  }

  generateMapIconId(regionId: string, mapItem: WarAPI.MapItem)
  {
    const x = parseInt(mapItem.x.toString().replace(".", ""))
    const y = parseInt(mapItem.y.toString().replace(".", ""))
    return `${regionId}.${x}.${y}.${mapItem.iconType}`
  }

}