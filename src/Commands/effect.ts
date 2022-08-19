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
      unlist: true,
      category: "player",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    try{
      const {embed, messageActions } = getCurrentEffectPanel(message.author.avatarURL(), options.data[message.guild.id]);
      const reply = await message.channel.send({
        content: null,
        embeds: [embed],
        components: [messageActions]
      });
      setTimeout(() => {
        reply.edit({components: []});
      }, 5 * 60 * 1000);
    }
    catch(e){
      Util.logger.log(JSON.stringify(e), "error");
      message.reply(":cry:エラーが発生しました");
    }
  }
}
