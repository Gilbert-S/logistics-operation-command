import { effect, inject, Injectable, signal, untracked } from "@angular/core"
import { default as L } from "leaflet"
import { SocketService } from "./socket.service"
import Events from "@loc/common"
import { RequestResponse } from "@loc/types"
import { toast } from "@spartan-ng/brain/sonner"
import jsondiffpatch, { jdp, type Delta } from "@loc/jdp"




interface Shapes {
  shape: "Marker" | "CircleMarker" | "Circle" | "Line" |
  "Rectangle" | "Polygon" | "Text"
}

interface Shape extends Shapes {
  id: string
  syncId: string
  layer: L.Layer
}

type SyncShape = {
  id: string
  syncId: string
} & (Line | Circle | CircleMarker | Rectangle | Polygon | Text | Marker)

interface Line extends Shapes {
  shape: "Line"
  options: L.PolylineOptions
  latLng: L.LatLngExpression[] | L.LatLngExpression[][]
}

interface Polygon extends Shapes {
  shape: "Polygon"
  options: L.PolylineOptions
  latLng: L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][]
}

interface Circle extends Shapes {
  shape: "Circle"
  options: L.CircleMarkerOptions
  latLng: L.LatLngExpression
}

type CircleMarker = Omit<Circle, "shape"> & { shape: "CircleMarker" }

interface Rectangle extends Shapes {
  shape: "Rectangle"
  options: L.PolylineOptions
  latLng: L.LatLngBoundsExpression
}

interface Text extends Shapes {
  shape: "Text"
  options: L.MarkerOptions
  latLng: L.LatLngExpression
}

interface Marker extends Shapes {
  shape: "Marker"
  options: L.MarkerOptions
  latLng: L.LatLngExpression
}


type ShapeStore = Record<string, Shape>
type SyncList = Record<string, SyncShape>





@Injectable({ providedIn: "root" })
export class InfoLayerService
{
  private shapeStore: ShapeStore = {}
  private syncList: SyncList = {}
  public readonly shapeCount = signal(0)

  layerGroup: L.LayerGroup | undefined

  private readonly socket = inject(SocketService).socket.asReadonly()
  private readonly syncIteration = signal(-1)


  map: L.Map | undefined


  public initialize = (map: L.Map, infoLayer: L.LayerGroup) =>
  {
    if (!map || !infoLayer)
      return console.error("cannot initialize info-layer, missing map/info-layer group")

    this.layerGroup = infoLayer
    this.map = map
    this.addMapEventHandlers(map)
    setTimeout(() => this.requestUpdate())
  }



  addMapEventHandlers(map: L.Map)
  {
    map.on("pm:create", (event) =>
    {
      this.storeNewLocalShape(event.shape as Shape["shape"], event.layer)
      this.addShapeEventHandlers(event.layer)
    })
  }


  addShapeEventHandlers(layer: L.Layer)
  {
    layer.on("pm:update", (e) => this.updateShape(e))
    layer.on("pm:remove", (e) => this.removeShape(e))
  }





  layerToShape(layer: L.Layer): Shape | undefined
  {
    return Object.values(this.shapeStore).find((shape) => shape.layer === layer)
  }


  getLatLng(layer: L.Layer)
  {
    let latLng
    if (layer instanceof L.Polyline)
      latLng = layer.getLatLngs()
    else if (layer instanceof L.Marker)
      latLng = layer.getLatLng()
    else if (layer instanceof L.CircleMarker)
      latLng = layer.getLatLng()
    else if (layer instanceof L.Circle)
      latLng = layer.getLatLng()
    else if (layer instanceof L.Rectangle)
      latLng = layer.getBounds()

    return latLng
  }





  // #region Socket Handlers
  private readonly socketEffect = effect(() =>
  {
    const socket = this.socket()
    untracked(() =>
    {
      if (!socket)
        return

      if (!socket.connected)
        socket.once("connect", () => this.setupSocketHandlers())

      else
        this.setupSocketHandlers()
    })
  })

  private setupSocketHandlers = () =>
  {
    this.socket().on(Events.SYNC_INFO_LAYER, this.syncHandler)
    this.requestUpdate()
  }

  private requestUpdate()
  {
    const socket = this.socket()
    if (!socket || !socket.connected) return

    socket.emit(
      Events.REQUEST_INFO_LAYER,
      this.syncIteration(),
      this.requestResponseHandler,
    )
  }

  private requestResponseHandler = (error: Error, response: RequestResponse<SyncList>) =>
  {

    if (error || !response)
      return toast.error(`Error requesting info map layer: ${ error.message}`, { duration: 10000 })

    this.syncIteration.set(response.iteration)

    if (response.full)
      this.syncList = response.full
    else if (response.delta)
      response.delta.forEach((delta) => jsondiffpatch.patch(this.syncList, delta))

    this.processSyncList()
    return
  }

  private syncHandler = (data: { iterationNumber: number, diff: Delta }) =>
  {
    const { iterationNumber, diff } = data

    if (!iterationNumber || !diff)
      return

    if (iterationNumber < this.syncIteration())
    {
      this.syncIteration.set(-1)
      return this.requestUpdate()
    }

    if (iterationNumber - this.syncIteration() !== 1)
      return this.requestUpdate()


    jsondiffpatch.patch(this.syncList, diff)
    this.syncIteration.set(iterationNumber)
    this.processSyncList()
    return
  }
  // #endregion





  // store a new usermade shape
  storeNewLocalShape(shape: Shapes["shape"], layer: L.Layer): void
  {
    const id = crypto.randomUUID()
    const syncId = crypto.randomUUID()
    const latLng = this.getLatLng(layer)
    const options = this.deepCopy(layer.options)

    if ("icon" in options)
      delete options.icon

    if (latLng)
    {
      const old = JSON.stringify(this.syncList)
      this.shapeStore[id] = { id, layer, shape, syncId }
      this.syncList[id] = { id, latLng, options, shape, syncId } as SyncShape
      this.syncDiff(old)
    }
  }



  updateShape(event: L.PM.BaseEventPayload & { shape: L.PM.SUPPORTED_SHAPES; layer: L.Layer })
  {
    console.debug("updateShape", event)
    const shape = this.layerToShape(event.layer)
    const options = this.deepCopy(event.layer.options)
    const latLng = this.getLatLng(event.layer)
    const syncId = crypto.randomUUID()

    if ("icon" in options)
      delete options.icon

    if (shape && options && latLng)
    {
      const old = JSON.stringify(this.syncList)
      shape.syncId = syncId
      this.syncList[shape.id].options = options
      this.syncList[shape.id].latLng = latLng
      this.syncList[shape.id].syncId = syncId

      const synListShape = this.syncList[shape.id]
      if (synListShape.shape === "Circle")
      {
        const circle = event.layer as L.Circle
        synListShape.options.radius = circle.getRadius()
      }

      if (synListShape.shape === "Text" && "text" in event.layer.options)
      {
        const maxLength = 1000
        const pm = "pm" in event.layer ? event.layer.pm as L.PM.PMLayer : undefined
        if (pm)
        {
          const trimmedText = pm.getText().slice(0, maxLength)
          synListShape.options.text = trimmedText
          pm.setText(trimmedText)
        }
      }


      this.syncDiff(old)
    }
  }


  removeShape(event: L.PM.BaseEventPayload & { shape: L.PM.SUPPORTED_SHAPES; layer: L.Layer })
  {
    const shape = this.layerToShape(event.layer)

    if (shape && this.syncList[shape.id])
    {
      const old = JSON.stringify(this.syncList)
      delete this.shapeStore[shape.id]
      delete this.syncList[shape.id]
      this.syncDiff(old)
    }
  }





  // add a synched shape to map and to local shape store
  addSyncedShape(shape: SyncShape)
  {
    if (!this.layerGroup)
      return

    let layer: L.Layer | undefined

    switch (shape.shape)
    {
      case "Text":
        layer = L.marker(shape.latLng, shape.options)
          .addTo(this.layerGroup)
        break

      case "Line":
        layer = L.polyline(shape.latLng, shape.options)
          .addTo(this.layerGroup)
        break

      case "Polygon":
        layer = L.polygon(shape.latLng, shape.options)
          .addTo(this.layerGroup)
        break

      case "Rectangle":
        layer = L.rectangle(shape.latLng, shape.options)
          .addTo(this.layerGroup)
        break
      case "Circle":
        layer = L.circle(shape.latLng, shape.options)
          .addTo(this.layerGroup)
        break

      case "CircleMarker":
        layer = L.circleMarker(shape.latLng, shape.options)
          .addTo(this.layerGroup)
        break
      case "Marker":
      {
        const o = {
          ...shape.options,
          icon: this.createIcon(shape.options.alt as keyof typeof this.markers),
        }
        layer = L.marker(shape.latLng, o)
          .addTo(this.layerGroup)
        break
      }
    }


    this.shapeStore[shape.id] = { id: shape.id, layer, shape: shape.shape, syncId: shape.syncId }
    this.addShapeEventHandlers(layer)
  }



  updateSyncedShape(syncShape: SyncShape)
  {
    const shape = this.shapeStore[syncShape.id]

    shape.syncId = syncShape.syncId

    if (shape.layer instanceof L.Polyline)
      shape.layer.setLatLngs(syncShape.latLng as L.LatLngExpression[])
    else if (shape.layer instanceof L.Marker)
    {
      shape.layer.setLatLng(syncShape.latLng as L.LatLngExpression)

      if (shape.shape === "Text" && syncShape.shape === "Text")
        shape.layer.pm.setText(syncShape.options.text || "")
    }
    else if (shape.layer instanceof L.Circle && syncShape.shape === "Circle")
    {
      shape.layer.setLatLng(syncShape.latLng)
      shape.layer.setRadius(syncShape.options.radius || shape.layer.getRadius())
    }
    else if (shape.layer instanceof L.CircleMarker)
      shape.layer.setLatLng(syncShape.latLng as L.LatLngExpression)
    else if (shape.layer instanceof L.Rectangle)
      shape.layer.setBounds(syncShape.latLng as L.LatLngBoundsExpression)

  }


  processSyncList()
  {
    for (const id in this.syncList)
      if (!this.shapeStore[id])
        this.addSyncedShape(this.syncList[id])
      else if (this.syncList[id].syncId !== this.shapeStore[id].syncId)
        this.updateSyncedShape(this.syncList[id])


    for (const id in this.shapeStore)
      if (!this.syncList[id])
      {
        (this.shapeStore[id].layer as L.Path).pm.remove()
        delete this.shapeStore[id]
      }

    this.shapeCount.set(Object.keys(this.shapeStore).length)
  }





  syncDiff(before: string)
  {
    const old = JSON.parse(before) as unknown
    const diff = jdp.diff(old, this.syncList)

    if (!diff) return

    this.syncIteration.update((iteration) => iteration + 1)
    this.socket().emit(Events.SYNC_INFO_LAYER, this.syncIteration(), diff)
  }



  deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj)) as T



  private readonly coloredMarkers = {
    blue: this.createSvgMarker("#2196f3"),
    green: this.createSvgMarker("#4caf50"),
    orange: this.createSvgMarker("#ff9800"),
    pink: this.createSvgMarker("#ff69b4"),
    red: this.createSvgMarker("#f44336"),
  }

  private createSvgMarker(color: string): string
  {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="84 74 198 299" role="img" aria-labelledby="title">
      <title id="title">Map marker</title>
      <path fill="${color}" fill-rule="evenodd" d="M183 76c-53.6 0-97 43.4-97 97 0 16.8 4.3 32.6 11.9 46.4l78.9 147.3c2.7 4.9 9.7 4.9 12.4 0l78.9-147.3c7.6-13.8 11.9-29.6 11.9-46.4 0-53.6-43.4-97-97-97Zm0 53.3c23.5 0 42.5 19 42.5 42.5s-19 42.5-42.5 42.5-42.5-19-42.5-42.5 19-42.5 42.5-42.5Z"/>
    </svg>`
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  public readonly markers = {
    /* eslint-disable sort-keys */
    shirt_truck: {
      title: "Shirt Truck",
      alt: "shirt_truck",
      iconUrl: "/images/ShirtTruck.png",
      class: "drop-shadow-[0_0_2px_var(--background),0_0_2px__var(--background)]",
    },
    marker_blue: {
      title: "Marker",
      alt: "marker_blue",
      iconUrl: this.coloredMarkers.blue,
      class: "drop-shadow-[1px_1px_2px_var(--background)]",
    },
    marker_red: {
      title: "Marker",
      alt: "marker_red",
      iconUrl: this.coloredMarkers.red,
      class: "drop-shadow-[1px_1px_2px_var(--background)]",
    },
    marker_green: {
      title: "Marker",
      alt: "marker_green",
      iconUrl: this.coloredMarkers.green,
      class: "drop-shadow-[1px_1px_2px_var(--background)]",
    },
    marker_orange: {
      title: "Marker",
      alt: "marker_orange",
      iconUrl: this.coloredMarkers.orange,
      class: "drop-shadow-[1px_1px_2px_var(--background)]",
    },
    marker_pink: {
      title: "Marker",
      alt: "marker_pink",
      iconUrl: this.coloredMarkers.pink,
      class: "drop-shadow-[1px_1px_2px_var(--background)]",
    },
    petrol_can: {
      title: "Petrol Can",
      alt: "petrol_can",
      iconUrl: "/images/PetrolCan.png",
      class: "drop-shadow-[0_0_2px_var(--background),0_0_2px__var(--background)]",
    },
    diesel_can: {
      title: "Diesel Can",
      alt: "diesel_can",
      iconUrl: "/images/DieselCan.png",
      class: "drop-shadow-[0_0_2px_var(--background),0_0_2px__var(--background)]",
    },
    /* eslint-enable sort-keys */
  } as const




  createIcon(key: keyof typeof this.markers)
  {
    return new L.Icon({
      iconUrl: this.markers[key]?.iconUrl || this.markers.marker_blue.iconUrl,
      className: this.markers[key]?.class || this.markers.marker_blue.class,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })
  }
}
