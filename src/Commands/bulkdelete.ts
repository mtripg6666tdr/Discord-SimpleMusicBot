import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"

export default class BulkDelete extends BaseCommand {
  constructor(){
    super({
      name: "バルク削除",
      alias: ["bulk-delete", "bulkdelete"],
      description: "ボットが送信したメッセージを一括削除します。",
      unlist: false,
      category: "playlist",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
  }
}
