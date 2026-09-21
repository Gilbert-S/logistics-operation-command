import { Pipe, PipeTransform, signal } from "@angular/core"
import dayjs, { Dayjs } from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Delivery } from "@loc/types"
dayjs.extend(relativeTime)





@Pipe({ name: "deliveryDuration", pure: true })
export class DeliveryDurationPipe implements PipeTransform
{
  readonly output = signal("")
  input: Dayjs | undefined
  timeout: number | undefined



  transform(delivery: Delivery): string
  {
    if (!delivery) return ""

    const start = dayjs(delivery.timeStart)
    const end = delivery.timeEnd ? dayjs(delivery.timeEnd) : dayjs()
    const durationInMinutes = end.diff(start, "minutes")
    const hours = Math.floor(durationInMinutes / 60)
    const minutes = durationInMinutes % 60
    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m`

  }
}
