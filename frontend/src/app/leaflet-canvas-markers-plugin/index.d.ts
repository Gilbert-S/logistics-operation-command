import "leaflet"
import { Base } from "../services/base.service"

declare function layerFactory(L: Leaflet): void


declare module "leaflet"
{
  export class CanvasIconLayer extends Layer
  {
    addTo(map:Map | LayerGroup):this
    addMarker(marker:Marker):void
    addMarkers(markers:Marker[]):void
    getBounds():LatLngBounds
    redraw():void
    clear():void
    removeMarker(marker:Marker):void
    addClass(className: string):this
    addOnClickListener(listener: (
      event: Leaflet.LeafletMouseEvent,
      base: Base) => void):void
    addOnContextmenuListener(listener: (
      event: Leaflet.LeafletMouseEvent,
      base: Base) => void):void
  }
  export function canvasIconLayer(): CanvasIconLayer

  interface MarkerOptions { base?: Base, highlight?: boolean }
}

export default layerFactory