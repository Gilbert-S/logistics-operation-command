import { TestBed } from "@angular/core/testing"

import { ContextMenu } from "./context-menu"

describe("ContextMenu", () =>
{
  let service: ContextMenu

  beforeEach(() =>
  {
    TestBed.configureTestingModule({})
    service = TestBed.inject(ContextMenu)
  })

  it("should be created", () =>
  {
    expect(service).toBeTruthy()
  })
})
