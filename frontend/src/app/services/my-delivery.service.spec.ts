import { TestBed } from "@angular/core/testing"

import { MyDeliveryService } from "./my-delivery.service"

describe("MyDelivery", () =>
{
  let service: MyDeliveryService

  beforeEach(() =>
  {
    TestBed.configureTestingModule({})
    service = TestBed.inject(MyDeliveryService)
  })

  it("should be created", () =>
  {
    expect(service).toBeTruthy()
  })
})
