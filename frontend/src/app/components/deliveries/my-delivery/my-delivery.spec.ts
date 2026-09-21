import { ComponentFixture, TestBed } from "@angular/core/testing"

import { MyDelivery } from "./my-delivery"

describe("MyDelivery", () =>
{
  let component: MyDelivery
  let fixture: ComponentFixture<MyDelivery>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [MyDelivery] })
      .compileComponents()

    fixture = TestBed.createComponent(MyDelivery)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
