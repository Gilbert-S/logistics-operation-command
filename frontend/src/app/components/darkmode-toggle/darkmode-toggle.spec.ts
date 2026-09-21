import { ComponentFixture, TestBed } from "@angular/core/testing"

import { DarkmodeToggle } from "./darkmode-toggle"

describe("DarkmodeToggle", () =>
{
  let component: DarkmodeToggle
  let fixture: ComponentFixture<DarkmodeToggle>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [DarkmodeToggle] })
      .compileComponents()

    fixture = TestBed.createComponent(DarkmodeToggle)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
