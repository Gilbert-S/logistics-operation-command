import { Component, computed, inject, signal, AfterViewInit } from "@angular/core"
import { NgIcon, provideIcons } from "@ng-icons/core"
import {
  lucideCopy, lucideMoreVertical, lucideReplace, lucideReplaceAll, lucideSave,
  lucideSquarePen, lucideTrash,
} from "@ng-icons/lucide"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu"
import { HlmTableImports } from "@spartan-ng/helm/table"
import { TemplateService } from "../../../services/template.service"
import { HlmTooltip } from "@spartan-ng/helm/tooltip"
import { HlmPopoverImports } from "@spartan-ng/helm/popover"
import { HlmAutocompleteImports } from "@spartan-ng/helm/autocomplete"
import { OrderItem, Template } from "@loc/types"
import { HlmLabel } from "@spartan-ng/helm/label"
import { HlmFieldImports } from "@spartan-ng/helm/field"
import { OrderService } from "../../../services/order.service"
import { BrnDialogRef } from "@spartan-ng/brain/dialog"
import { HlmInputImports } from "@spartan-ng/helm/input"
import { HlmButtonGroupImports } from "@spartan-ng/helm/button-group"
import { toast } from "@spartan-ng/brain/sonner"

@Component({
  selector: "app-order-templates",
  imports: [
    HlmAutocompleteImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmFieldImports,
    HlmLabel,
    HlmPopoverImports,
    HlmTableImports,
    HlmTooltip,
    NgIcon,
    HlmInputImports,
    HlmFieldImports,
    HlmButtonGroupImports,
  ],
  providers: [
    provideIcons({
      lucideCopy,
      lucideMoreVertical,
      lucideReplace,
      lucideReplaceAll,
      lucideSave,
      lucideSquarePen,
      lucideTrash,
    }),
  ],
  template: `
    <section class="size-full overflow-hidden p-2">

      <section id="toolbar" class="
        sticky top-0 flex items-center justify-between overflow-hidden rounded-sm border
        border-border bg-[#191919e0] p-2
      ">
        <span>Templates</span>
        <hlm-popover sideOffset="5" align="end">

          <button hlmBtn size="icon" variant="ghost" class="cursor-pointer" hlmPopoverTrigger
            hlmTooltip="Save current order as template" [showDelay]="1000" [disabled]="orderItems().length < 1">
            <ng-icon name="lucideSave" />
          </button>

          <hlm-popover-content *hlmPopoverPortal="let ctx" class="w-100">

            <div class="mb-5 flex justify-end">
              <button hlmBtn variant="default" class="cursor-pointer" [disabled]="!canSave()" (click)="save(ctx)">
                <ng-icon name="lucideSave" />
                {{ saveText() }}
              </button>
            </div>

            <hlm-field class="">
              <p hlmFieldDescription class="mb-5">
                This will save the current order items as a template. You can then use the template to create new orders with the same items.
              </p>

              <label hlmLabel for="autocomplete-input">Create or select a Template</label>

              <hlm-autocomplete autoHighlight [itemToString]="itemToString" [state]="autocompleteState()" [(value)]="targetTemplate" [(search)]="search">
                <hlm-autocomplete-input id="autocomplete-input" showSearch="false" showClear="true"/>
                <hlm-autocomplete-content *hlmAutocompletePortal>
                  <hlm-autocomplete-empty>&mdash;</hlm-autocomplete-empty>
                  <div hlmAutocompleteList>
                    @for (template of filteredTemplates(); track template.id) {
                      <hlm-autocomplete-item class="" [value]="template">
                        {{ template.name }}
                      </hlm-autocomplete-item>
                    }
                  </div>
                </hlm-autocomplete-content>
              </hlm-autocomplete>
            </hlm-field>

          </hlm-popover-content>
        </hlm-popover>

      </section>


      <table hlmTable class="w-full table-fixed">
        <col class="w-auto">
        <col class="size-8">
        <tbody hlmTableBody>
          @for (template of templates(); track template.id) {
            <tr hlmTableRow [class.cursor-pointer]="unsaved()" [class.cursor-not-allowed]="!unsaved()">
              <td hlmTableCell class="truncate" (click)="useTemplate(template)">{{ template.name }}</td>
              <td hlmTableCell class="p-0">
                <button hlmBtn variant="ghost" size="icon-sm" class="
                  cursor-pointer hover:text-accent-foreground
                "
                  [hlmDropdownMenuTrigger]="menu"
                  [hlmDropdownMenuTriggerData]="{ $implicit: { template } }"
                >
                  <ng-icon name="lucideMoreVertical" />
                  <span class="sr-only">Open menu</span>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </section>


    <ng-template #menu let-ctx>
      <hlm-dropdown-menu>
        <button hlmDropdownMenuItem [disabled]="!unsaved()" (click)="useTemplate(ctx.template)">
          <ng-icon name="lucideReplace" />
          use
        </button>
        <button hlmDropdownMenuItem (click)="duplicate(ctx.template)">
          <ng-icon name="lucideCopy" />
          duplicate
        </button>
        <!-- <button hlmDropdownMenuItem (click)="useAdditionally(ctx.template)">
          <ng-icon name="lucideReplaceAll" />
          add additionally
        </button> -->

        <hlm-dropdown-menu-separator />

        <hlm-dropdown-menu-label class="flex items-center gap-2">
          <ng-icon name="lucideSquarePen" />
          rename
        </hlm-dropdown-menu-label>

        <hlm-field class="px-2">
          <hlm-button-group>
            <input #input hlmInput id="input-button-group" [value]="ctx.template.name"
              (keyup.enter)="rename(input.value, ctx.template)" />
            <button hlmBtn variant="outline" (click)="rename(input.value, ctx.template)">
              <ng-icon name="lucideSave" />
            </button>
          </hlm-button-group>
        </hlm-field>

        <hlm-dropdown-menu-separator class="my-3" />

        <button hlmDropdownMenuItem variant="destructive" (click)="delete(ctx.template)">
          <ng-icon name="lucideTrash" />
          delete
        </button>
      </hlm-dropdown-menu>
    </ng-template>
  `,
})
export class OrderTemplates implements AfterViewInit
{
  private readonly templateService = inject(TemplateService)
  private readonly orderService = inject(OrderService)

  public readonly orderItems = computed(() => this.orderService.currentOrder()?.items() || [])
  public readonly unsaved = computed(() => this.orderService.currentOrder()?.unsaved ?? false)

  private readonly _dialogRef = inject(BrnDialogRef)
  public readonly close = () => this._dialogRef.close()

  public readonly templates = this.templateService.templates

  public readonly search = signal("")
  public readonly targetTemplate = signal<Template | null>(null)
  public itemToString = (template: Template) => template?.name ?? ""

  public readonly autocompleteState = signal<"closed" | "open">("closed")



  ngAfterViewInit()
  {
    // auto open the autocomplete without user typing. delay is the dialog open animation duration
    setTimeout(() => this.autocompleteState.set("open"), 125)
  }



  readonly saveText = computed(() =>
  {
    if (this.targetTemplate())
      return "update existing template"

    if (this.search().length > 0)
      return "create new template"

    return "save template"
  })



  readonly canSave = computed(() =>
  {
    if (this.targetTemplate() || this.search().length > 0)
      return true

    return false
  })



  save(ctx: BrnDialogRef)
  {
    const orderItems = this.orderItems().map((item) => ({ ...item, delivered: 0, inDelivery: 0 }))

    const template: Template = {
      id: this.targetTemplate()?.id ?? crypto.randomUUID(),
      name: this.targetTemplate()?.name ?? (this.search() || "New Template"),
      items: orderItems,
    }

    this.templateService.saveTemplate(template)
    ctx.close()
  }



  delete(template: Template)
  {
    this.templateService.deleteTemplate(template.id)
  }



  rename(name: string, template: Template)
  {
    if (!name || name.length < 1)
      return toast.error("Template name too short", { duration: 10000 })

    if (name.length > 100)
      return toast.error("Template name too long (>100)", { duration: 10000 })

    const updatedTemplate: Template = {
      ...template,
      name,
    }
    this.templateService.saveTemplate(updatedTemplate)
    return
  }



  duplicate(template: Template)
  {
    const duplicatedTemplate: Template = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (copy)`,
    }
    this.templateService.saveTemplate(duplicatedTemplate)
  }



  public readonly filteredTemplates = computed(() =>
  {
    const search = this.search().toLowerCase()
    const templates = this.templates()

    return templates?.filter((template) => template.name.toLowerCase().includes(search)) || []
  })



  useTemplate(template: Template)
  {
    const order = this.orderService.currentOrder()
    if (!order || !order.unsaved)
      return

    order.items.set(JSON.parse(JSON.stringify(template.items)) as OrderItem[])
    this.orderService.updateSyncOrder(order)
  }



  // ToDo: shit is kaputt, not sure why. need to fix later
  // useAdditionally(template: Template)
  // {
  //   template.items.forEach((item) =>
  //   {
  //     for (item.quantity; item.quantity > 0; item.quantity--)
  //       this.orderService.addItemToOrder(item.id, item.priority)
  //   })
  // }
}
