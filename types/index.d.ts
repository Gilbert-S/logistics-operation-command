import type { WritableSignal } from "@angular/core"
import type * as L from "leaflet"
import type { Delta } from "@loc/jdp"



/**
 * This file contains type definitions for shared types used in both frontend and backend.
 * It is imported using the "types" alias defined in tsconfig.json, allowing for cleaner imports.
 * This file can only contain type definitions since its package does only export those.
 * This helps to avoid circular dependencies and keeps the shared types organized in one place.
*/





export namespace WarAPI
{
  type MapList = string[]

  interface MapData
  {
    regionId: number
    scorchedVictoryTowns: number
    lastUpdated: number,
    version: number
  }

  interface MapDataStatic extends MapData
  { mapTextItems: TextItem[] }

  interface MapDataDynamic extends MapData
  { mapItems: MapItem[] }


  interface TextItem {
    text: string
    x: number
    y: number
    mapMarkerType: MapMarkerType
  }

  interface MapItem {
    teamId: TeamId,
    iconType: number,
    x: number,
    y: number,
    flags: number
  }

  enum MapMarkerType {
    Major = "Major",
    Minor = "Minor",
  }

  type TeamId = "NONE" | "COLONIALS" | "WARDENS"
}





export namespace Map
{
  export interface Layer {
    name: string
    icon?: string
    zoomMin: number
    zoomMax: number
    leafletLayer: L.Layer | L.LayerGroup | L.CanvasIconLayer
    enabled: WritableSignal<boolean>
  }
}





export interface RequestResponse<T> {
  iteration: number
  full?: T
  delta?: Delta[]
}

export type RequestResponseHandler<T> = (
  iteration: number, 
  callback: (response: RequestResponse<T>) => void
) => void




// todo: now my dumbass has a type called MapData in the warapi namespace and one  in global, ...
// i kinda hate that. maybe rename
export type MapData = Record<string, {
  regionId: number
  scorchedVictoryTowns: number
  static: WarAPI.TextItem[]
  dynamic: WarAPI.MapItem[]
}>




export interface OpsBase
{
  id: string
  lat: number
  lng: number
  name: string
  nPos: string
  oPos: string
  team: string
  type: string
}




export type OrderId = string | null

export interface Order
{
  completed: boolean
  deliveries: WritableSignal<Delivery[]>
  details?: string
  id: OrderId
  items: WritableSignal<OrderItem[]>
  markerId: string
  name?: string
  stats: OrderStats
  syncId?: string
  timeEnd: number | null
  timeStart: number
  unsaved?: boolean
}

interface SyncOrder extends Omit<Order, "items" | "deliveries">
{ items: OrderItem[], deliveries: Delivery[] }


export interface OrderItem
{
  delivered: number
  id: string
  inDelivery: number
  priority: "low" | "medium" | "high"
  quantity: number
  sortOrder: number
}





interface OrderStats
{
  ordered: {
    total: number
    high: number
    medium: number
    low: number
  }

  delivered: {
    total: number
    high: number
    medium: number
    low: number
  }

  inDelivery: {
    total: number
    high: number
    medium: number
    low: number
  }

  leftToDeliver: {
    total: number
    high: number
    medium: number
    low: number
  }
}





interface Delivery
{
  id: string
  user: User
  items: DeliveryItem[]
  quantity: number
  timeStart: number
  timeEnd: number | null
  status: "pickup" | "delivery" | "completed"
  priority: "low" | "medium" | "high"
}

export interface DeliveryItem
{
  itemId: string
  quantity: number
  priority: "low" | "medium" | "high"
}


declare module "socket.io"
{
  interface Socket { 
    session: {
      session: {
          id: string
          createdAt: Date
          updatedAt: Date
          userId: string
          expiresAt: Date
          token: string
          ipAddress?: string | null | undefined
          userAgent?: string | null | undefined
          online: boolean
          last_seen?: Date | null | undefined
          impersonatedBy?: string | null | undefined
      }
      user: {
          id: string
          createdAt: Date
          updatedAt: Date
          email: string
          emailVerified: boolean
          name: string
          image?: string | null | undefined
          roles: string[]
          banned: boolean | null | undefined
          role?: string | null | undefined
          banReason?: string | null | undefined
          banExpires?: Date | null | undefined
      }
    }
  }
}



export interface Template
{
  id: string
  name: string
  items: OrderItem[]
}


export interface User
{
  id: string
  name: string
  image: string | null
}


export interface Presence extends User
{
  sessions: [{
    online: boolean
    last_seen: Date | null
  }]
}



export type DeliveryItemsVariant = "icon" | "list"


export interface  BackendSettings
{
  "auth.permitted-roles": string[]
  "auth.admin-roles": string[]
  "presence.cutoff-hours": number
}

export interface FrontendSettings
{
  "orders.display-completed-for": number
  "deliveries.display-completed-for": number
}

export interface Settings
{
  backend: BackendSettings
  frontend: FrontendSettings
}