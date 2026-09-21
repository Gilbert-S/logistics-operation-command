import { Directive, input } from "@angular/core"
import { BrnTabsList } from "@spartan-ng/brain/tabs"
import { classes } from "@spartan-ng/helm/utils"
import { type VariantProps, cva } from "class-variance-authority"

export const listVariants = cva(
  `
    group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px]
    text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit
    group-data-[orientation=vertical]/tabs:flex-col group-data-horizontal/tabs:h-8
    data-[variant=line]:rounded-none
  `,
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  },
)
type ListVariants = VariantProps<typeof listVariants>

@Directive({
  selector: "[hlmTabsList],hlm-tabs-list",
  hostDirectives: [BrnTabsList],
  host: {
    "data-slot": "tabs-list",
    "[attr.data-variant]": "variant()",
  },
})
export class HlmTabsList
{
  public readonly variant = input<ListVariants["variant"]>("default")

  constructor()
  {
    classes(() => listVariants({ variant: this.variant() }))
  }
}
