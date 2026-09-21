import { Pipe, PipeTransform } from "@angular/core"
import { UAParser } from "../ua-parser-lib/ua-parser"

@Pipe({ name: "userAgent" })
export class UserAgentPipe implements PipeTransform
{
  private parser = new UAParser()

  transform(value: string | null | undefined): string
  {
    if (!value)
      return "Unknown"

    this.parser.setUA(value)
    const r = this.parser.getResult()
    const device = r.device?.type ? ` — ${r.device.vendor} ${r.device.model}` : ""
    return `${r.os.name} ${r.os.version} — ${r.browser.name} ${r.browser.major}${device}`
  }

}
