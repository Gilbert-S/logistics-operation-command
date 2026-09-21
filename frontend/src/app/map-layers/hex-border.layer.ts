import { HEX_SIZE, Region, regions } from "../config/regions"
import { default as L } from "leaflet"





const HEX_BORDER_STYLE: L.PolylineOptions = {
  color: "#333",
  weight: 2.5,
  fill: false,
  opacity: 0.33,
}





export default function addHexBorderLayer(map: L.Map)
{
  const group = L.layerGroup()

  regions.forEach((region) =>
  {
    try
    {
      const polygon = L.polygon(buildHexPolygon(region), {
        ...HEX_BORDER_STYLE,
        pmIgnore: true,
      })
      group.addLayer(polygon)

      // i am really not happy having the following here
      // but it IS the easiest way to calculate the relevant hex points using this polygon
      // i would much rather like to have this logic in regions.ts or the map service somehow ...
      region.northWest = polygon.getBounds().getNorthWest()

      region.width = map.distance(
        polygon.getBounds().getNorthWest(),
        polygon.getBounds().getNorthEast(),
      )
      region.height = map.distance(
        polygon.getBounds().getNorthWest(),
        polygon.getBounds().getSouthWest(),
      )
    }
    catch (error)
    {
      console.error("Error processing region:", region, error)
    }
  })

  try
  {
    group.addTo(map)
  }
  catch (error)
  {
    console.error("Error adding hex border layer to map:", error)
  }
  // group.addTo(map)

  return group
}





// build hex polygon around given axial hex
function buildHexPolygon (region: Region): L.LatLngExpression[]
{
  const points: L.LatLngExpression[] = []

  for (let i = 0; i < 6; i++)
  {
    const angle = (Math.PI / 180) * (60 * i)
    const vx = region.center!.lng + HEX_SIZE * Math.cos(angle)
    const vy = region.center!.lat + HEX_SIZE * Math.sin(angle)
    points.push([vy, vx])
  }

  return points
}