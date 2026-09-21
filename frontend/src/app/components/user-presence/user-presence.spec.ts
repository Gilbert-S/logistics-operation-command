import { ComponentFixture, TestBed } from "@angular/core/testing"

import { UserPresence } from "./user-presence"

describe("UserPresence", () =>
{
  let component: UserPresence
  let fixture: ComponentFixture<UserPresence>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [UserPresence] })
      .compileComponents()

    fixture = TestBed.createComponent(UserPresence)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
