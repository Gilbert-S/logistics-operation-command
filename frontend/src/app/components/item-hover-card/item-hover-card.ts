import { Component, input } from "@angular/core"
import { FactionVariant, Item } from "../../config/items"
import { FoxholeItemImage } from "../../directives/foxhole-item-image"

@Component({
  selector: "app-foxhole-item-hover-card",
  imports: [FoxholeItemImage],
  templateUrl: "./item-hover-card.html",
  host: { class: "contents" },
})
export class ItemHoverCard
{
  readonly item = input.required<Item>()
  FactionVariant = FactionVariant
}