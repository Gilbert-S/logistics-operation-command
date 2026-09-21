import { BasePipe } from "./base-pipe"

describe("BasePipe", () =>
{
  it("create an instance", () =>
  {
    const pipe = new BasePipe()
    expect(pipe).toBeTruthy()
  })
})
