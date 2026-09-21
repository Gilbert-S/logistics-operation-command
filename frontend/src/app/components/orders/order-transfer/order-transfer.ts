import { Component, computed, inject, signal, AfterViewInit } from "@angular/core"
import { HlmAutocompleteImports } from "@spartan-ng/helm/autocomplete"
import { HlmDialogImports } from "@spartan-ng/helm/dialog"
import { BaseService, Base } from "../../../services/base.service"
import { NgIcon, provideIcons } from "@ng-icons/core"
import { Order } from "@loc/types"
import { BrnDialogRef, injectBrnDialogContext } from "@spartan-ng/brain/dialog"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { lucideMoveRight } from "@ng-icons/lucide"
import { OrderService } from "../../../services/order.service"

@Component({
  imports: [HlmDialogImports, HlmAutocompleteImports, NgIcon, HlmButtonImports],
  providers: [provideIcons({ lucideMoveRight })],
  selector: "app-order-transfer",
  template: `

    <hlm-dialog-header>
      <h3 hlmDialogTitle>Transfer order to a new destination</h3>
    </hlm-dialog-header>

    <table class="mb-8">
      <tr>
        <td class="w-[50%] py-5 text-sm text-muted-foreground">Current destination</td>
        <td class="w-5"></td>
        <td class="w-[50%] py-5 text-right text-sm text-muted-foreground">New destination</td>
      </tr>
      <tr>
        <td>
          <div class="flex items-center gap-4 leading-none">
            <span class="rounded-sm border border-border bg-secondary p-1">
              <img alt="Marker Icon" class="size-9 shrink-0 grow-0" [src]="sourceBase()?.iconUrl()"/>
            </span>
            <div class="grow">
              {{sourceBaseName()}}
              <p class="text-sm text-muted-foreground">{{ sourceBaseType() }}</p>
            </div>
          </div>
        </td>

        <td><ng-icon name="lucideMoveRight" size="20px" strokeWidth="1"/></td>

        <td>
          @if(targetBase())
          {
            <div class="flex items-center gap-4 leading-none">
              <div class="grow text-right">
                {{targetBaseName()}}
                <p class="text-sm text-muted-foreground">{{ targetBaseType() }}</p>
              </div>
              <span class="rounded-sm border border-border bg-secondary p-1">
                <img alt="Marker Icon" class="size-9 shrink-0 grow-0" [src]="targetBase()?.iconUrl()"/>
              </span>
            </div>
          }
        </td>
    </table>


    <hlm-autocomplete autoHighlight [itemToString]="itemToString" [state]="autocompleteState()" [(value)]="targetBase" [(search)]="search">

      <hlm-autocomplete-input placeholder="Search a base or map icon"/>

      <hlm-autocomplete-content *hlmAutocompletePortal>
        <hlm-autocomplete-empty>Not found</hlm-autocomplete-empty>
        <div hlmAutocompleteList>
            <div hlmAutocompleteGroup>

              <div hlmAutocompleteLabel>Operation Bases</div>
              @for (base of opsBaseList(); track $index) {
                <hlm-autocomplete-item class="flex flex-row gap-2" [value]="base">
                  <img alt="Marker Icon" class="size-6" [src]="base.iconUrl()"/>
                  <div class="flex flex-col">
                    <span>{{ base.name() }}</span>
                    <span class="text-muted-foreground">
                      {{ base.baseType?.() }}
                    </span>
                  </div>
                </hlm-autocomplete-item>
              }
              </div>
              <div hlmAutocompleteGroup>
              <div hlmAutocompleteLabel>Map Icons</div>
              @for (base of mapIconList(); track $index) {
                <hlm-autocomplete-item class="flex flex-row gap-2" [value]="base">
                  <img alt="Marker Icon" class="size-6" [src]="base.iconUrl()"/>
                  <div class="flex flex-col">
                    <span>{{ base.name() }}</span>
                    <span class="text-muted-foreground">
                      {{ base.iconName }} - {{ base.region }}
                    </span>
                  </div>
                </hlm-autocomplete-item>
              }
            </div>
        </div>
      </hlm-autocomplete-content>
    </hlm-autocomplete>

    <hlm-dialog-footer>
      <button hlmBtn variant="ghost" (click)="close()">Cancel</button>
      <button hlmBtn [disabled]="!targetBase()" (click)="transfer()">Transfer</button>
    </hlm-dialog-footer>
  `,

  host: { class: "flex flex-col gap-4 w-full overflow-hidden" },
})
export class OrderTransfer implements AfterViewInit
{
  private readonly _dialogContext = injectBrnDialogContext<{ order: Order }>()
  private readonly _dialogRef = inject(BrnDialogRef)
  public readonly close = () => this._dialogRef.close()
  private readonly orderService = inject(OrderService)

  protected order = this._dialogContext.order
  protected baseService = inject(BaseService)

  public readonly autocompleteState = signal<"closed" | "open">("closed")

  ngAfterViewInit()
  {
    // auto open the autocomplete without user typing. delay is the dialog open animation duration
    setTimeout(() => this.autocompleteState.set("open"), 125)
  }




  public readonly sourceBase = computed(() => this.baseService.getBase(this.order.markerId))
  public readonly sourceBaseName = computed(() => this.sourceBase()?.name() || "(unnamed)")
  public readonly sourceBaseType =
    computed(() => this.sourceBase()?.iconName || this.sourceBase()?.baseType?.() || "")





  public readonly search = signal("")
  public readonly targetBase = signal<Base | null>(null)
  public readonly targetBaseName = computed(() => this.targetBase()?.name() || "(unnamed)")
  public readonly targetBaseType =
    computed(() => this.targetBase()?.iconName || this.targetBase()?.baseType?.() || "")



  public itemToString = () => ""

  transfer()
  {
    const targetMarkerId = this.targetBase()?.id
    if (!targetMarkerId)
      return

    this.orderService.transferOrder(this.order.id, targetMarkerId)
    this.close()
  }



  public readonly opsBaseList = computed(() =>
  {
    const search = this.search().toLowerCase()
    const baseList = this.baseService.baseList()

    return baseList.filter((base) =>
      base.baseClass === "OpsBase" &&
        (
          base.name().toLowerCase().includes(search) ||
          base.baseType?.().toLowerCase().includes(search)
        ))
  })



  public readonly mapIconList = computed(() =>
  {
    const search = this.search().toLowerCase()
    const baseList = this.baseService.baseList()
    return baseList.filter((base) => base.baseClass === "MapIcon" && base.name() &&
      (
        base.name().toLowerCase().includes(search) ||
        base.iconName?.toLowerCase().includes(search) ||
        base.id.toLowerCase().includes(search)
      ))
      .map((base) => ({ ...base, region: base.id.split(".")[0].replace("Hex", "") }))
  })
}
