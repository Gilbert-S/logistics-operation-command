import { Component, signal } from "@angular/core"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { Item } from "../config/items"
import { FoxholeItemHovercard } from "./foxhole-item-hovercard"

const SHOW_DELAY_MS = 600
const HIDE_DELAY_MS = 150

const mockItem: Item = {
  bIsLarge: false,
  ChassisName: null,
  CodeName: "TestItem",
  Description: "A test item",
  DisplayName: "Test Item",
  EquipmentSlot: null,
  FactionVariant: null,
  Icon: "TestIcon.png",
  ItemCategory: null,
  ItemDynamicData: {
    CostPerCrate: [],
    CrateProductionTime: 0,
    CrateRetrieveTime: 0,
    QuantityPerCrate: 1,
    ResearchLevel: 0,
    SingleRetrieveTime: 0,
  },
}

@Component({
  imports: [FoxholeItemHovercard],
  template: `@if (show()) { <img alt [appFoxholeItemHovercard]="item"/> }`,
})
class TestHost
{
  readonly item = mockItem
  readonly show = signal(true)
}

const overlayPaneCount = () => document.querySelectorAll(".cdk-overlay-pane").length
const overlayPane = () => document.querySelector(".cdk-overlay-pane")

describe("ItemHoverPreview", () =>
{
  let fixture: ComponentFixture<TestHost>
  let img: HTMLImageElement
  let baselinePaneCount: number

  beforeEach(async () =>
  {
    vi.useFakeTimers()

    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents()

    fixture = TestBed.createComponent(TestHost)
    fixture.detectChanges()
    img = (fixture.nativeElement as HTMLElement).querySelector("img")!
    baselinePaneCount = overlayPaneCount()
  })

  afterEach(() =>
  {
    fixture.destroy()
    vi.useRealTimers()
  })

  it("creates no overlay until the trigger is hovered", () =>
  {
    expect(baselinePaneCount).toBe(0)
    expect(overlayPaneCount()).toBe(baselinePaneCount)
  })

  it("does not show the preview immediately on hover", () =>
  {
    img.dispatchEvent(new Event("mouseenter"))
    fixture.detectChanges()

    expect(overlayPaneCount()).toBe(baselinePaneCount)

    vi.advanceTimersByTime(SHOW_DELAY_MS - 1)
    fixture.detectChanges()
    expect(overlayPaneCount()).toBe(baselinePaneCount)
  })

  it("shows the preview after the show delay and populates the item", () =>
  {
    img.dispatchEvent(new Event("mouseenter"))
    fixture.detectChanges()

    vi.advanceTimersByTime(SHOW_DELAY_MS)
    fixture.detectChanges()

    expect(overlayPaneCount()).toBe(baselinePaneCount + 1)
    expect(document.body.textContent).toContain(mockItem.DisplayName)
  })

  it("cancels showing if the pointer leaves before the show delay elapses", () =>
  {
    img.dispatchEvent(new Event("mouseenter"))
    fixture.detectChanges()

    img.dispatchEvent(new Event("mouseleave"))
    fixture.detectChanges()

    vi.advanceTimersByTime(SHOW_DELAY_MS)
    fixture.detectChanges()

    expect(overlayPaneCount()).toBe(baselinePaneCount)
  })

  it("detaches (but keeps the overlay reusable) after the pointer leaves the trigger", () =>
  {
    img.dispatchEvent(new Event("mouseenter"))
    vi.advanceTimersByTime(SHOW_DELAY_MS)
    fixture.detectChanges()
    expect(overlayPaneCount()).toBe(baselinePaneCount + 1)

    img.dispatchEvent(new Event("mouseleave"))
    vi.advanceTimersByTime(HIDE_DELAY_MS)
    fixture.detectChanges()
    expect(overlayPaneCount()).toBe(baselinePaneCount)

    img.dispatchEvent(new Event("mouseenter"))
    vi.advanceTimersByTime(SHOW_DELAY_MS)
    fixture.detectChanges()
    expect(overlayPaneCount()).toBe(baselinePaneCount + 1)
  })

  it("stays open and interactive while the pointer moves onto the preview itself", () =>
  {
    img.dispatchEvent(new Event("mouseenter"))
    vi.advanceTimersByTime(SHOW_DELAY_MS)
    fixture.detectChanges()
    expect(overlayPaneCount()).toBe(baselinePaneCount + 1)

    // Pointer leaves the trigger on its way to the preview...
    img.dispatchEvent(new Event("mouseleave"))
    // ...but reaches the preview before the hide delay elapses.
    overlayPane()!.dispatchEvent(new Event("mouseenter"))
    vi.advanceTimersByTime(HIDE_DELAY_MS)
    fixture.detectChanges()

    expect(overlayPaneCount()).toBe(baselinePaneCount + 1)
  })

  it("closes once the pointer leaves the preview itself", () =>
  {
    img.dispatchEvent(new Event("mouseenter"))
    vi.advanceTimersByTime(SHOW_DELAY_MS)
    fixture.detectChanges()

    img.dispatchEvent(new Event("mouseleave"))
    overlayPane()!.dispatchEvent(new Event("mouseenter"))
    overlayPane()!.dispatchEvent(new Event("mouseleave"))
    vi.advanceTimersByTime(HIDE_DELAY_MS)
    fixture.detectChanges()

    expect(overlayPaneCount()).toBe(baselinePaneCount)
  })

  it("hides immediately on click, without waiting for the hide delay", () =>
  {
    img.dispatchEvent(new Event("mouseenter"))
    vi.advanceTimersByTime(SHOW_DELAY_MS)
    fixture.detectChanges()
    expect(overlayPaneCount()).toBe(baselinePaneCount + 1)

    img.dispatchEvent(new Event("click"))
    fixture.detectChanges()

    expect(overlayPaneCount()).toBe(baselinePaneCount)
  })

  it("disposes the overlay when the trigger is destroyed", () =>
  {
    img.dispatchEvent(new Event("mouseenter"))
    vi.advanceTimersByTime(SHOW_DELAY_MS)
    fixture.detectChanges()
    expect(overlayPaneCount()).toBe(baselinePaneCount + 1)

    fixture.componentInstance.show.set(false)
    fixture.detectChanges()

    expect(overlayPaneCount()).toBe(baselinePaneCount)
  })

  it("does not accumulate overlay panes across repeated open/close cycles", () =>
  {
    for (let i = 0; i < 10; i++)
    {
      img.dispatchEvent(new Event("mouseenter"))
      vi.advanceTimersByTime(SHOW_DELAY_MS)
      fixture.detectChanges()
      img.dispatchEvent(new Event("mouseleave"))
      vi.advanceTimersByTime(HIDE_DELAY_MS)
      fixture.detectChanges()
    }

    expect(overlayPaneCount()).toBe(baselinePaneCount)
  })
})
