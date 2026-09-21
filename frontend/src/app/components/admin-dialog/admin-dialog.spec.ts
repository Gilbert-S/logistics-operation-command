import { ComponentFixture, TestBed } from "@angular/core/testing"

import { AdminDialog } from "./admin-dialog"

describe("AdminDialog", () =>
{
  let component: AdminDialog
  let fixture: ComponentFixture<AdminDialog>

  beforeEach(async () =>
  {
    await TestBed.configureTestingModule({ imports: [AdminDialog] })
      .compileComponents()

    fixture = TestBed.createComponent(AdminDialog)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it("should create", () =>
  {
    expect(component).toBeTruthy()
  })
})
