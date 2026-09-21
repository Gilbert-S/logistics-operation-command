import { ComponentFixture, TestBed } from "@angular/core/testing"

import { OrderItem } from "./order-item"

describe("OrderItem", () =>
{
  let component: OrderItem
  let fixture: ComponentFixture<OrderItem>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [OrderItem] })
      .compileComponents()

    fixture = TestBed.createComponent(OrderItem)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
