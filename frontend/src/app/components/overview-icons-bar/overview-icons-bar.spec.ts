import { ComponentFixture, TestBed } from "@angular/core/testing"

import { OverviewIconsBar } from "./overview-icons-bar"

describe("OverviewIconsBar", () =>
{
  let component: OverviewIconsBar
  let fixture: ComponentFixture<OverviewIconsBar>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [OverviewIconsBar] })
      .compileComponents()

    fixture = TestBed.createComponent(OverviewIconsBar)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
