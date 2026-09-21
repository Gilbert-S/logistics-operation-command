import type { Item } from "./items"


const customItems: Record<string, Item> = {
  ShirtStack: {
    bIsLarge: false,
    ChassisName: "",
    CodeName: "ShirtStack",
    Description: "A stack of 100x shirts, pulled by fellow Kriegsman in the Shirt Truck.",
    DisplayName: "Shirt Stack",
    EquipmentSlot: null,
    FactionVariant: null,
    Icon: "War/Content/Textures/UI/ItemIcons/ClothItemIcon.0",
    ItemCategory: "Custom",
    ItemDynamicData: {
      CostPerCrate: [],
      CrateProductionTime: 0,
      CrateRetrieveTime: 0,
      QuantityPerCrate: 100,
      ResearchLevel: 0,
      SingleRetrieveTime: 0,
    },
  },

  FuelBanana: {
    bIsLarge: false,
    ChassisName: "",
    CodeName: "FuelBanana",
    Description: "A Liquid Container filled with Fuel.",
    DisplayName: "Fuel Banana",
    EquipmentSlot: null,
    FactionVariant: null,
    Icon: "War/Content/Textures/UI/StructureIcons/FuelTankIcon.0",
    ItemCategory: "Custom",
    ItemDynamicData: {
      CostPerCrate: [],
      CrateProductionTime: 0,
      CrateRetrieveTime: 0,
      QuantityPerCrate: 100,
      ResearchLevel: 0,
      SingleRetrieveTime: 0,
    },
  },

  FuelRunner: {
    bIsLarge: false,
    ChassisName: "",
    CodeName: "FuelRunner",
    Description: `The Fuelrunner is a heavy Dunne rig designed to transport and distribute large quantities of Fuel.`,
    DisplayName: "Dunne Fuelrunner 2d",
    EquipmentSlot: null,
    FactionVariant: null,
    Icon: "War/Content/Textures/UI/VehicleIcons/OilTankerWarIcon.0",
    ItemCategory: "Custom",
    ItemDynamicData: {
      CostPerCrate: [],
      CrateProductionTime: 0,
      CrateRetrieveTime: 0,
      QuantityPerCrate: 50,
      ResearchLevel: 0,
      SingleRetrieveTime: 0,
    },
  },
}
export default customItems