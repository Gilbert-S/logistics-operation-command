import { ComponentFixture, TestBed } from "@angular/core/testing"

import { ItemVariant } from "./item-variant"

describe("ItemVariant", () =>
{
  let component: ItemVariant
  let fixture: ComponentFixture<ItemVariant>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [ItemVariant] })
      .compileComponents()

    fixture = TestBed.createComponent(ItemVariant)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
