# extracts item informations from Foxhole game files and generates
# a single items.json file for use in the frontend
# HINT:  adjust the type definitions in items.ts file if you edit the data structure in here.

$SETTINGS = @{

  # using  CUE4Parse.CLI  from  https://github.com/joric/CUE4Parse.CLI
  #   CUE4Parse.CLI is Licensed under: Apache License Version 2.0

  # Download fresh copy or use existing CUE4Parse CLI binary | false = use existing
  "DownloadCUE4Parse" = $true
  "CUE4ParseVersionTag" = "cli-0.1.9"

  # extract info files & overwrite existing files | false = use existing
  "ExtractInfoFromPAK" = $true

  # path to foxhole game PAK
  "PAK" = "C:\Program Files (x86)\Steam\steamapps\common\Foxhole\War\Content\Paks\War-WindowsNoEditor.pak"

  # item.json output path
  "OutputPath" = "..\src\app\config\items.json"

}

Set-Location -Path $PSScriptRoot
if (!(Test-Path -Path "artifacts")) {
    New-Item -ItemType Directory -Path "artifacts" | Out-Null
}








if ($SETTINGS.DownloadCUE4Parse)
{
  Write-Host "Downloading CUE4Parse CLI version $($SETTINGS.CUE4ParseVersionTag)..."
  curl.exe -o "artifacts\cue4parse.zip" --progress-bar -L "https://github.com/joric/CUE4Parse.CLI/releases/download/$($SETTINGS.CUE4ParseVersionTag)/CUE4Parse.$($SETTINGS.CUE4ParseVersionTag)-Win64-bin.zip"
  Expand-Archive "artifacts\cue4parse.zip" -DestinationPath "artifacts\cue4parse" -Force
  Write-Host "CUE4Parse CLI downloaded and extracted to artifacts\cue4parse"
  Write-Host "-----------------------"
  Write-Host ""
}



if($SETTINGS.ExtractInfoFromPAK)
{
  # clean artifacts
  Write-Host "Cleaning artifacts..."
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "artifacts\War"


  Write-Host "Extracting info files from PAK..."
  artifacts\cue4parse\cue4parse.exe --pak $($SETTINGS.PAK) -g GAME_UE4_24 -f "json" -o "artifacts\" `
    -p "War/Content/Blueprints/ItemPickups/*" `
    -p "War/Content/Blueprints/Data/BPItemDynamicData.uasset" `
    -p "War/Content/Blueprints/Structures/Banners/BPBannerTCPickup.uasset" `
    -p "War/Content/Blueprints/Structures/Banners/BPBannerTWPickup.uasset" `

  Move-Item -Path "artifacts\War\Content\Blueprints\Structures\Banners\BPBannerTCPickup.json" -Destination "artifacts\War\Content\Blueprints\ItemPickups\" -Force
  Move-Item -Path "artifacts\War\Content\Blueprints\Structures\Banners\BPBannerTWPickup.json" -Destination "artifacts\War\Content\Blueprints\ItemPickups\" -Force

  Write-Host "-----------------------"
  Write-Host ""
}





# contains dynamic data for items, such as cost, items per crate, etc.
Write-Host "Parsing ItemDynamicData..."
$ItemDynamicData = Get-Content -Path 'artifacts\War\Content\Blueprints\Data\BPItemDynamicData.json' -Raw | ConvertFrom-Json
$ItemDynamicData = $ItemDynamicData[0].Rows


# fetch, parse and compine all item blueprints into single array
Write-Host "Parsing Item Blueprints..."
$ItemBlueprints = @(
  Get-ChildItem -Path 'artifacts\War\Content\Blueprints\ItemPickups' -Filter '*.json' -File -Recurse |
    ForEach-Object {
      Get-Content -Path $_.FullName -Raw | ConvertFrom-Json
    }
) | ForEach-Object { $_ }


$requiredProperties = @(
  'CodeName'
  'DisplayName'
)

# filter relevant information objects and dump the rest. only keeping objects that have all required properties
$filteredItems = $ItemBlueprints | Where-Object {
  $properties = $_.Properties

  $null -ne $properties -and
  ($requiredProperties | Where-Object {
    $properties.PSObject.Properties.Name -notcontains $_
  }).Count -eq 0
}




# combine and format all the data into json
$Items = @{}
$filteredItems | ForEach-Object {
  $codeName = $_.Properties.CodeName

  $itemCategory = $_.Properties.ItemCategory
  if(!$_.Properties.ItemCategory -and $_.Properties.UniformType) {
    $itemCategory = "Uniform"
  }

  $Items[$codeName] = [PSCustomObject]@{
    bIsLarge        = $_.Properties.bIsLarge
    ChassisName     = $_.Properties.ChassisName.LocalizedString
    CodeName        = $codeName
    Description     = $_.Properties.Description.LocalizedString
    DisplayName     = $_.Properties.DisplayName.LocalizedString
    EquipmentSlot   = $_.Properties.EquipmentSlot
    FactionVariant  = $_.Properties.FactionVariant
    Icon            = $_.Properties.Icon.ObjectPath
    ItemCategory    = $itemCategory
    ItemDynamicData = $ItemDynamicData.($_.Properties.CodeName)
  }
}


# game display items in a certain order, no idea how to extract that order from gamefiles yet - so manual list here derived from json stockpile export
$manualOrderedCodenames = @(
  "AssaultRifleHeavyC",
  "AssaultRifleHeavyW",
  "AssaultRifleW",
  "AssaultRifleAmmo",
  "AssaultRifleC",
  "MGC",
  "MGW",
  "GrenadeC",
  "GrenadeW",
  "PistolC",
  "PistolLightW",
  "PistolW",
  "PistolAmmo",
  "Revolver",
  "RifleHeavyW",
  "RevolverAmmo",
  "RifleAutomaticC",
  "RifleAutomaticW",
  "RifleC",
  "RifleHeavyC",
  "RifleLightC",
  "RifleLightW",
  "RifleLongC",
  "RifleLongW",
  "RifleShortW",
  "RifleW",
  "SniperRifleC",
  "SniperRifleW",
  "RifleAmmo",
  "ShotgunC",
  "ShotgunW",
  "ShotgunAmmo",
  "SMGC",
  "SMGHeavyC",
  "SMGHeavyW",
  "SMGW",
  "SMGAmmo",
  "ATRifleAssaultW",
  "ATRifleAutomaticW",
  "ATRifleLightC",
  "ATRifleSniperC",
  "ATRifleTC",
  "ATRifleW",
  "ATRifleAmmo",
  "ATRPGC",
  "ATRPGHeavyC",
  "ATRPGHeavyW",
  "ATRPGAmmo",
  "ATRPGTW",
  "ATRPGW",
  "ATRPGIndirectAmmo",
  "FlameTorchC",
  "FlameTorchW",
  "GrenadeLauncherC",
  "GrenadeLauncherTC",
  "HELaunchedGrenade",
  "SmokeGrenade",
  "GreenAsh",
  "MGTC",
  "MGTW",
  "MGAmmo",
  "ISGTC",
  "MiniTankAmmo",
  "Mortar",
  "MortarAmmoFlame",
  "MortarAmmoFL",
  "MortarAmmoSH",
  "MortarAmmo",
  "ATGrenadeW",
  "ATLaunchedGrenadeW",
  "ATRPGLightC",
  "HEGrenade",
  "StickyBomb",
  "RPGTW",
  "RpgW",
  "RpgAmmo",
  "AAAmmo",
  "AircraftAmmo",
  "ATLargeAmmo",
  "BattleTankAmmo",
  "BomberAmmo",
  "DemolitionRocketAmmo",
  "DepthChargeAmmo",
  "DiveBomberAmmo",
  "FireRocketAmmo",
  "FlameAmmo",
  "HeavyArtilleryAmmo",
  "HERocketAmmo",
  "LightAAAmmo",
  "LightArtilleryAmmo",
  "LRArtilleryAmmo",
  "MiniTorpedoAmmo",
  "MortarTankAmmoBR",
  "MortarTankAmmo",
  "SurfaceWaterMine",
  "WaterWallMaterials",
  "ATAmmo",
  "LightTankAmmo",
  "AirSirenT",
  "BannerTC",
  "BannerTW",
  "BarbedWireMaterials",
  "Bayonet",
  "Binoculars",
  "ExplosiveLightC",
  "ExplosiveTripod",
  "FlameBackpackC",
  "FlameBackpackW",
  "InfantryMine",
  "ListeningKit",
  "MaceW",
  "MetalBeamMaterials",
  "ParatrooperBackpack",
  "RadioBackpack",
  "SandbagMaterials",
  "SatchelChargeT",
  "SatchelChargeW",
  "Shovel",
  "SledgeHammer",
  "SwordC",
  "TankMine",
  "Tripod",
  "WaterMine",
  "WindsockT",
  "WorkHammer",
  "WorkWrench",
  "WaterBucket",
  "Water",
  "GasMask",
  "GasMaskFilter",
  "GrenadeAdapter",
  "PilotMask",
  "Radio",
  "Bandages",
  "FirstAidKit",
  "TraumaKit",
  "BloodPlasma",
  "SoldierSupplies",
  "Diesel",
  "FacilityMaterials10",
  "FacilityMaterials11",
  "FacilityMaterials2",
  "FacilityMaterials3",
  "FacilityMaterials4",
  "FacilityMaterials5",
  "FacilityMaterials6",
  "FacilityMaterials7",
  "FacilityMaterials8",
  "FacilityMaterials9",
  "FacilityOil1",
  "FacilityOil2",
  "Oil",
  "Petrol",
  "PipeMaterials",
  "AluminumA",
  "Cloth",
  "CopperA",
  "Explosive",
  "FacilityMaterials1",
  "FacilityMaterials12",
  "GroundMaterials",
  "HeavyExplosive",
  "IronA",
  "MaintenanceSupplies",
  "RareMetal",
  "RelicMaterials",
  "Wood",
  "AmmoUniformW",
  "ArmourUniformC",
  "ArmourUniformW",
  "EngineerUniformC",
  "EngineerUniformW",
  "GrenadeUniformC",
  "MedicUniformC",
  "MedicUniformW",
  "NavalUniformC",
  "NavalUniformW",
  "OfficerUniformC",
  "OfficerUniformW",
  "ParatrooperUniformC",
  "ParatrooperUniformW",
  "PilotUniformC",
  "PilotUniformW",
  "RainUniformC",
  "ScoutUniformC",
  "ScoutUniformW",
  "SnowUniformC",
  "SnowUniformW",
  "SoldierUniformC",
  "SoldierUniformW",
  "TankUniformC",
  "TankUniformW",
  "AircraftPartSmallEngineC",
  "AircraftPartSmallEngineW",
  "AircraftPartSmallEngineWreckedC",
  "AircraftPartSmallEngineWreckedW",
  "AircraftPartSmallMechanicalC",
  "AircraftPartSmallMechanicalW",
  "AircraftPartSmallMechanicalWreckedC",
  "AircraftPartSmallMechanicalWreckedW"
)

$SortedItems = [ordered]@{}
$manualOrderedCodenames | Where-Object { $Items.Contains($_) } | ForEach-Object {
  $SortedItems[$_] = $Items[$_]
}
$Items.Keys | Where-Object { -not $SortedItems.Contains($_) } | ForEach-Object {
  $SortedItems[$_] = $Items[$_]
}

$SortedItems.MGW.ItemCategory = "EItemCategory::SmallArms"
$SortedItems.GrenadeC.ItemCategory = "EItemCategory::SmallArms"
$SortedItems.WoundedCarriedPlayer.ItemCategory = "EItemCategory::Medical"
$SortedItems.BannerTW.ItemCategory = "EItemCategory::Utility"



Write-Host "Writing $($SETTINGS.OutputPath) ..."
$SortedItems | ConvertTo-Json -Depth 5 -Compress | Out-File -FilePath $SETTINGS.OutputPath -Encoding utf8

Write-Host "-----------------------"
Write-Host ""
Write-Host "Done.  $($Items.Count) items written to $($SETTINGS.OutputPath)"
