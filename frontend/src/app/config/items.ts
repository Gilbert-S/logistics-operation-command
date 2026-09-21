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
  Custom: "Custom",
  HeavyAmmo: "EItemCategory::HeavyAmmo",
  HeavyArms: "EItemCategory::HeavyArms",
  Medical: "EItemCategory::Medical",
  Parts: "EItemCategory::Parts",
  SmallArms: "EItemCategory::SmallArms",
  Supplies: "EItemCategory::Supplies",
  Uniform: "Uniform",
  Utility: "EItemCategory::Utility",
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