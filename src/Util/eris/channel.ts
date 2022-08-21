import type { TextableChannel, TextChannel } from "eris";

import { Constants } from "eris";

export const channelUtil = {
  channelIsTextChannel(channel:TextableChannel):channel is TextChannel{
    return channel.type === Constants.ChannelTypes.GUILD_TEXT;
  },
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
