/*
 * Copyright 2021-2024 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";
import type { ResponseMessage } from "../Component/commandResolver/ResponseMessage";
import type { AnyTextableGuildChannel, Message } from "oceanic.js";

import { MessageActionRowBuilder, MessageButtonBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";

export default class BulkDelete extends BaseCommand {
  constructor(){
    super({
      alias: ["bulk_delete", "bulk-delete", "bulkdelete"],
      unlist: false,
      category: "utility",
      args: [
        {
          type: "integer" as const,
          name: "count",
          required: true,
        },
      ],
      requiredPermissionsOr: ["admin", "manageMessages"],
      shouldDefer: false,
      defaultMemberPermission: ["MANAGE_MESSAGES"],
    });
  }

  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;

    const count = Number(context.args[0]);
    if(isNaN(count)){
      message.reply(`:warning:${t("commands:bulk_delete.invalidMessageCount")}`).catch(this.logger.error);
      return;
    }
    const reply = await message.reply(`${t("commands:bulk_delete.loading")}...`).catch(this.logger.error) as ResponseMessage;
    try{
      // collect messages
      let before = "";
      const messages = [] as Message[];
      let i = 0;
      do{
        const allMsgs: Message<AnyTextableGuildChannel>[] = await message.channel.getMessages(
          before
            ? { limit: 100, before }
            : { limit: 100 }
        );
        if(allMsgs.length === 0) break;
        const msgs = allMsgs.filter(_msg => _msg.author.id === context.client.user.id && _msg.id !== reply.id);
        msgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        messages.push(...msgs);
        before = allMsgs.at(-1)!.id;
        i++;
        await reply.edit(
          `:mag:${t("commands:bulk_delete.loading")}(${
            t("commands:bulk_delete.hitCount", { count: messages.length })
          }/${
            t("commands:bulk_delete.inCount", { count: i * 100 })
          })...`);
      } while(messages.length < count && i <= 10);
      if(messages.length > count) messages.splice(count);

      const { collector, customIdMap } = context.bot.collectors
        .create()
        .setAuthorIdFilter(message.member.id)
        .setTimeout(2 * 60 * 1000)
        .createCustomIds({
          ok: "button",
        });
      await reply.edit({
        content: [
          t("commands:bulk_delete.found", { count: messages.length }),
          t("commands:bulk_delete.confirm"),
        ].join("\r\n"),
        components: [
          new MessageActionRowBuilder()
            .addComponents(
              new MessageButtonBuilder()
                .setCustomId(customIdMap.ok)
                .setLabel("OK")
                .setStyle("DANGER")
            )
            .toOceanic(),
        ],
      });

      collector.once("ok", async () => {
        // bulk delete
        await message.channel.deleteMessages(
          messages.map(msg => msg.id),
          t("commands:bulk_delete.auditLog", { issuer: message.member.username, count })
        );
        await reply.edit({
          content: `:sparkles:${t("commands:bulk_delete.finish")}`,
          components: [],
        });
        setTimeout(() => reply.delete().catch(() => {}), 10 * 1000).unref();
      });
      collector.on("timeout", () => {
        reply.edit({
          content: t("commands:bulk_delete.cancel"),
          components: [],
        }).catch(this.logger.error);
      });
    }
    catch(er){
      this.logger.error(er);
      if(reply){
        await reply.edit(t("failed")).catch(this.logger.error);
      }
    }
  }
}
