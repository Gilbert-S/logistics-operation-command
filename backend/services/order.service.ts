import { checkOrderCompletion, Events, highFilter, lowFilter, mediumFilter, updateOrderStats }
  from "@loc/common"
import type { Socket } from "socket.io"
import {
  applyDelta, diffAndSync, getDeltaForIteration, getLastIterationNumber,
  Identifier, storeDelta, sync,
} from "./diff.service.ts"
import type { Delta } from "jsondiffpatch"
import type { Delivery, DeliveryItem, OrderItem, RequestResponseHandler, SyncOrder }
  from "@loc/types"


import Debug from "debug"
import type { User } from "./auth.service.ts"
const debug = Debug("loc:service:orders")
debug("loading order service module")




export const orderList: SyncOrder[] = []


export function initializeOrderData(backup?: SyncOrder[] | null)
{
  debug("initializing Orders data and syncing with clients")

  if (backup)
  {
    debug("restoring Orders data from backup")
    orderList.splice(0, orderList.length, ...backup)
  }

  diffAndSync(Identifier.Orders, Events.SYNC_ORDERS, orderList)
}




export function registerSocketOrdersHandlers(socket: Socket)
{
  debug("registering handlers for socket %o", socket.id)
  const dlog = debug.extend(`socket:${ socket.id}`)



  const requestOrdersHandler: RequestResponseHandler<SyncOrder[]> = (iteration, callback) =>
  {
    dlog("Orders update requested for iteration %d", iteration)

    const lastIteration = getLastIterationNumber(Identifier.Orders)
    dlog("latest Orders iteration is %d", lastIteration)

    if (iteration === lastIteration)
    {
      dlog("up to date, no data sent")
      return callback({ iteration: lastIteration })
    }

    if (!orderList)
    {
      dlog("no Orders data available on server, no data sent")
      return callback({ iteration: lastIteration })
    }


    if (!iteration || iteration <= 0)
    {
      dlog("update for invalid iteration requested, sending full Orders data")
      return callback({ iteration: lastIteration, full: orderList })
    }


    const delta = getDeltaForIteration(Identifier.Orders, iteration)
    if (!delta)
    {
      dlog("no delta available for requested iteration, sending full Orders data")
      return callback({ iteration: lastIteration, full: orderList })
    }

    else
    {
      dlog("sending delta for iteration %d to %d", iteration, lastIteration)
      return callback({ iteration: lastIteration, delta })
    }
  }


  const syncOrdersHandler = (iterationNumber: number, diff: Delta) =>
  {
    dlog(`Orders sync with iteration %d received`, iterationNumber)

    const lastIteration = getLastIterationNumber(Identifier.Orders)
    if (iterationNumber !== lastIteration + 1)
      return dlog(`Canceled. Out of order sync - last iteration is %d`, lastIteration)

    applyDelta(orderList, diff)
    storeDelta(Identifier.Orders, diff, orderList)
    dlog(`Orders sync with iteration %d applied`, iterationNumber)
    sync(Events.SYNC_ORDERS, Identifier.Orders)
    dlog(`Orders sync with iteration %d broadcasted to all clients`, iterationNumber)
  }



  const pick15Handler = (orderId: string, callback: Pick15Callback) =>
  {
    dlog("pick15 for order %o received", orderId)

    if (!orderList || typeof callback !== "function")
    {
      dlog("invalid orderList or callback, pick15 canceled")
      return
    }

    const order = orderList.find((o) => o.id === orderId)
    if (!order)
    {
      callback(false)
      return dlog("no order for id %o found", orderId)
    }


    if (order.completed || order.stats.leftToDeliver.total <= 0)
    {
      callback(false)
      return dlog("order %o is already completed or has no items left to deliver", orderId)
    }

    const { myDelivery, order: myOrder } = getMyDelivery(socket.session.user.id) || {}

    if (myOrder && myOrder !== order)
    {
      callback(false)
      return dlog("user has an active delivery for a different order")
    }

    if (myDelivery && myDelivery.quantity >= 15)
    {
      callback(false)
      return dlog("user has reached the maximum delivery quantity")
    }

    const delivery = pick15ItemsForDelivery(order, socket.session.user, myDelivery)
    if (delivery.quantity <= 0)
    {
      callback(false)
      return dlog("no items available for delivery for order %o", orderId)
    }


    updateDeliveryPriority(delivery)
    updateOrderStats(order)
    checkOrderCompletion(order)
    order.syncId = crypto.randomUUID()

    diffAndSync(Identifier.Orders, Events.SYNC_ORDERS, orderList)

    callback(true)
    dlog("pick15 for order %o completed successfully", orderId)

  }


  const cancelHandler = () =>
  {
    dlog("cancel delivery request received")

    const { myDelivery, order } = getMyDelivery(socket.session.user.id) || {}
    if (myDelivery && order)
    {
      order.deliveries = order.deliveries.filter((d) => d !== myDelivery)
      updateOrderStats(order)
      checkOrderCompletion(order)
      order.syncId = crypto.randomUUID()
      diffAndSync(Identifier.Orders, Events.SYNC_ORDERS, orderList)
    }
  }


  const changeStateHandler = (newState: Delivery["status"]) =>
  {
    dlog("change delivery state request received, new state: %o", newState)
    const { myDelivery, order } = getMyDelivery(socket.session.user.id) || {}
    if (myDelivery)
    {
      myDelivery.status = newState
      if (newState === "completed")
        myDelivery.timeEnd = Date.now()

      updateOrderStats(order!)
      checkOrderCompletion(order!)
      order!.syncId = crypto.randomUUID()
      diffAndSync(Identifier.Orders, Events.SYNC_ORDERS, orderList)
    }
  }


  // quantity = 0 will remove an item from delivery
  const pickHandler = (orderId: string, itemId: string, quantity: number) =>
  {
    dlog("pick request received for order %o, item %o, quantity %o", orderId, itemId, quantity)

    const { myDelivery, order: myOrder } = getMyDelivery(socket.session.user.id) || {}
    const myDeliveryItem = myDelivery?.items.find((i) => i.itemId === itemId)

    if (myOrder && orderId !== myOrder.id)
      return dlog("order id mismatched myDelivery, pick request canceled")


    if (quantity <= 0)
    {
      if (!myDelivery || !myOrder || !myDeliveryItem)
        return dlog("invalid pick request: no active delivery(item) found")

      if (quantity === 0)
      {
        myDelivery.items = myDelivery.items.filter((i) => i.itemId !== itemId)
        dlog("item removed from delivery")
        if (myDelivery.items.length === 0)
        {
          myOrder.deliveries = myOrder.deliveries.filter((d) => d !== myDelivery)
          dlog("delivery removed from order as it has no more items")
        }
      }

      else
      {
        myDeliveryItem.quantity += quantity
        dlog("item quantity in delivery updated to %o", myDeliveryItem.quantity)

        if (myDeliveryItem.quantity <= 0)
        {
          myDelivery.items = myDelivery.items.filter((i) => i.itemId !== itemId)
          dlog("item removed from delivery")
        }

        if (myDelivery.items.length === 0)
        {
          myOrder.deliveries = myOrder.deliveries.filter((d) => d !== myDelivery)
          dlog("delivery removed from order as it has no more items")
        }
      }


      myDelivery.quantity = myDelivery.items.reduce((sum, i) => sum + i.quantity, 0)
      myOrder.syncId = crypto.randomUUID()
      updateDeliveryPriority(myDelivery)
      updateOrderStats(myOrder)
      checkOrderCompletion(myOrder)
      diffAndSync(Identifier.Orders, Events.SYNC_ORDERS, orderList)
      return
    }



    let delivery = myDelivery
    let deliveryItem = myDeliveryItem
    const order = myOrder || orderList.find((o) => o.id === orderId)
    const orderItem = order?.items.find((i) => i.id === itemId)

    if (!order || !orderItem)
      return dlog("order or item not found, pick request canceled")

    if (delivery && delivery.quantity >= 15)
      return dlog("delivery quantity limit reached, pick request canceled")

    const availableQuantity = orderItem.quantity - orderItem.delivered - orderItem.inDelivery
    if (availableQuantity <= 0)
      return dlog("no available quantity for item, pick request canceled")

    if (!delivery)
    {
      const user = {
        id: socket.session.user.id,
        name: socket.session.user.name,
        image: socket.session.user.image || null,
      }

      delivery = {
        id: crypto.randomUUID(),
        items: [
          {
            itemId,
            quantity: 0,
            priority: orderItem?.priority || "low",
          },
        ],
        priority: orderItem?.priority || "low",
        quantity: 0,
        status: "pickup",
        timeEnd: null,
        timeStart: Date.now(),
        user,
      }

      deliveryItem = delivery.items[0]
      order.deliveries.push(delivery)
      dlog("new delivery created for user %o", socket.session.user.id)
    }
    else if (!deliveryItem)
    {
      deliveryItem = {
        itemId,
        quantity: 0,
        priority: orderItem.priority,
      }
      delivery.items.push(deliveryItem)
      dlog("item %o added to existing delivery for user %o", itemId, socket.session.user.id)
    }


    deliveryItem!.quantity += Math.min(quantity, availableQuantity, 15 - delivery.quantity)

    delivery.quantity = delivery.items.reduce((sum, i) => sum + i.quantity, 0)
    order.syncId = crypto.randomUUID()
    updateOrderStats(order)
    checkOrderCompletion(order)
    diffAndSync(Identifier.Orders, Events.SYNC_ORDERS, orderList)
    return
  }


  socket.on(Events.REQUEST_ORDERS, requestOrdersHandler)
  socket.on(Events.SYNC_ORDERS, syncOrdersHandler)
  socket.on(Events.DELIVERY_AUTOPICK15, pick15Handler)
  socket.on(Events.DELIVERY_CANCEL, cancelHandler)
  socket.on(Events.DELIVERY_CHANGESTATE, changeStateHandler)
  socket.on(Events.DELIVERY_PICK, pickHandler)
  dlog("handlers registered")
}





type Pick15Callback = (success: boolean) => void





function pick15ItemsForDelivery(order: SyncOrder, u: User, myDelivery?: Delivery): Delivery
{
  const user = {
    id: u.id,
    name: u.name,
    image: u.image || null,
  }


  const delivery: Delivery = myDelivery || {
    id: crypto.randomUUID(),
    items: [],
    priority: "low",
    quantity: 0,
    status: "pickup",
    timeEnd: null,
    timeStart: Date.now(),
    user,
  }

  if (!myDelivery)
    order.deliveries.push(delivery)

  const deliverableItems = itemsAvailableForDelivery(order)
  const highPriorityItems = deliverableItems.filter(highFilter)
  const mediumPriorityItems = deliverableItems.filter(mediumFilter)
  const lowPriorityItems = deliverableItems.filter(lowFilter)


  HighPrio: while (
    delivery.quantity < 15
    && order.stats.leftToDeliver.high > 0
    && highPriorityItems.length > 0
  )

    for (const item of highPriorityItems)
    {
      if (item.quantity - item.delivered - item.inDelivery <= 0)
        continue

      increaseDeliveryQuantity(delivery, item)
      updateOrderStats(order)

      if (delivery.quantity >= 15)
        break HighPrio

      if (order.stats.leftToDeliver.high <= 0)
        break HighPrio
    }



  MediumPrio: while (
    delivery.quantity < 15
    && order.stats.leftToDeliver.medium > 0
    && mediumPriorityItems.length > 0
  )

    for (const item of mediumPriorityItems)
    {
      if (item.quantity - item.delivered - item.inDelivery <= 0)
        continue

      increaseDeliveryQuantity(delivery, item)
      updateOrderStats(order)

      if (delivery.quantity >= 15)
        break MediumPrio

      if (order.stats.leftToDeliver.medium <= 0)
        break MediumPrio
    }



  LowPrio: while (
    delivery.quantity < 15
    && order.stats.leftToDeliver.low > 0
    && lowPriorityItems.length > 0
  )

    for (const item of lowPriorityItems)
    {
      if (item.quantity - item.delivered - item.inDelivery <= 0)
        continue

      increaseDeliveryQuantity(delivery, item)
      updateOrderStats(order)

      if (delivery.quantity >= 15)
        break LowPrio

      if (order.stats.leftToDeliver.low <= 0)
        break LowPrio
    }



  return delivery
}


function getDeliveryItem(delivery: Delivery, item: OrderItem): DeliveryItem
{
  // find existing deloivery item
  const existingDeliveryItem = delivery.items.find((di) => di.itemId === item.id)

  if (existingDeliveryItem)
    return existingDeliveryItem


  const newDeliveryItem = {
    itemId: item.id,
    quantity: 0,
    priority: item.priority,
  }
  delivery.items.push(newDeliveryItem)
  return newDeliveryItem
}


function increaseDeliveryQuantity(delivery: Delivery, item: OrderItem)
{
  debug("increaseDeliveryQuantity %o", item.id)

  const deliveryItem = getDeliveryItem(delivery, item)

  if (item.id.startsWith("Ammo"))
  {
    /** for ammo: pick more then 1 if possible/feasable but never more than maxAmmoPick */
    const maxAmmoPick = 3
    const itemQuantityLeft = item.quantity - item.delivered - item.inDelivery
    const halfOfItemQuantity = Math.ceil(item.quantity / 2)
    const deliverySlotsLeft = 15 - delivery.quantity
    const quantityToPick = Math.min(
      maxAmmoPick,
      itemQuantityLeft,
      halfOfItemQuantity,
      deliverySlotsLeft,
    ) || 1

    deliveryItem.quantity += quantityToPick
    item.inDelivery += quantityToPick
    delivery.quantity += quantityToPick
  }
  else
  {
    deliveryItem.quantity++
    item.inDelivery++
    delivery.quantity++
  }
}





function itemsAvailableForDelivery(order: SyncOrder): OrderItem[]
{
  const itemsWithAvailableQuantity =
    order.items.filter((item) => item.quantity - item.delivered - item.inDelivery > 0)

  // sort by priority and $.sortOrder
  const sortedItems = itemsWithAvailableQuantity.sort((a, b) =>
    (b.priority === a.priority) ? a.sortOrder - b.sortOrder :
      (b.priority === "high") ? 1 : -1)

  return sortedItems
}





function getMyDelivery(userId:string)
{
  for (const order of orderList)
  {
    const myDelivery = order.deliveries
      .find((d) => d.user.id === userId && d.status !== "completed")

    if (myDelivery)
      return { order, myDelivery }
  }

  return null
}





function updateDeliveryPriority(delivery: Delivery)
{
  if (delivery.items.some((item) => item.priority === "high"))
    delivery.priority = "high"

  else if (delivery.items.some((item) => item.priority === "medium"))
    delivery.priority = "medium"

  else
    delivery.priority = "low"
}