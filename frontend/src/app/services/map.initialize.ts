import { signal } from "@angular/core"
import addHexBorderLayer from "../map-layers/hex-border.layer"
import addHexNameLayer from "../map-layers/hex-name.layer"
import createRegionLabelsLayer from "../map-layers/region-label.layer"
import addTileLayer from "../map-layers/tile.layer"
import type { MapService } from "./map.service"
import { default as L } from "leaflet"
import "@geoman-io/leaflet-geoman-free"
import { ColorAndLineWidthControl }
  from "../leaflet-color-line-control/color-and-line-width-control"





export function initializeMap(this: MapService): void
{
  const map = this.map()
  if (!map) return

  // remove/reset all layers on (re)initialization
  this.layers.set([])


  // add zoom control at bottom right
  L.control.zoom({ position: "bottomright" }).addTo(map)


  // add context menu handler
  map.on("contextmenu", this.contextMenu.contextMenuEventHandler)


  // add tile layer
  this.tileLayer.set(addTileLayer(map, this.tileLayerUrlTemplate()))


  // add hex name layer and register layer toggles in sidebar
  this.addLayerToggleToSidebar(addHexNameLayer(map), {
    icon: "lucideType",
    name: "Hex Names",
    zoomMax: 99,
    zoomMin: 1,
  })


  // add hex border layer and register layer toggles in sidebar
  this.addLayerToggleToSidebar(addHexBorderLayer(map), {
    icon: "lucideHexagon",
    name: "Hex Borders",
    zoomMax: 99,
    zoomMin: 1,
  })


  this.opsLayer().addTo(map)


  this.infoLayer.addTo(map)
  map.pm.addControls({ position: "bottomright", drawMarker: false, cutPolygon: false })
  map.pm.setGlobalOptions({
    exitModeOnEscape: true,
    finishOnEnter: true,
    layerGroup: this.infoLayer,
  })

  new ColorAndLineWidthControl().addTo(map)
}





// Todo: optimize to only update layers that are actually changed on update
export function initializeDynamicMapLayers(this: MapService): void
{
  const map = this.map()
  const mapData = this.mapData()

  if (!map || !mapData)
    return


  const [regionLabelsLayerMajor, regionLabelsLayerMinor] = createRegionLabelsLayer(map, mapData)

  this.addLayerToggleToSidebar(regionLabelsLayerMajor, {
    icon: "lucideTag",
    name: "Region Labels (Major)",
    zoomMax: 99,
    zoomMin: 4,
  })

  this.addLayerToggleToSidebar(regionLabelsLayerMinor, {
    icon: "lucideTags",
    name: "Region Labels (Minor)",
    zoomMax: 99,
    zoomMin: 5,
  })



  const [mapIconsLayerMajor, mapIconsLayerMinor] =
    this.mapIconsLayer.createMapIconsLayer(map, mapData)

  this.addLayerToggleToSidebar(mapIconsLayerMajor, {
    icon: "lucideImage",
    name: "Map Icons (Major)",
    zoomMax: 99,
    zoomMin: 5,
  })

  this.addLayerToggleToSidebar(mapIconsLayerMinor, {
    enabled: signal(false),
    icon: "lucideImages",
    name: "Map Icons (Minor)",
    zoomMax: 99,
    zoomMin: 5,
  })
}