import { channelUtil } from "./channel";
import { interactionUtils } from "./interaction";

export const erisUtil = {
  interaction: interactionUtils,
  channel: channelUtil,
} as const;
