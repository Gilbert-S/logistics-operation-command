import { SignalPipe } from "./signal-pipe"

describe("SignalPipe", () =>
{
  it("create an instance", () =>
  {
    const pipe = new SignalPipe()
    expect(pipe).toBeTruthy()
  })
})
