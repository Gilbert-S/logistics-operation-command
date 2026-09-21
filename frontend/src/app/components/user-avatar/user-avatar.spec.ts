import { ComponentFixture, TestBed } from "@angular/core/testing"

import { UserAvatar } from "./user-avatar"

describe("UserAvatar", () =>
{
  let component: UserAvatar
  let fixture: ComponentFixture<UserAvatar>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [UserAvatar] })
      .compileComponents()

    fixture = TestBed.createComponent(UserAvatar)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
