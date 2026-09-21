import * as Leaflet from "leaflet"

declare module "leaflet"
{
  interface CanvasMarkerLayerOptions extends LayerOptions
  {
    zIndex?: number | null
    collisionFlg?: boolean
    moveReset?: boolean
    opacity?: number
  }

  interface CanvasMarkerTreeEntry
  {
    minX: number
    minY: number
    maxX: number
    maxY: number
    data: Marker
    lat?: number
    lng?: number
    pointPos?: Point
  }

  type CanvasMarkerLayerEventListener = (
    event: LeafletMouseEvent,
    hits: CanvasMarkerTreeEntry[],
  ) => void

  class CanvasMarkerLayer extends Layer
  {
    constructor(options?: CanvasMarkerLayerOptions)

    options: CanvasMarkerLayerOptions

    addTo(map: Map | LayerGroup): this

    addLayer(marker: Marker, redraw?: boolean): this
    addLayers(markers: Marker[], redraw?: boolean): this
    removeLayer(marker: Marker, redraw?: boolean): this
    clearLayers(): this

    redraw(force?: boolean): this
    setOptions(options: CanvasMarkerLayerOptions): this
    setOpacity(opacity: number): this

    getBounds(): Bounds
    getAllLayers(): CanvasMarkerTreeEntry[]

    addOnClickListener(listener: CanvasMarkerLayerEventListener): void
    addOnHoverListener(listener: CanvasMarkerLayerEventListener): void
    addOnMouseDownListener(listener: CanvasMarkerLayerEventListener): void
    addOnMouseUpListener(listener: CanvasMarkerLayerEventListener): void

    addClass(className: string): this
  }

  function canvasMarkerLayer(
    options?: CanvasMarkerLayerOptions,
  ): CanvasMarkerLayer

  interface DivIconOptions {
    text?: string,
    style?: "Major" | "Minor"
  }
}

export type CanvasMarkerLayerOptions =
  Leaflet.CanvasMarkerLayerOptions
export type CanvasMarkerTreeEntry = Leaflet.CanvasMarkerTreeEntry
export type CanvasMarkerLayerEventListener =
  Leaflet.CanvasMarkerLayerEventListener

export const CanvasMarkerLayer: {
  new (options?: CanvasMarkerLayerOptions): Leaflet.CanvasMarkerLayer
  prototype: Leaflet.CanvasMarkerLayer
}

export function canvasMarkerLayer(
  options?: CanvasMarkerLayerOptions,
): Leaflet.CanvasMarkerLayer

declare module "*leaflet-text-marker-canvas-plugin/text-marker-canvas.js"
{
  export { CanvasMarkerLayer, canvasMarkerLayer }
  export type {
    CanvasMarkerLayerOptions,
    CanvasMarkerTreeEntry,
    CanvasMarkerLayerEventListener,
  }
}
