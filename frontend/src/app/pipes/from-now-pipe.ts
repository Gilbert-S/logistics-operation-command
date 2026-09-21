import { OnDestroy, Pipe, PipeTransform, Signal, signal, untracked } from "@angular/core"
import dayjs, { Dayjs } from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
dayjs.extend(relativeTime)
dayjs.extend(updateLocale)

dayjs.updateLocale("en", {
  relativeTime: {
    d: "a day",
    dd: "%d days",
    h: "1h",
    hh: "%dh",
    m: "%dm",
    M: "a month",
    MM: "%d months",
    mm: "%dm",
    s: "seconds",
    y: "a year",
    yy: "%d years",
  },
})




@Pipe({ name: "fromNow", pure: true })
export class FromNowPipe implements PipeTransform, OnDestroy
{
  readonly output = signal("")
  input: Dayjs | undefined
  timeout: number | undefined



  transform(value: Date | number | string | null | undefined, withoutSuffix = false): Signal<string>
  {
    if (!value) return this.output.asReadonly()

    this.input = dayjs(value)
    untracked(() => this.refresh(withoutSuffix))
    return this.output.asReadonly()
  }


  refresh(withoutSuffix = false)
  {
    clearTimeout(this.timeout)

    if (this.input)
      this.output.set(this.input.fromNow(withoutSuffix))

    const diffInM = this.input!.diff(undefined, "minutes")

    if (diffInM >= -1)
      this.timeout = setTimeout(() => this.refresh(withoutSuffix), 5000)
    else if (diffInM >= -45)
      this.timeout = setTimeout(() => this.refresh(withoutSuffix), 30000)
    else
      this.timeout = setTimeout(() => this.refresh(withoutSuffix), 1000 * 60 * 5)

  }


  ngOnDestroy()
  {
    clearTimeout(this.timeout)
  }

}
