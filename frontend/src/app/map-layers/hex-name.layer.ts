import * as Leaflet from "leaflet"
import { regions } from "../config/regions"





export default function addHexNameLayer(map: Leaflet.Map)
{
  const layerGroup = Leaflet.layerGroup(undefined, { pmIgnore: true })

  regions.forEach((region) =>
  {
    const icon = Leaflet.divIcon({
      html: region.name,
      className: "region-name",
    })

    Leaflet.marker(region.center!, { icon, zIndexOffset: 900, pmIgnore: true }).addTo(layerGroup)
  })

  layerGroup.addTo(map)
  return layerGroup
}