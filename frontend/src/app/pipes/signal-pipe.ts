import { Pipe, PipeTransform, Signal } from "@angular/core"

@Pipe({
  name: "signal",
  pure: false,
})
export class SignalPipe implements PipeTransform
{

  transform<T>(signal: Signal<T>): T
  {
    return signal()
  }
}