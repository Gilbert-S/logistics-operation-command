import * as Leaflet from "leaflet"

/* eslint-disable @stylistic/key-spacing */
/* eslint-disable @stylistic/no-multi-spaces */
/* eslint-disable @stylistic/max-len */

/*  flat topped hexes in a axial hex-grid coordinate system
                                                   ______
                                                  /      \
                                                 /  q     \
                                                 \     r  /
                                                  \______/

                                                   ______
                                                  /      \
                                           ______/  0     \______
                                          /      \     3  /      \
                   ______          ______/ -1     \______/  1     \______
                  /      \        /      \     3  /      \     2  /      \
           ______/ -4     \______/ -2     \______/  0     \______/  2     \______
          /      \     4  /      \     3  /      \     2  /      \     1  /      \
   ______/ -5     \______/ -3     \______/ -1     \______/  1     \______/  3     \______
  /      \     4  /      \     3  /      \     2  /      \     1  /      \     0  /      \
 / -6     \______/ -4     \______/ -2     \______/  0     \______/  2     \______/  4     \______
 \     4  /      \     3  /      \     2  /      \     1  /      \     0  /      \    -1  /      \
  \______/ -5     \______/ -3     \ _____/ -1     \______/  1     \______/  3     \______/  5     \
         \     3  /      \     2  /      \     1  /      \     0  /      \    -1  /      \    -2  /
          \______/ -4     \______/ -2     \______/  0     \______/  2     \______/  4     \______/
          /      \     2  /      \     1  /      \     0  /      \    -1  /      \    -2  /      \
         / -5     \______/ -3     \______/ -1     \______/  1     \______/  3     \______/  5     \______
         \     2  /      \     1  /      \     0  /      \    -1  /      \    -2  /      \    -3  /      \
          \______/ -4     \______/ -2     \______/  0     \______/  2     \______/  4     \______/  6     \
                 \     1  /      \     0  /      \    -1  /      \    -2  /      \    -3  /      \    -4  /
                  \______/ -3     \______/ -1     \______/  1     \______/  3     \______/  5     \______/
                         \     0  /      \    -1  /      \    -2  /      \    -3  /      \    -4  /
                          \______/ -2     \______/  0     \______/  2     \______/  4     \______/
                                 \    -1  /      \    -2  /      \    -3  /      \    -4  /
                                  \______/ -1     \______/  1     \______/        \______/
                                         \    -2  /      \    -3  /
                                          \______/  0     \______/
                                                 \    -3  /
                                                  \______/

*/

export const regions: Region[] = [
  { id: "AcrithiaHex",         name: "Acrithia",           q:  1, r: -3 },
  { id: "AllodsBightHex",      name: "Allod's Bight",      q:  2, r: -2 },
  { id: "AshFieldsHex",        name: "Ash Fields",         q: -2, r: -1 },
  { id: "BasinSionnachHex",    name: "Basin Sionnach",     q:  0, r:  3 },
  { id: "CallahansPassageHex", name: "Callahan's Passage", q:  0, r:  1 },
  { id: "CallumsCapeHex",      name: "Callum's Cape",      q: -2, r:  3 },
  { id: "ClahstraHex",         name: "The Clahstra",       q:  2, r: -1 },
  { id: "ClansheadValleyHex",  name: "Clanshead Valley",   q:  2, r:  1 },
  { id: "DeadLandsHex",        name: "Deadlands",          q:  0, r:  0 },
  { id: "DrownedValeHex",      name: "Drowned Vale",       q:  1, r: -1 },
  { id: "EndlessShoreHex",     name: "Endless Shore",      q:  3, r: -2 },
  { id: "FarranacCoastHex",    name: "Farranac Coast",     q: -3, r:  2 },
  { id: "FishermansRowHex",    name: "Fisherman's Row",    q: -4, r:  2 },
  { id: "GodcroftsHex",        name: "Godcrofts",          q:  4, r: -1 },
  { id: "GreatMarchHex",       name: "Great March",        q:  0, r: -2 },
  { id: "GutterHex",           name: "The Gutter",         q: -4, r:  3 },
  { id: "HeartlandsHex",       name: "Heartlands",         q: -1, r: -1 },
  { id: "HowlCountyHex",       name: "Howl County",        q:  1, r:  2 },
  { id: "KalokaiHex",          name: "Kalokai",            q:  0, r: -3 },
  { id: "KingsCageHex",        name: "King's Cage",        q: -2, r:  1 },
  { id: "KuuraStrandHex",      name: "Kuura Strand",       q: -4, r:  4 },
  { id: "LinnMercyHex",        name: "Linn of Mercy",      q: -1, r:  1 },
  { id: "LochMorHex",          name: "Loch Mór",           q: -1, r:  0 },
  { id: "LykosIsleHex",        name: "Lykos Isle",         q:  5, r: -2 },
  { id: "MarbanHollow",        name: "Marban Hollow",      q:  1, r:  0 },
  { id: "MooringCountyHex",    name: "The Moors",          q: -1, r:  2 },
  { id: "MorgensCrossingHex",  name: "Morgen's Crossing",  q:  3, r:  0 },
  { id: "NevishLineHex",       name: "Nevish Line",        q: -3, r:  3 },
  { id: "OarbreakerHex",       name: "Oarbreaker",         q: -5, r:  2 },
  { id: "OlavisWakeHex",       name: "Olavi's Wake",       q: -6, r:  4 },
  { id: "OnyxHex",             name: "Onyx",               q:  4, r: -4 },
  { id: "OriginHex",           name: "Origin",             q: -3, r:  0 },
  { id: "PalantineBermHex",    name: "Palantine Berm",     q: -5, r:  3 },
  { id: "PariPeakHex",         name: "Pari Peak",          q: -5, r:  4 },
  { id: "PipersEnclaveHex",    name: "Piper's Enclave",    q:  6, r: -4 },
  { id: "ReachingTrailHex",    name: "Reaching Trail",     q:  0, r:  2 },
  { id: "ReaversPassHex",      name: "Reaver's Pass",      q:  3, r: -3 },
  { id: "RedRiverHex",         name: "Red River",          q: -1, r: -2 },
  { id: "SableportHex",        name: "Sableport",          q: -2, r:  0 },
  { id: "ShackledChasmHex",    name: "Shackled Chasm",     q:  1, r: -2 },
  { id: "SpeakingWoodsHex",    name: "Speaking Woods",     q: -1, r:  3 },
  { id: "StemaLandingHex",     name: "Stema Landing",      q: -4, r:  1 },
  { id: "StlicanShelfHex",     name: "Stlican Shelf",      q:  3, r: -1 },
  { id: "StonecradleHex",      name: "Stonecradle",        q: -2, r:  2 },
  { id: "TempestIslandHex",    name: "Tempest Island",     q:  4, r: -2 },
  { id: "TerminusHex",         name: "Terminus",           q:  2, r: -3 },
  { id: "TheFingersHex",       name: "The Fingers",        q:  5, r: -3 },
  { id: "TyrantFoothillsHex",  name: "Tyrant Foothills",   q:  5, r: -4 },
  { id: "UmbralWildwoodHex",   name: "Umbral Wildwood",    q:  0, r: -1 },
  { id: "ViperPitHex",         name: "Viper Pit",          q:  1, r:  1 },
  { id: "WeatheredExpanseHex", name: "Weathered Expanse",  q:  2, r:  0 },
  { id: "WestgateHex",         name: "Westgate",           q: -3, r:  1 },
  { id: "WrestaHex",           name: "Wresta",             q:  4, r: -3 },
]


export const MAP_SIZE = 256
export const MAP_CENTER = { x: MAP_SIZE / 2, y: MAP_SIZE / 2 * -1 }
export const HEX_SIZE = MAP_SIZE / 20





export interface Region {
  id:   string
  name: string
  q:    number
  r:    number
  center?: Leaflet.LatLngLiteral
  northWest?: Leaflet.LatLngLiteral
  width?: number
  height?: number
  mapIconPosition?: (normalizedX: number, normalizedY: number) => Leaflet.LatLngLiteral
}





// #region region extension
// calculate additional region properties and add helper function references

function calculateRegionCenter(region: Region)
{
  const q = region.q
  const r = region.r

  const dx = HEX_SIZE * (1.5 * q)
  const dy = HEX_SIZE * (Math.sqrt(3) * (r + q / 2))

  region.center = Leaflet.latLng(MAP_CENTER.y + dy, MAP_CENTER.x + dx)
}



function translateMapIconPosition (this: Region, normalizedX: number, normalizedY: number)
{
  const norWestCorner = this.northWest!
  const x = this.width! * normalizedX
  const y = this.height! * normalizedY

  return Leaflet.latLng(norWestCorner.lat - y, norWestCorner.lng + x)
}



function initializeRegions()
{
  regions.forEach((region) =>
  {
    calculateRegionCenter(region)

    region.mapIconPosition = translateMapIconPosition.bind(region)
  })
}
initializeRegions()