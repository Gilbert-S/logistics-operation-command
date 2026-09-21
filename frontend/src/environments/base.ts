export const baseSettings = {


  production: true,

  /** used as base url for most images (map tiles, map icons, item icons, ... ) */
  CDNBaseUrl: "https://cdn.jsdelivr.net/gh/Gilbert-S/qmob-assets@1.2.0/assets",





  availableIconMods: [
    {
      key: "default",
      name: "Default Game Icons",
      url: null,
    },

    {
      key: "CleanIconsEssential",
      name: "CleanIconsEssential Mod",
      url: "https://ashdeuzofr.itch.io/foxhole-clean-icons-essential",
    },

    {
      key: "Improved_Icons",
      name: "Improved Icons Mod",
      url: "https://priority6.itch.io/improved-icons-foxhole",
    },

    {
      key: "UI_Label_Items",
      name: "UI Label Icons Mod",
      url: "https://sentsu.itch.io/foxhole-ui-label-icons",
    },
  ],

  availableMapMods: [
    {
      key: "default",
      name: "Default Game Map",
      url: null,
    },

    {
      key: "WG-IX-01A",
      name: "WG.IX 01A Light",
      url: "https://www.nexusmods.com/foxhole/mods/135",
    },

    {
      key: "WG-IX-02A",
      name: "WG.IX 02A Dark",
      url: "https://www.nexusmods.com/foxhole/mods/135",
    },

    {
      key: "IMM",
      name: "Improved Map Mod",
      url: "https://rustard.itch.io/improved-map-mod",
    },

    {
      key: "kos",
      name: "Knight's Map Mod of Science",
      url: "https://knight-of-science.itch.io/improved-map-mod-kos-edit",
    },

    {
      key: "Ink",
      name: "Ink and Frontline",
      url: "https://arkhitecton.itch.io/foxhole-ink-and-frontline",
    },
  ],
} as const