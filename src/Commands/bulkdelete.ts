import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";

export default class BulkDelete extends BaseCommand {
  constructor(){
    super({
      name: "バルク削除",
      alias: ["bulk-delete", "bulkdelete"],
      description: "ボットが送信したメッセージを一括削除します。",
      unlist: true,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
  }
}
