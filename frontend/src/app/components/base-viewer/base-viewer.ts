import { Component, computed, inject, signal, AfterViewInit }
  from "@angular/core"
import { HlmButtonImports } from "@spartan-ng/helm/button"
import { HlmCardImports } from "@spartan-ng/helm/card"
import { HlmInputImports } from "@spartan-ng/helm/input"
import { HlmLabelImports } from "@spartan-ng/helm/label"
import { HlmToggleGroupImports } from "@spartan-ng/helm/toggle-group"
import { FormsModule } from "@angular/forms"
import { HlmSelectImports } from "@spartan-ng/helm/select"
import { NgIcon, provideIcons } from "@ng-icons/core"
import {
  lucideArrowDownFromLine, lucideArrowLeftFromLine, lucideArrowRightFromLine, lucideArrowUpFromLine,
  lucideCircleX, lucideLocateFixed, lucideShoppingCart, lucideTrash2,
} from "@ng-icons/lucide"
import { HlmPopoverImports } from "@spartan-ng/helm/popover"
import { OrderService } from "../../services/order.service"
import { BaseService, BASE_TYPES } from "../../services/base.service"
import { HlmTooltipImports } from "@spartan-ng/helm/tooltip"
import { OpsbaseIconPipe } from "../../pipes/opsbase-icon-pipe"





@Component({
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmLabelImports,
    HlmPopoverImports,
    HlmSelectImports,
    HlmToggleGroupImports,
    HlmTooltipImports,
    NgIcon,
    OpsbaseIconPipe,
  ],
  providers: [
    provideIcons({
      lucideArrowDownFromLine,
      lucideArrowLeftFromLine,
      lucideArrowRightFromLine,
      lucideArrowUpFromLine,
      lucideCircleX,
      lucideLocateFixed,
      lucideShoppingCart,
      lucideTrash2,
    }),
  ],
  selector: "app-base-viewer",
  template: `

    <div #PopoverAnchor class="absolute top-0 right-0 size-0 translate-y-3"></div>

    <hlm-popover autoFocus="false" align="start" clo class="hidden" [state]="state()"
      [attachTo]="PopoverAnchor" (closed)="onClose()">

      <button hlmPopoverTrigger>

      </button>

      <hlm-popover-content *hlmPopoverPortal="let ctx" class="
        h-full min-w-100 rounded-sm outline-4 outline-white/30 outline-solid
      ">
        @if(base()) {
        <section class="relative m-0 w-full rounded-sm shadow-none ring-0" hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle class="truncate">{{base()?.name() || "(unnamed)"}}</h3>
            <p hlmCardDescription class="truncate">{{ base()?.baseType() }}</p>

            <div hlmCardAction class="">
                <hlm-select hlmTooltipTrigger="change base type" showDelay="700" [(value)]="base()!.baseType">
                  <hlm-select-trigger class="
                    w-11 [&>button]:h-11! [&>button]:border-border [&>button]:p-1
                    [&>button>ng-icon]:hidden
                  ">
                    <ng-template hlmSelectValueTemplate>
                      <img class="" [src]="base()?.iconUrl()" [alt]="base()?.iconType"/>
                    </ng-template>
                  </hlm-select-trigger>

                  <hlm-select-content *hlmSelectPortal class="w-62">
                    @for (type of baseType; track $index) {
                      <hlm-select-item [value]="type">
                        <img alt="{{ type }}" class="h-6" [src]="type | opsbaseIcon: base()?.team()!"/>
                        {{ type }}
                      </hlm-select-item>
                    }
                  </hlm-select-content>
                </hlm-select>

            </div>
          </div>

          <div hlmCardContent>
            <form>
              <div class="flex flex-col gap-3">

                <hlm-toggle-group type="single" nullable="false" variant="outline" class="w-full" [(value)]="base()!.team">

                  <button hlmToggleGroupItem value="WARDENS"
                    aria-label="Toggle Wardens" class="grow">
                    <img src="/images/logoWarden64.png" alt="Wardens" class="h-full"/>
                  </button>

                  <button hlmToggleGroupItem value="NONE"
                    aria-label="Toggle None" class="grow">
                    <img src="/images/MapIconVictory.png" alt="None" class="h-full"/>
                  </button>

                  <button hlmToggleGroupItem value="COLONIALS"
                    aria-label="Toggle Colonials" class="grow">
                    <img src="/images/logoColonial64.png" alt="Colonials" class="h-full"/>
                  </button>

                </hlm-toggle-group>

                <input type="text" placeholder="Name" hlmInput name="name"
                  maxlength="25"  [(ngModel)]="base()!.name"/>

                <div class="mt-5 flex flex-row justify-evenly gap-2">
                  <div class="flex flex-col items-center justify-between gap-1">
                    <span class="text-muted-foreground">Name Position:</span>
                    <div class="grid w-fit grid-cols-3 grid-rows-3 gap-0">

                      <img class="
                        col-start-2 col-end-2 row-start-2 row-end-2 size-6 rounded-xs bg-input
                      " [src]="base()?.iconUrl()"
                        [alt]="base()?.iconType"/>

                      <button hlmBtn size="icon-xs" class="
                        col-start-2 col-end-2 row-start-1 row-end-1 cursor-pointer
                      " [variant]="base()!.namePosition() === 'top' ? 'default' : 'outline'"
                        [disabled]="base()!.orderIndicatorPosition() === 'top'"
                        (click)="base()!.namePosition.set('top')">
                        <ng-icon name="lucideArrowUpFromLine" class=""/>
                      </button>
                      <button hlmBtn size="icon-xs" class="
                        col-start-2 col-end-2 row-start-3 row-end-3 cursor-pointer
                      " [variant]="base()!.namePosition() === 'bottom' ? 'default' : 'outline'"
                        [disabled]="base()!.orderIndicatorPosition() === 'bottom'"
                        (click)="base()!.namePosition.set('bottom')">
                        <ng-icon name="lucideArrowDownFromLine" class=""/>
                      </button>
                      <button hlmBtn size="icon-xs" class="
                        col-start-1 col-end-1 row-start-2 row-end-2 cursor-pointer
                      " [variant]="base()!.namePosition() === 'left' ? 'default' : 'outline'"
                        [disabled]="base()!.orderIndicatorPosition() === 'left'"
                        (click)="base()!.namePosition.set('left')">
                        <ng-icon name="lucideArrowLeftFromLine" class=""/>
                      </button>
                      <button hlmBtn size="icon-xs" class="
                        col-start-3 col-end-3 row-start-2 row-end-2 cursor-pointer
                      " [variant]="base()!.namePosition() === 'right' ? 'default' : 'outline'"
                        [disabled]="base()!.orderIndicatorPosition() === 'right'"
                        (click)="base()!.namePosition.set('right')">
                        <ng-icon name="lucideArrowRightFromLine" class=""/>
                      </button>

                    </div>
                  </div>

                  <div class="flex flex-col items-center justify-between gap-1">
                    <span class="text-muted-foreground">Order Indicator:</span>
                    <div class="grid w-fit grid-cols-3 grid-rows-3 gap-0">

                      <img class="
                        col-start-2 col-end-2 row-start-2 row-end-2 size-6 rounded-xs bg-input
                      " [src]="base()?.iconUrl()"
                        [alt]="base()?.iconType"/>

                      <button hlmBtn size="icon-xs" class="
                        col-start-2 col-end-2 row-start-1 row-end-1 cursor-pointer
                      " [variant]="base()!.orderIndicatorPosition() === 'top' ? 'default' : 'outline'"
                        [disabled]="base()!.namePosition() === 'top'"
                        (click)="base()!.orderIndicatorPosition.set('top')">
                        <ng-icon name="lucideArrowUpFromLine" class=""/>
                      </button>
                      <button hlmBtn size="icon-xs" class="
                        col-start-2 col-end-2 row-start-3 row-end-3 cursor-pointer
                      " [variant]="base()!.orderIndicatorPosition() === 'bottom' ? 'default' : 'outline'"
                        [disabled]="base()!.namePosition() === 'bottom'"
                        (click)="base()!.orderIndicatorPosition.set('bottom')">
                        <ng-icon name="lucideArrowDownFromLine" class=""/>
                      </button>
                      <button hlmBtn size="icon-xs" class="
                        col-start-1 col-end-1 row-start-2 row-end-2 cursor-pointer
                      " [variant]="base()!.orderIndicatorPosition() === 'left' ? 'default' : 'outline'"
                        [disabled]="base()!.namePosition() === 'left'"
                        (click)="base()!.orderIndicatorPosition.set('left')">
                        <ng-icon name="lucideArrowLeftFromLine" class=""/>
                      </button>
                      <button hlmBtn size="icon-xs" class="
                        col-start-3 col-end-3 row-start-2 row-end-2 cursor-pointer
                      " [variant]="base()!.orderIndicatorPosition() === 'right' ? 'default' : 'outline'"
                        [disabled]="base()!.namePosition() === 'right'"
                        (click)="base()!.orderIndicatorPosition.set('right')">
                        <ng-icon name="lucideArrowRightFromLine" class=""/>
                      </button>

                    </div>
                  </div>

                </div>



              </div>
            </form>
          </div>

          <!-- <div hlmCardContent>
            <app-order-list [markerId]="base()?.id"/>
          </div> -->

          <div hlmCardFooter class="mt-10 flex-row justify-around gap-2">

            <hlm-popover #popover="brnPopover">
              <button hlmBtn variant="destructive" size="default" class="cursor-pointer" hlmPopoverTrigger
                hlmTooltipTrigger="delete base" showDelay="700">
                <ng-icon name="lucideTrash2"/>
                Delete Base
              </button>
              <div *hlmPopoverPortal="let ctx" hlmPopoverContent >
                <p class="mb-4">Confirm deletion.</p>
                <div class="flex flex-row justify-between gap-2">
                  <button hlmBtn variant="ghost" (click)="popover.close()">Cancel</button>
                  <button hlmBtn variant="destructive" (click)="deleteOpsBase()">
                    <ng-icon name="lucideTrash2"/>
                    Delete Base
                  </button>
                </div>
              </div>
            </hlm-popover>

            <button hlmBtn type="submit" size="default" class="cursor-pointer" hlmTooltipTrigger="create a new order for this base"
              showDelay="700" (click)="newOrder(base()!.id)">
              <ng-icon name="lucideShoppingCart" class=""/>
              New Order
            </button>


          </div>
        </section>
        }
      </hlm-popover-content>
    </hlm-popover>



  `,

  styles: `
    :host { display: contents }

    hlm-toggle-group {
      button:nth-child(1) { --accent: #235683 }
      button:nth-child(2) { --accent: #fff4   }
      button:nth-child(3) { --accent: #516c4b }
    }

    hlm-select-trigger {
      --input: var(--color-gray-400);
    }
  `,
})
export class BaseViewer implements AfterViewInit
{
  private baseService = inject(BaseService)
  base = this.baseService.editingBase

  readonly state = computed(() => this.base() && this.loaded() ? "open" : "closed")
  private readonly loaded = signal(false)

  ngAfterViewInit()
  {
    this.loaded.set(true)
  }



  public onClosed = () => this.baseService.editingBase.set(null)


  public baseType = BASE_TYPES




  protected newOrder = inject(OrderService).newOrder



  deleteOpsBase()
  {
    this.baseService.deleteOpsBase(this.base())
    this.baseService.editingBase.set(null)
  }

  onClose()
  {
    this.baseService.editingBase.set(null)
  }

}
