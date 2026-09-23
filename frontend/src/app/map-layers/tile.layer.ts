import { default as L } from "leaflet"





export default function addTileLayer(
  map: L.Map,
  tileLayerUrlTemplate: string = tileLayerDefaultUrlTemplate,
  tileLayerOptions: L.TileLayerOptions = tileLayerDefaultOptions,
): L.TileLayer
{
  if (tileLayerUrlTemplate.includes("/default/"))
    tileLayerOptions.maxNativeZoom = 5
  else
    tileLayerOptions.maxNativeZoom = 6

  const tileLayer = L.tileLayer(tileLayerUrlTemplate, tileLayerOptions)
  map.addLayer(tileLayer)
  return tileLayer
}





const tileLayerDefaultUrlTemplate = `/assets/map-tiles/default/{z}/{x}/{y}.webp`

const tileLayerDefaultOptions: L.TileLayerOptions = {
  bounds: new L.LatLngBounds([0, 256], [-256, 0]),
  edgeBufferTiles: 2,
  maxNativeZoom: 6,
  noWrap: true,
  opacity: 1,
  tileSize: 256,
}
