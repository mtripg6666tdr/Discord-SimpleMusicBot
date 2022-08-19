import type { exportableCustom } from "../AudioSource";

export const YmxVersion = 2;
export type YmxFormat = {
  version:number,
  data:(exportableCustom & {addBy: {
    displayName:string,
    userId:string,
  }, })[],
};
