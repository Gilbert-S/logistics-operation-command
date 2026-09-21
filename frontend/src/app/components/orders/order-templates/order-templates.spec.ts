import { ComponentFixture, TestBed } from "@angular/core/testing"

import { OrderTemplates } from "./order-templates"

describe("OrderTemplates", () =>
{
  let component: OrderTemplates
  let fixture: ComponentFixture<OrderTemplates>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [OrderTemplates] })
      .compileComponents()

    fixture = TestBed.createComponent(OrderTemplates)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
