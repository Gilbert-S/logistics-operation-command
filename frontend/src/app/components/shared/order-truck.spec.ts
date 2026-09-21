import { ComponentFixture, TestBed } from "@angular/core/testing"

import { OrderTruck } from "./order-truck"

describe("OrderTruck", () =>
{
  let component: OrderTruck
  let fixture: ComponentFixture<OrderTruck>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [OrderTruck] })
      .compileComponents()

    fixture = TestBed.createComponent(OrderTruck)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
