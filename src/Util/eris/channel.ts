import type { TextChannel } from "eris";

export const channelUtil = {
  checkSendable(channel:TextChannel, userId:string){
    const permissions = channel.permissionsOf(userId);
    return permissions.has("sendMessages")
      && permissions.has("embedLinks")
      && permissions.has("manageMessages")
      && permissions.has("attachFiles")
      && permissions.has("readMessageHistory")
      && permissions.has("viewChannel")
    ;
  },
} as const;
