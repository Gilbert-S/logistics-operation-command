import type { DeliveryItem, Order, OrderItem, SyncOrder } from "@loc/types"

const itemQuantityReducer = (sum: number, item: OrderItem): number => sum + item.quantity
const itemDeliveredReducer = (sum: number, item: OrderItem): number => sum + item.delivered
const itemInDeliveryReducer = (sum: number, item: OrderItem): number => sum + item.inDelivery

export const highFilter = (item: OrderItem | DeliveryItem) => item.priority === "high"
export const mediumFilter = (item: OrderItem | DeliveryItem) => item.priority === "medium"
export const lowFilter = (item: OrderItem | DeliveryItem) => item.priority === "low"

export function updateOrderStats(order: SyncOrder | Order): void
{
  const stats = order.stats

  const orderItems = Array.isArray(order.items) ? order.items : order.items()
  const orderDeliveries = Array.isArray(order.deliveries) ? order.deliveries : order.deliveries()

  // order.items.forEach((item) =>
  for (const item of orderItems)
  {
    // refresh inDelivery stats directly from deliveries list
    const inDelivery = orderDeliveries.reduce((sum, delivery) =>
    {
      if (delivery.status === "completed")
        return sum

      const deliveryItem = delivery.items.find((di) => di.itemId === item.id)
      return sum + (deliveryItem ? deliveryItem.quantity : 0)
    }, 0)

    // refresh delivered stats directly from deliveries list
    const delivered = orderDeliveries.reduce((sum, delivery) =>
    {
      if (delivery.status !== "completed")
        return sum

      const deliveryItem = delivery.items.find((di) => di.itemId === item.id)
      return sum + (deliveryItem ? deliveryItem.quantity : 0)
    }, 0)

    item.inDelivery = inDelivery
    item.delivered = delivered
  }

  stats.ordered.total = orderItems.reduce(itemQuantityReducer, 0)
  stats.ordered.high = orderItems.filter(highFilter).reduce(itemQuantityReducer, 0)
  stats.ordered.medium = orderItems.filter(mediumFilter).reduce(itemQuantityReducer, 0)
  stats.ordered.low = orderItems.filter(lowFilter).reduce(itemQuantityReducer, 0)

  stats.delivered.total = orderItems.reduce(itemDeliveredReducer, 0)
  stats.delivered.high = orderItems.filter(highFilter).reduce(itemDeliveredReducer, 0)
  stats.delivered.medium = orderItems.filter(mediumFilter).reduce(itemDeliveredReducer, 0)
  stats.delivered.low = orderItems.filter(lowFilter).reduce(itemDeliveredReducer, 0)

  stats.inDelivery.total = orderItems.reduce(itemInDeliveryReducer, 0)
  stats.inDelivery.high = orderItems.filter(highFilter).reduce(itemInDeliveryReducer, 0)
  stats.inDelivery.medium = orderItems.filter(mediumFilter).reduce(itemInDeliveryReducer, 0)
  stats.inDelivery.low = orderItems.filter(lowFilter).reduce(itemInDeliveryReducer, 0)

  stats.leftToDeliver.total = stats.ordered.total - stats.delivered.total - stats.inDelivery.total
  stats.leftToDeliver.high = stats.ordered.high - stats.delivered.high - stats.inDelivery.high // eslint-disable-next-line @stylistic/max-len
  stats.leftToDeliver.medium = stats.ordered.medium - stats.delivered.medium - stats.inDelivery.medium
  stats.leftToDeliver.low = stats.ordered.low - stats.delivered.low - stats.inDelivery.low
}