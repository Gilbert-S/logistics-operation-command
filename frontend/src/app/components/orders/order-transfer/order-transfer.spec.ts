import { ComponentFixture, TestBed } from "@angular/core/testing"

import { OrderTransfer } from "./order-transfer"

describe("OrderTransfer", () =>
{
  let component: OrderTransfer
  let fixture: ComponentFixture<OrderTransfer>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [OrderTransfer] })
      .compileComponents()

    fixture = TestBed.createComponent(OrderTransfer)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
