import { Pipe, PipeTransform } from "@angular/core"
import { EMPTY_ITEM, items } from "../config/items"


@Pipe({ name: "foxholeItem" })
export class FoxholeItemPipe implements PipeTransform
{

  transform(codeName: string): typeof items[string]
  {
    const item = items[codeName]
    return item ?? EMPTY_ITEM
  }

}
