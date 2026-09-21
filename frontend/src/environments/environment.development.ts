import { baseSettings } from "./base"

export const environment = {

  ...baseSettings,

  production: false,


  // using local basePath for dev - DONT do that in prod, use a CDN
  CDNBaseUrl: "/assets",


  /** only vanilla icons available in local dev
   * you can switch to use prod CDN and mods though
   */
  availableIconMods: [
    {
      key: "default",
      name: "Default Game Icons",
      url: null,
    },
  ],

  availableMapMods: [
    {
      key: "default",
      name: "Default Game Map",
      url: null,
    },
  ],


} as const
