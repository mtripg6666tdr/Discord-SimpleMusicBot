import { channelUtil } from "./channel";
import { interactionUtils } from "./interaction";
import { userUtil } from "./user";

export const erisUtil = {
  interaction: interactionUtils,
  channel: channelUtil,
  user: userUtil,
} as const;
