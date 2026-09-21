import { effect, inject, Injectable, linkedSignal, signal, untracked, WritableSignal }
  from "@angular/core"
import { SocketService } from "./socket.service"
import { checkOrderCompletion, Events, updateOrderStats } from "@loc/common"
import { Delta } from "jsondiffpatch"
import { OrderId, Order, SyncOrder, OrderItem, RequestResponse, User, Delivery } from "@loc/types"
import { AudioService } from "./audio.service"
import { jdp } from "@loc/jdp"





@Injectable({ providedIn: "root" })
export class OrderService
{
  private socket = inject(SocketService).socket
  private audio = inject(AudioService)


  readonly editOrder = signal<OrderId>(null)
  readonly orderList: WritableSignal<WritableSignal<Order>[]> = signal([])

  readonly unsavedOrder = signal<Order | null >(null)

  readonly currentOrder = linkedSignal(() =>
  {
    const orderId = this.editOrder()
    const order = untracked(() => this.getOrderById(orderId))
    return order ? order() : null
  })




  // list of orders used for syncing with server and other clients
  private orderSyncList: SyncOrder[] = []
  private readonly orderIteration = signal(-1)
  private orderUpdateInterval: number | undefined
  private lastSyncedOrderIteration = "[]"





  public newOrder = (markerId: string | null | undefined): Order | void =>
  {
    if (!markerId) return

    if (this.unsavedOrder())
    {
      this.unsavedOrder.update((order) =>
      {
        if (!order) return null
        return { ...order, markerId }
      })

      this.editOrder.set(this.unsavedOrder()!.id)
      return this.unsavedOrder()!
    }

    const order: Order = {
      completed: false,
      deliveries: signal([]),
      id: crypto.randomUUID(),
      items: signal([]),
      markerId: markerId,
      timeEnd: null,
      timeStart: Date.now(),
      unsaved: true,

      stats: {
        ordered: { total: 0, high: 0, medium: 0, low: 0 },
        delivered: { total: 0, high: 0, medium: 0, low: 0 },
        inDelivery: { total: 0, high: 0, medium: 0, low: 0 },
        leftToDeliver: { total: 0, high: 0, medium: 0, low: 0 },
      },
    }

    this.unsavedOrder.set(order)
    this.editOrder.set(order.id)

    return order
  }





  public saveOrder = (syncedOrder?: SyncOrder): void =>
  {
    if (!this.socket()?.connected)
      return

    if (syncedOrder)
    {
      const order = signal<Order>({
        ...syncedOrder,
        items: signal(syncedOrder.items),
        deliveries: signal(syncedOrder.deliveries),
      })
      this.orderList.update((orders) => [...orders, order])
    }
    else
    {
      const order = this.unsavedOrder()
      if (!order) return

      updateOrderStats(order)
      checkOrderCompletion(order)

      order.unsaved = false
      this.orderList.update((orders) => [...orders, signal(order)])
      this.orderSyncList.push({ ...order, items: order.items(), deliveries: order.deliveries() })
      this.unsavedOrder.set(null)
      this.editOrder.set(null)
      this.syncChanges()
    }

    this.audio.newOrderNotification()
  }




  // removes order entirely
  public deleteOrder(orderId: OrderId, sync = true)
  {
    if (!this.socket()?.connected || !orderId)
      return

    const orderIndex = this.orderList().findIndex((o) => o()?.id === orderId)
    if (orderIndex === -1) return

    const order = this.orderList()[orderIndex]()
    if (!order) return

    this.orderList.update((orders) => orders.filter((_, i) => i !== orderIndex))
    this.orderSyncList = this.orderSyncList.filter((o) => o.id !== orderId)

    if (this.editOrder() === orderId)
      this.editOrder.set(null)

    if (sync)
      this.syncChanges()
  }





  /** cancels order by removing all undelivered items, but keeps the order and its deliveries
   * in the list */
  public cancelOrder(orderId: OrderId)
  {
    if (!this.socket()?.connected || !orderId)
      return

    const order = this.getOrderById(orderId)?.()
    if (!order)
      return
    else
    {
      const items = order.items()

      order.items.set(items.map((item) =>
        ({ ...item, quantity: item.delivered + item.inDelivery })))

      // order.items.set([...items])

      this.updateSyncOrder(order)
    }
  }





  transferOrder(orderId: OrderId, targetMarkerId: string)
  {
    if (!this.socket()?.connected || !orderId || !targetMarkerId)
      return

    const order = this.getOrderById(orderId)
    if (!order) return

    order.set({ ...order()!, markerId: targetMarkerId })
    this.updateSyncOrder(order()!)
  }





  getDelivery(orderId: OrderId, userId: string)
  {
    const empty = { order: undefined, deliveries: undefined, delivery: undefined }
    if (!orderId || !userId)
      return empty

    const orderSignal = this.getOrderById(orderId)
    const order = orderSignal?.()
    if (!order)
      return empty

    const deliveries = order.deliveries()
    const delivery = deliveries.find((d) => d.user.id === userId)

    if (!delivery)
      return empty

    return { order, deliveries, delivery }
  }





  transferDelivery(orderId: OrderId, from: User, to: User)
  {
    if (!this.socket()?.connected || !orderId || !from || !to)
      return

    const { order, deliveries, delivery } = this.getDelivery(orderId, from.id)
    if (!order || !deliveries || !delivery)
      return

    delivery.user = to

    order.deliveries.set([...deliveries])
    this.updateSyncOrder(order)
  }





  cancelDelivery(orderId: OrderId, userId: string)
  {
    if (!this.socket()?.connected || !orderId || !userId)
      return

    const { order, deliveries, delivery } = this.getDelivery(orderId, userId)
    if (!order || !deliveries || !delivery)
      return

    order.deliveries.set(deliveries.filter((d) => d.user.id !== userId))
    this.updateSyncOrder(order)
  }





  changeDeliveryState(orderId: OrderId, userId: string, newState: Delivery["status"])
  {
    if (!this.socket()?.connected || !orderId || !userId)
      return

    const { order, deliveries, delivery } = this.getDelivery(orderId, userId)
    if (!order || !deliveries || !delivery)
      return

    delivery.status = newState
    order.deliveries.set([...deliveries])
    this.updateSyncOrder(order)
  }





  duplicateOrder(orderId: OrderId)
  {
    if (!this.socket()?.connected || !orderId)
      return

    const order = this.getOrderById(orderId)
    if (!order || !order()) return

    const orderItems = order()!.items().map((item) => ({ ...item, delivered: 0, inDelivery: 0 }))

    this.newOrder(order()!.markerId)
    this.currentOrder()?.items.set(orderItems)
  }





  private getOrderById(id: OrderId): WritableSignal<Order | null> | null
  {
    if (!id) return null
    if (this.unsavedOrder()?.id === id)
      return this.unsavedOrder

    return this.orderList().find((o) => o()?.id === id) || null
  }





  public addItemToOrder(
    itemId: string,
    priority: "low" | "medium" | "high" = "medium",
    amount = 1,
  )
  {
    if (!this.socket()?.connected)
      return

    const order = this.currentOrder()
    if (!order) return

    const items = order.items()
    const existingItem = items.find((item) => item.id === itemId)
    if (existingItem)
    {
      existingItem.quantity += amount
      order.items.set([...items])
    }
    else
    {
      const newItem: OrderItem = {
        delivered: 0,
        id: itemId,
        inDelivery: 0,
        priority: priority,
        quantity: amount,
        sortOrder: 0,
      }

      this.currentOrder()!.items.set([...items, newItem])
    }

    if (!order.unsaved)
      this.updateSyncOrder(order)
  }





  /** reflects changes of a local order to the sync order list */
  public updateSyncOrder(order: Order)
  {
    updateOrderStats(order)
    checkOrderCompletion(order)

    const syncOrderIndex = this.orderSyncList.findIndex((o) => o.id === order.id)
    if (syncOrderIndex === -1)
      return

    this.orderSyncList[syncOrderIndex] = {
      ...order,
      items: order.items(),
      deliveries: order.deliveries(),
    }

    this.syncChanges()
  }





  /** syncs local changes to the server */
  private syncChanges()
  {
    const lastIteration: unknown = JSON.parse(this.lastSyncedOrderIteration)
    const diff = jdp.diff(lastIteration, this.orderSyncList)

    if (diff)
    {
      this.orderIteration.update((n) => n + 1)
      this.lastSyncedOrderIteration = JSON.stringify(this.orderSyncList)

      this.socket()?.emit(Events.SYNC_ORDERS, this.orderIteration(), diff)
    }
  }





  private socketEffect = effect(() =>
  {
    const socket = this.socket()

    untracked(() =>
    {
      if (!socket) return

      if (!socket.connected)
        socket.once("connect", () => this.setupSocketHandlers())
      else
        this.setupSocketHandlers()
    })
  })

  private setupSocketHandlers = () =>
  {
    this.socket().on(Events.SYNC_ORDERS, this.syncOrdersHandler)
    this.requestOrdersUpdate()
    this.resetIdleUpdateTimout()
  }

  private resetIdleUpdateTimout = () =>
  {
    const min = 1000 * 60 * 2.5 // 2.5 minutes
    const max = 1000 * 60 * 6 // 6 minutes
    const idleTimeout = Math.floor(Math.random() * (max - min + 1) + min) // random timeout between min and max

    clearTimeout(this.orderUpdateInterval)
    this.orderUpdateInterval = setTimeout(() => this.requestOrdersUpdate(), idleTimeout)
  }





  private requestOrdersUpdate()
  {
    const socket = this.socket()
    if (!socket || !socket.connected) return

    socket.emit(
      Events.REQUEST_ORDERS,
      this.orderIteration(),
      this.requestOrdersResponseHandler,
    )
  }





  private requestOrdersResponseHandler = (error: Error, response:RequestResponse<SyncOrder[]>) =>
  {
    this.resetIdleUpdateTimout()

    if (error)
      console.error("Error requesting orders update:", error)

    if (!response)
      return

    this.orderIteration.set(response.iteration)

    if (response.full)
      this.orderSyncList = response.full

    else if (response.delta && this.orderSyncList)
      response.delta.forEach((delta) =>
      {
        jdp.patch(this.orderSyncList, delta)
      })

    this.mergeSyncedOrderChanges()
  }





  private syncOrdersHandler = (data: { iterationNumber: number, diff: Delta }) =>
  {
    const { iterationNumber, diff } = data

    if (!this.orderSyncList || !iterationNumber || !diff)
      return

    this.resetIdleUpdateTimout()

    if (iterationNumber < this.orderIteration())
    {
      this.orderIteration.set(-1)
      return this.requestOrdersUpdate()
    }

    if (iterationNumber === this.orderIteration())
      return

    if (iterationNumber - this.orderIteration() !== 1)
      return this.requestOrdersUpdate()
    else
    {
      jdp.patch(this.orderSyncList, diff)
      this.orderIteration.set(iterationNumber)
      this.mergeSyncedOrderChanges()
    }

  }





  private mergeSyncedOrderChanges()
  {
    const ids: string[] = []
    this.orderSyncList.forEach((_order) =>
    {
      const order = JSON.parse(JSON.stringify(_order)) as SyncOrder
      ids.push(order.id!)
      const localOrderSignal = this.getOrderById(order.id)

      if (!localOrderSignal || !localOrderSignal())
        return this.saveOrder(order)

      const localOrder = localOrderSignal() as Order

      if (localOrder.syncId !== order.syncId)
      {
        if (localOrder.completed && order.completed)
          this.audio.orderCompletedNotification()

        const { items, deliveries, ...orderUpdate } = order
        localOrder.items.set([...items])
        localOrder.deliveries.set([...deliveries])
        localOrderSignal.set({
          ...localOrder,
          ...orderUpdate,
        })
      }

    })

    // delete local OpsBases that are not in the synced list
    this.orderList().forEach((order) =>
    {
      if (!ids.includes(order().id!))
        this.deleteOrder(order().id, false)
    })

    this.lastSyncedOrderIteration = JSON.stringify(this.orderSyncList)

  }




  /** temporary located here. should be a application wide setting in the future */
  public readonly team = signal<"C" | "W">("W")

  factionFilter = ([, value]: [string, object]) =>
  {
    if ("faction" in value)
      return value.faction === this.team()
    else
      return true
  }

}
