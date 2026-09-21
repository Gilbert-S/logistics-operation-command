import * as Leaflet from "leaflet"
import { regions } from "../config/regions"
import { MapData, WarAPI } from "@loc/types"
import { canvasMarkerLayer } from "../leaflet-text-marker-canvas-plugin"
import { REGION_BASES } from "../config/mapicons"





export default function createRegionLabelsLayer(map: Leaflet.Map, mapData: MapData):
[ Leaflet.CanvasMarkerLayer, Leaflet.CanvasMarkerLayer]
{
  if (!map || !mapData)
    throw new Error("Map and MapData are required to add region labels layer.")

  const majorLayer = canvasMarkerLayer().addTo(map).addClass("region-labels-layer-major")
  const minorLayer = canvasMarkerLayer().addTo(map).addClass("region-labels-layer-minor")

  const major: Leaflet.Marker[] = []
  const minor: Leaflet.Marker[] = []

  regions.forEach((region) =>
  {
    const regionLabels = mapData[region.id]?.static
    if (!regionLabels) return

    regionLabels.forEach((label) =>
    {
      const M = label.mapMarkerType == "Major" as WarAPI.MapMarkerType

      let closest
      if (M)
        closest = findClosest(mapData, label, region.id)

      const iconPosition = region.mapIconPosition!(closest?.x || label.x, closest?.y || label.y)
      const icon = Leaflet.divIcon({
        text: label.text,
        style: label.mapMarkerType,
        iconAnchor: [0, 26],
      })

      const marker = new Leaflet.Marker(iconPosition, { icon, zIndexOffset: M ? 800 : 700 })
      if (M)
        major.push(marker)
      else
        minor.push(marker)
    })


  })

  majorLayer.addLayers(major)
  minorLayer.addLayers(minor)
  majorLayer.removeFrom(map)
  minorLayer.removeFrom(map)

  return [majorLayer, minorLayer]
}





function findClosest(mapData: MapData, label: WarAPI.TextItem, regionId: string)
{

  const closestNames: { item: WarAPI.MapItem, distance: number }[] = []

  const mapItems = mapData[regionId]?.dynamic
    .filter((mapItem) => REGION_BASES.includes(mapItem.iconType))


  mapItems.map((mapItem) =>
  {
    const xdif = Math.abs(label.x - mapItem.x)
    const ydif = Math.abs(label.y - mapItem.y)
    const distance = Math.sqrt(Math.pow(xdif, 2) + Math.pow(ydif, 2))
    closestNames.push({ item: mapItem, distance: distance })
  })

  closestNames.sort(compare)
  return closestNames[0].item
}

function compare(a:{ distance: number }, b:{ distance: number })
{
  if (a.distance < b.distance)
    return -1

  if (a.distance > b.distance)
    return 1

  return 0
}