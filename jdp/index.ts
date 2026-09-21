import * as jsondiffpatch from "jsondiffpatch"


export const jdp = jsondiffpatch.create({

  arrays: {
    detectMove: false,
    includeValueOnMove: false,
  },

  omitRemovedValues: false,

  objectHash: function (obj)
  {
    if ("x" in obj && "y" in obj)
      return `${obj.x as string},${obj.y as string}`

    if ("id" in obj)
      return `${obj.id as string}`

    if ("itemId" in obj)
      return `${obj.itemId as string}`

    return
  },
})


export type Delta = jsondiffpatch.Delta
export default jdp