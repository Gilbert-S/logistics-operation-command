import { ComponentFixture, TestBed } from "@angular/core/testing"

import { AppRoot } from "./app-root"

describe("AppRoot", () =>
{
  let component: AppRoot
  let fixture: ComponentFixture<AppRoot>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [AppRoot] })
      .compileComponents()

    fixture = TestBed.createComponent(AppRoot)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
