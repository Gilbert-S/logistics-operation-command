import { Directive, input } from "@angular/core"
import { classes } from "@spartan-ng/helm/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { injectHlmItemConfig } from "./hlm-item-token"

const itemVariants = cva(
  `
    group/item flex w-full flex-wrap items-center rounded-lg border text-sm transition-colors
    duration-100 outline-none focus-visible:border-ring focus-visible:ring-[3px]
    focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-muted
  `,
  {
    variants: {
      variant: {
        default: "border-transparent",
        outline: "border-border",
        muted: "border-transparent bg-muted/50",
      },
      size: {
        default: "gap-2.5 px-3 py-2.5",
        sm: "gap-2.5 px-3 py-2.5",
        xs: "gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ItemVariants = VariantProps<typeof itemVariants>

@Directive({
  selector: "[hlmItem],hlm-item",
  host: {
    "data-slot": "item",
    "[attr.data-variant]": "variant()",
    "[attr.data-size]": "size()",
  },
})
export class HlmItem
{
  private readonly _config = injectHlmItemConfig()
  public readonly variant = input<ItemVariants["variant"]>(this._config.variant)
  public readonly size = input<ItemVariants["size"]>(this._config.size)

  constructor()
  {
    classes(() => itemVariants({ variant: this.variant(), size: this.size() }))
  }
}
