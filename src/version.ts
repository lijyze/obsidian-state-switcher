import { StateSwitcherSettings } from "./setting";

export function makeCompatible(setting: StateSwitcherSettings) {
  setting.stateMaps.forEach((map) => {
    map.structure = map.structure ?? 'keyValue';
  })

  return setting;
}