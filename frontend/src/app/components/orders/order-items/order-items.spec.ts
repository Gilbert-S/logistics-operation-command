import { ComponentFixture, TestBed } from "@angular/core/testing"

import { OrderItems } from "./order-items"

describe("OrderItems", () =>
{
  let component: OrderItems
  let fixture: ComponentFixture<OrderItems>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [OrderItems] })
      .compileComponents()

    fixture = TestBed.createComponent(OrderItems)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
