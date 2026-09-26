import { Component, computed, effect, inject, linkedSignal, signal } from "@angular/core"
import { BaseService } from "../../../services/base.service"
import { OrderService } from "../../../services/order.service"
import { BrnDialogImports, BrnDialogState } from "@spartan-ng/brain/dialog"
import { HlmBadgeImports } from "@spartan-ng/helm/badge"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmContextMenuImports } from "@spartan-ng/helm/context-menu"
import { HlmDialogImports } from "@spartan-ng/helm/dialog"
import { HlmToggleGroupImports } from "@spartan-ng/helm/toggle-group"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { LocalUserPreferenceService } from "../../../services/local-user-preference.service"
import { OrderTruck } from "../../shared/order-truck"
import { OrderItems } from "../order-items/order-items"
import { OrderTemplates } from "../order-templates/order-templates"
import { HlmResizableImports } from "@spartan-ng/helm/resizable"
import { ItemVariant } from "../../shared/item-variant"
import { FactionVariant, ItemCategory, items } from "../../../config/items"
import { FoxholeItemImage } from "../../../directives/foxhole-item-image"
import { FoxholeItemPipe } from "../../../pipes/foxhole-item-pipe"
import { OrderDetails } from "../order-details/order-details"
import { FormsModule } from "@angular/forms"
import { HlmFieldImports } from "@spartan-ng/helm/field"
import { HlmInputImports } from "@spartan-ng/helm/input"
import { HlmHoverCardImports } from "@spartan-ng/helm/hover-card"
import { ItemHoverCard } from "../../item-hover-card/item-hover-card"





@Component({
  selector: "app-order-editor",
  imports: [
    BrnDialogImports,
    FormsModule,
    FoxholeItemImage,
    FoxholeItemPipe,
    HlmBadgeImports,
    HlmButtonImports,
    HlmContextMenuImports,
    HlmDialogImports,
    HlmFieldImports,
    HlmHoverCardImports,
    HlmInputImports,
    HlmResizableImports,
    HlmToggleGroupImports,
    HlmTooltipImports,
    ItemHoverCard,
    ItemVariant,
    OrderDetails,
    OrderItems,
    OrderTemplates,
    OrderTruck,
  ],
  templateUrl: "./order-editor.html",
})
export class OrderEditor
{
  baseService = inject(BaseService)
  orderService = inject(OrderService)

  order = this.orderService.currentOrder
  editOrder = this.orderService.editOrder

  readonly team = signal<"C" | "W">("W")
  readonly priority = signal<"high" | "medium" | "low">("medium")
  variant = inject(LocalUserPreferenceService).itemListVariant

  commonItemClasses = `
    hover:scale-125 hover:shadow-lg hover:bg-(--secondary) hover:border-(--border)!
    transition-all duration-150 cursor-pointer border-1 rounded-sm p-1
  `

  userStoredLayout = inject(LocalUserPreferenceService).orderLayout
  readonly layout = linkedSignal<number[]>(() => this.userStoredLayout())

  private categoryOrder: (ItemCategory | null)[] = [
    ItemCategory.Custom,
    ItemCategory.SmallArms,
    ItemCategory.HeavyArms,
    ItemCategory.HeavyAmmo,
    ItemCategory.Utility,
    ItemCategory.Medical,
    ItemCategory.Uniform,
    ItemCategory.Supplies,
    ItemCategory.Parts,
    null,
  ]

  FactionVariant = FactionVariant
  readonly factionItemFilter =
    signal<FactionVariant[]>([FactionVariant.Wardens, FactionVariant.Neutral])
  readonly nameItemFilter = signal<string>("")

  readonly items =
    signal(Object.values(items).sort((a, b) =>
      this.categoryOrder.indexOf(a.ItemCategory) - this.categoryOrder.indexOf(b.ItemCategory)))

  readonly filteredItems = computed(() =>
    this.items()
      .filter((item) => this.factionItemFilter().includes(item.FactionVariant) &&
        (this.categoryFilter() === null || item.ItemCategory === this.categoryFilter()) &&
        item.DisplayName.toLowerCase().includes(this.nameItemFilter().toLowerCase())))

  private debounce = 0
  private layoutEffect = effect(() =>
  {
    const layout = this.layout()
    clearTimeout(this.debounce)
    this.debounce = setTimeout(() => this.userStoredLayout.set(layout), 1000)
  })

  readonly categoryFilter = signal<ItemCategory | null>(null)
  categories = [
    {
      name: "Custom",
      value: ItemCategory.Custom,
      icon: "/images/IconInfrastructureCommand.png",
    },
    {
      name: "Small Arms",
      value: ItemCategory.SmallArms,
      icon: "/images/IconFilterSmallWeapons.png",
      class: "data-[state=on]:bg-yellow-300/30",
    },
    {
      name: "Heavy Arms",
      value: ItemCategory.HeavyArms,
      icon: "/images/IconFilterHeavyWeapons.png",
      class: "data-[state=on]:bg-amber-500/30",
    },
    {
      name: "Heavy Ammo",
      value: ItemCategory.HeavyAmmo,
      icon: "/images/IconFilterHeavyAmmunition.png",
      class: "data-[state=on]:bg-red-500/30",
    },
    {
      name: "Utility",
      value: ItemCategory.Utility,
      icon: "/images/IconFilterUtility.png",
      class: "data-[state=on]:bg-sky-500/30",
    },
    {
      name: "Medical",
      value: ItemCategory.Medical,
      icon: "/images/IconFilterMedical.png",
      class: "data-[state=on]:bg-lime-500/30",
    },
    {
      name: "Uniform",
      value: ItemCategory.Uniform,
      icon: "/images/IconFilterUniforms.png",
      class: "data-[state=on]:bg-mist-500/30",
    },
    {
      name: "Supplies",
      value: ItemCategory.Supplies,
      icon: "/images/IconFilterResource.png",
      class: "data-[state=on]:bg-stone-500/30",
    },
    {
      name: "Parts",
      value: ItemCategory.Parts,
      icon: "/images/IconFilterAircraft.png",
      class: "data-[state=on]:bg-violet-500/30",
    },
  ]


  readonly state = computed<BrnDialogState>(() => this.editOrder() ? "open" : "closed")


  readonly highPriorityItems = computed(() =>
    this.order()?.items().filter((item) => item.priority === "high") || [])

  readonly mediumPriorityItems = computed(() =>
    this.order()?.items().filter((item) => item.priority === "medium") || [])

  readonly lowPriorityItems = computed(() =>
    this.order()?.items().filter((item) => item.priority === "low") || [])



  readonly base = computed(() => this.baseService.getBase(this.order()?.markerId || ""))
  readonly baseIconUrl = computed(() => this.base()?.iconUrl())
  readonly baseName = computed(() => this.base()?.name())
  readonly baseIconName = computed(() => this.base()?.iconName)
  readonly baseType = computed(() => this.base()?.baseType?.())


  readonly orderItemCount = computed(() => this.order()?.items()
    ?.reduce((acc, item) => acc + item.quantity, 0) || 0)
  readonly orderItem15 = computed(() => Math.ceil(this.orderItemCount() / 15) * 15 || 15)
  readonly orderFull = computed(() => this.orderItemCount() === this.orderItem15())




  addItemToOrder($event: MouseEvent, itemId: string)
  {
    let amount = 1
    if ($event.shiftKey)
      amount = 3
    else if ($event.ctrlKey)
      amount = 5

    this.orderService.addItemToOrder(itemId, this.priority(), amount)
  }


  saveNewOrder()
  {
    if (!this.order()) return
    this.orderService.saveOrder()
  }

  discardNewOrder()
  {
    if (!this.order() || !this.order()?.unsaved) return
    this.orderService.unsavedOrder.set(null)
    this.orderService.editOrder.set(null)
  }



  orderItemMouseWheelHandler($event: WheelEvent, itemId: string)
  {
    if (!$event.shiftKey)
      return

    const amount = $event.deltaY < 0 ? 1 : -1

    const order = this.order()
    if (!order)
      return

    let item = order.items().find((i) => i.id === itemId)

    if (amount < 0 && !item)
      return

    if (amount > 0 && !item)
    {
      this.orderService.addItemToOrder(itemId, this.priority())
      item = order.items().find((i) => i.id === itemId)
    }


    if (item)
    {
      item.quantity += amount
      if (item.quantity < 1)
        item.quantity = 1

      order.items.set([...order.items()])
    }

    if (!order.unsaved)
      this.orderService.updateSyncOrder(order)
  }



  factionFilter = ([, value]: [string, object]) =>
  {
    if ("faction" in value)
      return value.faction === this.team()
    else
      return true
  }
}
