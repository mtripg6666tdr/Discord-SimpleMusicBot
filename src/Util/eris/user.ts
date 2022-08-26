import type { Member } from "eris";

export const userUtil = {
  getDisplayName(member:Member){
    return member.nick || member.username;
  }
} as const;
