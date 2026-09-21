import { ComponentFixture, TestBed } from "@angular/core/testing"

import { OrderPopover } from "./order-popover"

describe("OrderPopover", () =>
{
  let component: OrderPopover
  let fixture: ComponentFixture<OrderPopover>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [OrderPopover] })
      .compileComponents()

    fixture = TestBed.createComponent(OrderPopover)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
