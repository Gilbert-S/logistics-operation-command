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
import { BaseService } from "../services/base.service"





@Injectable({ providedIn: "root" })
export class MapIconsLayer
{

  contextMenu = inject(ContextMenu)
  baseService = inject(BaseService)

  contextMenuHandler = this.contextMenu.contextMenuEventHandler
  clickHandler = this.baseService.clickHandlerBaseSelect

  createMapIconsLayer(map: Leaflet.Map, mapData: MapData)
  {

    if (!map || !mapData)
      throw new Error("Map and MapData are required to add map icons layer.")

    CanvasMarkersFactory(Leaflet)

    const mapIconsLayerMajor = Leaflet.canvasIconLayer().addTo(map)
    const mapIconsLayerMinor = Leaflet.canvasIconLayer().addTo(map)

    mapIconsLayerMajor.addClass("map-icons-layer-major")
    mapIconsLayerMinor.addClass("map-icons-layer-minor")

    mapIconsLayerMajor.addOnContextmenuListener(this.contextMenuHandler)
    mapIconsLayerMajor.addOnClickListener(this.clickHandler)

    regions.forEach((region) =>
    {
      const mapItems = mapData[region.id]?.dynamic
      if (!mapItems) return

      mapItems.forEach((item) =>
      {
        const isMajor = MAJOR_LOGISTICS_ICONS.includes(item.iconType)
        const isMinor = MINOR_LOGISTICS_ICONS.includes(item.iconType)

        if (!isMajor && !isMinor)
          return



        const iconPosition = region.mapIconPosition!(item.x, item.y)
        const icon = Leaflet.icon({
          iconUrl: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = Leaflet.marker(iconPosition, { icon, zIndexOffset: 200 })


        if (isMinor)
          mapIconsLayerMinor.addMarker(marker)
        else
          mapIconsLayerMajor.addMarker(marker)


        const id = this.generateMapIconId(region.id, item)
        const existingBase = this.baseService.getBase(id)

        if (existingBase)
        {
          existingBase.marker.set(marker)
          existingBase.icon.set(icon)
          existingBase.layer.set(isMajor ? mapIconsLayerMajor : mapIconsLayerMinor)

          marker.options.base = existingBase
        }
        else
        {
        // each logistics map marker is treated as a 'base' (a valid target for delivery orders)
        // and therefore needs to be registered in the BaseService
          const base = this.baseService.newBase({
            baseClass: "MapIcon",
            icon: icon,
            iconType: item.iconType,
            id: this.generateMapIconId(region.id, item),
            layer: isMajor ? mapIconsLayerMajor : mapIconsLayerMinor,
            marker: marker,
            name: isMajor ? this.findClosest(mapData, item, region.id) : "",
            team: item.teamId,
          })

          marker.options.base = base
        }


      })
    })

    mapIconsLayerMajor.removeFrom(map)
    mapIconsLayerMinor.removeFrom(map)

    return [mapIconsLayerMajor, mapIconsLayerMinor]
  }


  findClosest(mapData: MapData, mapItem: WarAPI.MapItem, regionId: string)
  {

    const closestNames: { text: string, distance: number }[] = []

    const majorStaticTextItems = mapData[regionId]?.static
      .filter((textItem) => textItem.mapMarkerType === "Major" as WarAPI.MapMarkerType)


    majorStaticTextItems.map((mapTextItem) =>
    {
      const xdif = Math.abs(mapItem.x - mapTextItem.x)
      const ydif = Math.abs(mapItem.y - mapTextItem.y)
      const distance = Math.sqrt(Math.pow(xdif, 2) + Math.pow(ydif, 2))
      closestNames.push({ text: mapTextItem.text, distance: distance })
    })

    closestNames.sort(this.compare)
    return closestNames[0].text
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