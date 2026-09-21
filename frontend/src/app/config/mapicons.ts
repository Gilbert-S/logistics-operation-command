import type { BaseImages } from "../services/base.service"





export const DEFAULT_ICON = "UnderMaintenanceMapIcon"

export const MAP_ICONS: Record<number, string> = {
  8: "MapIconForwardBase1",
  11: "MapIconHospital",
  12: "MapIconVehicle",
  17: "MapIconManufacturing",
  18: "Shipyard",
  19: "MapIconTechCenter",
  20: "SalvageMapIcon",
  21: "MapIconComponents",
  22: "MapIconFuel",
  23: "MapIconSulfur",
  27: "MapIconsKeep",
  28: "MapIconObservationTower",
  29: "MapIconFort",
  30: "MapIconLargeShipBaseShip",
  32: "MapIconSulfurMine",
  33: "MapIconStorageFacility",
  34: "MapIconFactory",
  35: "MapIconSafehouse",
  37: "MapIconRocketSite",
  38: "MapIconScrapMine",
  39: "MapIconConstructionYard",
  40: "MapIconComponentMine",
  45: "MapIconRelicBase",
  51: "MapIconMassProductionFactory",
  52: "MapIconSeaport",
  53: "MapIconCoastalGun",
  54: "MapIconSoulFactory",
  56: "MapIconTownBaseTier1",
  57: "MapIconTownBaseTier2",
  58: "MapIconTownBaseTier3",
  59: "MapIconStormcannon",
  60: "MapIconIntelcenter",
  61: "MapIconCoal",
  62: "MapIconFuel",
  70: "MapIconRocketTarget",
  71: "MapIconRocketGroundZero",
  72: "MapIconRocketSiteWithRocket",
  75: "MapIconFacilityMineOilRig",
  83: "MapIconWeatherStation",
  84: "MapIconMortarHouse",
  88: "MapIconAircraftDepot",
  89: "MapIconAircraftFactory",
  90: "MapIconFortLargeRadar",
  91: "MapIconAircraftRunwayT1",
  92: "MapIconAircraftRunwayT2",
}



export const MAP_ICONS_NAME: Record<number, string> = {
  8: "Forward Base",
  11: "Hospital",
  12: "Garage",
  18: "Shipyard",
  27: "Keep",
  29: "Fort",
  33: "Storage Depot",
  34: "Factory",
  35: "Safehouse",
  39: "Construction Yard",
  45: "Relic Base",
  51: "MPF",
  52: "Seaport",
  56: "Town Hall",
  57: "Town Hall",
  58: "Town Hall",
  88: "Aircraft Depot",
  89: "Aircraft Factory",
}

export const MAJOR_LOGISTICS_ICONS = [8, 27, 29, 33, 35, 45, 52, 56, 57, 58, 88]
export const MINOR_LOGISTICS_ICONS = [11, 12, 34, 39, 51]

// icon IDs that represent region main bases like Townhalls or Relic Bases ...
export const REGION_BASES = [27, 29, 45, 56, 57, 58]


/* eslint-disable @stylistic/key-spacing */
export const OPSBASE_ICONS: BaseImages = {
  ["Bober"]:                  "MapIconBorderBase",
  ["Bunker Base T1"]:         "MapIconBunkerBaseTier1",
  ["Bunker Base T2"]:         "MapIconBunkerBaseTier2",
  ["Bunker Base T3"]:         "MapIconBunkerBaseTier3",
  ["Event"]:                  "MapIconEvent",
  ["Forward Operating Base"]: "MapIconForwardBase1",
  ["Staging Area"]:           "MapIconVehicle",
}