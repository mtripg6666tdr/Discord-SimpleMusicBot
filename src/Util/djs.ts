import type { TextChannel, GuildMember } from "discord.js";

/**
 * 与えられたテキストチャンネルでメンバーが送信可能かどうかを判断します。
 * @param channel 検査対象のテキストチャンネル
 * @param user ユーザー
 * @returns 可能であればtrue、それ以外であればfalse
 */
export async function CheckSendable(channel:TextChannel, user:GuildMember){
  try{
    const permissions = ((await channel.fetch()) as TextChannel).permissionsFor(user);
    return permissions.has("SEND_MESSAGES") 
      && permissions.has("EMBED_LINKS")
      && permissions.has("MANAGE_MESSAGES")
      && permissions.has("ATTACH_FILES")
      && permissions.has("READ_MESSAGE_HISTORY")
      && permissions.has("VIEW_CHANNEL")
      ;
  }
  catch{
    return false;
  }
}