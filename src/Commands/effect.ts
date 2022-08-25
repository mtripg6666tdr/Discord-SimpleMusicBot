import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getCurrentEffectPanel } from "../Util/effect";

export default class Effect extends BaseCommand {
  constructor(){
    super({
      name: "エフェクト",
      alias: ["effect", "音声エフェクト", "音声効果", "効果"],
      description: "エフェクトコントロールパネルを表示します",
      unlist: false,
      category: "player",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    try{
      const {embed, messageActions } = getCurrentEffectPanel(message.member.avatarURL, options.data[message.guild.id]);
      const reply = await message.channel.createMessage({
        content: "",
        embeds: [embed.toEris()],
        components: [messageActions]
      });
      setTimeout(() => {
        reply.edit({components: []});
      }, 5 * 60 * 1000);
    }
    catch(e){
      Util.logger.log(JSON.stringify(e), "error");
      await message.reply(":cry:エラーが発生しました").catch(er => Util.logger.log(er, "error"));
    }
  }
}
