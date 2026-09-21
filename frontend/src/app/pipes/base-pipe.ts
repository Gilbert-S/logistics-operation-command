import { computed, inject, Pipe, PipeTransform, Signal, signal, untracked } from "@angular/core"
import { Base, BaseService } from "../services/base.service"





@Pipe({ name: "base", standalone: true, pure: true })
export class BasePipe implements PipeTransform
{
  baseService = inject(BaseService)
  readonly markerId = signal<string>("")
  readonly property = signal<"name" | "type" | "iconUrl" | "object">("name")

  readonly base = computed(() => this.baseService.getBase(this.markerId()))

  readonly name = computed(() => this.base()?.name() || "(unnamed)")
  readonly type = computed(() => this.base()?.iconName || this.base()?.baseType?.() || "")
  readonly iconUrl = computed(() => this.base()?.iconUrl() || "")

  readonly output = computed(() =>
  {
    if (this.base() === null)
      return "(deleted base)"

    if (this.property() === "name")
      return this.name()

    if (this.property() === "type")
      return this.type()
    if (this.property() === "iconUrl")
      return this.iconUrl()
    if (this.property() === "object")
      return this.base()

    return ""
  })

  transform(markerId: string, property: "name" | "type" | "iconUrl"): Signal<string>
  transform(markerId: string, property: "object"): Signal<Base | null>
  transform(markerId: string, property: "name" | "type" | "iconUrl" | "object"):
    Signal<string> | Signal<Base | null>
  {
    untracked(() =>
    {
      this.markerId.set(markerId)
      this.property.set(property)
    })

    return this.output as Signal<string> | Signal<Base | null>
  }
}