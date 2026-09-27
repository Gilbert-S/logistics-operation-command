import customItems from "./customItems"
import ITEMS from "./items.json"


export const items = { ...customItems, ...ITEMS } as Record<string, {
  bIsLarge: boolean | null
  ChassisName: string | null
  CodeName: string
  Description: string | null
  DisplayName: string
  EquipmentSlot: EquipmentSlot | null
  FactionVariant: FactionVariant | null
  Icon: string
  ItemCategory: ItemCategory | null
  ItemDynamicData: {
    CostPerCrate: {
      ItemCodeName: string
      Quantity: number
    }[],
    QuantityPerCrate: number
    CrateProductionTime: number
    SingleRetrieveTime: number
    CrateRetrieveTime: number
    ResearchLevel: number
  }
}>
export default items

export type Item = typeof items[string]



export const EquipmentSlot = {
  Accessory: "EEquipmentSlot::Accessory",
  Head: "EEquipmentSlot::Head",
  Large: "EEquipmentSlot::Large",
  Primary: "EEquipmentSlot::Primary",
  Secondary: "EEquipmentSlot::Secondary",
  Tertiary: "EEquipmentSlot::Tertiary",
  Utility: "EEquipmentSlot::Utility",
} as const

export type EquipmentSlot = (typeof EquipmentSlot)[keyof typeof EquipmentSlot]




export const FactionVariant = {
  Colonials: "EFactionId::Colonials",
  Wardens: "EFactionId::Wardens",
  Neutral: null,
} as const

export type FactionVariant = (typeof FactionVariant)[keyof typeof FactionVariant]




export const ItemCategory = {
  /* eslint-disable sort-keys */
  Custom: "Custom",
  SmallArms: "EItemCategory::SmallArms",
  HeavyArms: "EItemCategory::HeavyArms",
  HeavyAmmo: "EItemCategory::HeavyAmmo",
  Utility: "EItemCategory::Utility",
  Medical: "EItemCategory::Medical",
  Uniform: "Uniform",
  Supplies: "EItemCategory::Supplies",
  Parts: "EItemCategory::Parts",
  /* eslint-enable sort-keys */
} as const

export type ItemCategory = (typeof ItemCategory)[keyof typeof ItemCategory]





export const EMPTY_ITEM: Item = {
  bIsLarge: false,
  ChassisName: "",
  CodeName: "",
  Description: "",
  DisplayName: "(unknown)",
  EquipmentSlot: null,
  FactionVariant: null,
  Icon: "",
  ItemCategory: null,
  ItemDynamicData: {
    CostPerCrate: [],
    CrateProductionTime: 0,
    CrateRetrieveTime: 0,
    QuantityPerCrate: 0,
    ResearchLevel: 0,
    SingleRetrieveTime: 0,
  },
}


export const SubtypeIcons: Record<string, string> = {
  /* eslint-disable sort-keys */
  MortarAmmoFlame: "War/Content/Textures/UI/ItemIcons/SubtypeFireIcon",
  MortarAmmoFL: "War/Content/Textures/UI/ItemIcons/SubtypeFLIcon",
  MortarAmmoSH: "War/Content/Textures/UI/ItemIcons/SubtypeSHIcon",
  MortarAmmo: "War/Content/Textures/UI/ItemIcons/SubtypeHEIcon",

  AmmoUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeAmmoIcon",
  ArmourUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeArmourIcon",
  ArmourUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeArmourIcon",
  EngineerUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeEngineerIcon",
  EngineerUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeEngineerIcon",
  GrenadeUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeGrenadeIcon",
  MedicUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeMedicIcon",
  MedicUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeMedicIcon",
  NavalUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeNavalIcon",
  NavalUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeNavalIcon",
  OfficerUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeOfficerIcon",
  OfficerUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeOfficerIcon",
  ParatrooperUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeParatrooperIcon",
  ParatrooperUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeParatrooperIcon",
  PilotUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeAirIcon",
  PilotUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeAirIcon",
  RainUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeRainIcon",
  ScoutUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeScoutIcon",
  ScoutUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeScoutIcon",
  SnowUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeSnowIcon",
  SnowUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeSnowIcon",
  TankUniformC: "War/Content/Textures/UI/ItemIcons/SubtypeTankIcon",
  TankUniformW: "War/Content/Textures/UI/ItemIcons/SubtypeTankIcon",

  FacilityMaterials4: "War/Content/Textures/UI/ItemIcons/CoalIcon",
  FacilityMaterials5: "War/Content/Textures/UI/ItemIcons/RefinedFuelIcon",
  FacilityMaterials6: "War/Content/Textures/UI/ItemIcons/SulfurIcon",
  FacilityMaterials7: "War/Content/Textures/UI/ItemIcons/Facilities/HeavyOilIcon",
  FacilityMaterials8: "War/Content/Textures/UI/ItemIcons/Facilities/EnrichedOilIcon",

  FlameBackpackC: "War/Content/Textures/UI/ItemIcons/SubtypeFireIcon",
  FlameBackpackW: "War/Content/Textures/UI/ItemIcons/SubtypeFireIcon",
  FireRocketAmmo: "War/Content/Textures/UI/ItemIcons/SubtypeFireIcon",
  FlameAmmo: "War/Content/Textures/UI/ItemIcons/SubtypeFireIcon",

  GreenAsh: "War/Content/Textures/UI/ItemIcons/SubtypeGAIcon",
  SmokeGrenade: "War/Content/Textures/UI/ItemIcons/SubtypeSMKIcon",
  /* eslint-enable sort-keys */
}