import { Pipe, PipeTransform } from "@angular/core"
import { WarAPI } from "@loc/types"
import { environment } from "../../environments/environment"
import { OPSBASE_ICONS, DEFAULT_ICON } from "../config/mapicons"
import { BaseType } from "../services/base.service"



@Pipe({ name: "opsbaseIcon" })
export class OpsbaseIconPipe implements PipeTransform
{
  baseUrl = environment.CDNBaseUrl
  teamSuffixes: Record<WarAPI.TeamId, string> = {
    WARDENS: "W",
    COLONIALS: "C",
    NONE: "",
  }

  transform(baseType: BaseType, team: WarAPI.TeamId): string
  {
    const teamSuffix = this.teamSuffixes[team]
    const icon = OPSBASE_ICONS[baseType] || DEFAULT_ICON

    return `${this.baseUrl}/map-icons/${icon}${teamSuffix}.png`
  }
}