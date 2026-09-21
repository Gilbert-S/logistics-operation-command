import { ComponentFixture, TestBed } from "@angular/core/testing"

import { DeliveryItems } from "./delivery-items"

describe("DeliveryItems", () =>
{
  let component: DeliveryItems
  let fixture: ComponentFixture<DeliveryItems>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [DeliveryItems] })
      .compileComponents()

    fixture = TestBed.createComponent(DeliveryItems)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
