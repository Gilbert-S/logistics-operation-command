import type { Order, SyncOrder } from "@loc/types"





export function checkOrderCompletion(order: SyncOrder | Order): void
{
  if (!order)
    return

  const stats = order.stats

  if (stats.ordered.total > 0 && stats.ordered.total <= stats.delivered.total)
  {
    order.completed = true
    order.timeEnd = Date.now()
  }
  else
  {
    order.completed = false
    order.timeEnd = null
  }
}