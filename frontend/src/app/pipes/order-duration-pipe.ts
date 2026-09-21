import { Pipe, PipeTransform, signal } from "@angular/core"
import dayjs, { Dayjs } from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Order } from "@loc/types"
dayjs.extend(relativeTime)





@Pipe({ name: "orderDuration", pure: true })
export class OrderDurationPipe implements PipeTransform
{
  readonly output = signal("")
  input: Dayjs | undefined
  timeout: number | undefined



  transform(order: Order): string
  {
    if (!order) return ""

    const start = dayjs(order.timeStart)
    const end = order.timeEnd ? dayjs(order.timeEnd) : dayjs()
    const durationInMinutes = end.diff(start, "minutes")
    const hours = Math.floor(durationInMinutes / 60)
    const minutes = durationInMinutes % 60
    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m`

  }
}
