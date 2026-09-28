import { ConnectedPosition, Overlay, OverlayRef } from "@angular/cdk/overlay"
import { ComponentPortal } from "@angular/cdk/portal"
import { Directive, ElementRef, OnDestroy, inject, input } from "@angular/core"
import { ItemHoverCard } from "../components/item-hover-card/item-hover-card"
import { Item } from "../config/items"





const PREVIEW_POSITIONS: ConnectedPosition[] = [
  { offsetY: 5, originX: "center", originY: "bottom", overlayX: "center", overlayY: "top" },
  { offsetY: -5, originX: "center", originY: "top", overlayX: "center", overlayY: "bottom" },
  { offsetX: 5, originX: "end", originY: "center", overlayX: "start", overlayY: "center" },
  { offsetX: -5, originX: "start", originY: "center", overlayX: "end", overlayY: "center" },
]

const SHOW_DELAY_MS = 600
const HIDE_DELAY_MS = 150





@Directive({
  selector: "[appFoxholeItemHovercard]",
  host: {
    "(click)": "onTriggerClick()",
    "(mouseenter)": "onTriggerEnter()",
    "(mouseleave)": "onTriggerLeave()",
  },
})
export class FoxholeItemHovercard implements OnDestroy
{
  readonly appFoxholeItemHovercard = input.required<Item>()

  private readonly overlay = inject(Overlay)
  private readonly elementRef = inject(ElementRef<HTMLElement>)

  private overlayRef: OverlayRef | null = null
  private overlayAbortController: AbortController | null = null
  private showTimeoutId: ReturnType<typeof setTimeout> | null = null
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null

  onTriggerEnter()
  {
    this.clearHideTimeout()
    this.clearShowTimeout()

    if (this.overlayRef?.hasAttached())
      return

    this.showTimeoutId = setTimeout(() => this.show(), SHOW_DELAY_MS)
  }

  onTriggerLeave()
  {
    this.clearShowTimeout()
    this.scheduleHide()
  }

  onTriggerClick()
  {
    this.clearShowTimeout()
    this.clearHideTimeout()
    this.hide()
  }

  ngOnDestroy()
  {
    this.clearShowTimeout()
    this.clearHideTimeout()
    this.overlayAbortController?.abort()
    this.overlayRef?.dispose()
    this.overlayRef = null
  }

  private show()
  {
    const overlayRef = this.overlayRef ??= this.createOverlay()
    if (overlayRef.hasAttached())
      return

    const componentRef = overlayRef.attach(new ComponentPortal(ItemHoverCard))
    componentRef.setInput("item", this.appFoxholeItemHovercard())
  }

  private hide()
  {
    this.overlayRef?.detach()
  }

  private scheduleHide()
  {
    this.clearHideTimeout()
    this.hideTimeoutId = setTimeout(() => this.hide(), HIDE_DELAY_MS)
  }

  private clearShowTimeout()
  {
    if (this.showTimeoutId === null)
      return
    clearTimeout(this.showTimeoutId)
    this.showTimeoutId = null
  }

  private clearHideTimeout()
  {
    if (this.hideTimeoutId === null)
      return
    clearTimeout(this.hideTimeoutId)
    this.hideTimeoutId = null
  }

  private createOverlay(): OverlayRef
  {
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(PREVIEW_POSITIONS)
      .withPush(true)

    const overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    })

    // Keep the preview open while the pointer is over it, so its contents stay interactive
    // (hoverable/selectable), and only schedule a close once the pointer leaves it too.
    this.overlayAbortController = new AbortController()
    const { signal } = this.overlayAbortController
    const { overlayElement } = overlayRef
    overlayElement.addEventListener("mouseenter", () => this.clearHideTimeout(), { signal })
    overlayElement.addEventListener("mouseleave", () => this.scheduleHide(), { signal })

    return overlayRef
  }
}
