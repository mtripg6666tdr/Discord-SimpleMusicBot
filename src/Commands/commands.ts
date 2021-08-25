import * as discord from "discord.js";
import { CommandsManager, CommandArgs, CommandInterface, SlashCommandArgument } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { PageToggle } from "../Component/PageToggle";
import { getColor } from "../Util/colorUtil";

export default class Commands implements CommandInterface{
  name = "コマンド";
  alias = ["command", "commands", "cmd"];
  description = "コマンド一覧を表示します。コマンド名を渡すとそのコマンドの詳細を表示します。";
  unlist = false;
  category = "bot";
  commands = null as CommandInterface[];
  usage = "command [コマンド名]";
  examples = "command search";
  argument = [{
    type: "string",
    description: "詳細表示するするコマンド名",
    name: "command",
    required: false
  }] as SlashCommandArgument[]
  async run(message:CommandMessage, options:CommandArgs){
    if(options.rawArgs == ""){
      // 引数がない場合は全コマンドの一覧を表示
      const embed = [] as discord.MessageEmbed[];
      const getCategoryText = (label:string)=>{
        const categories = {
          "voice": "ボイスチャンネル操作系",
          "player": "音楽プレイヤー制御系",
          "playlist": "プレイリスト操作系",
          "utility": "ユーティリティ系",
          "bot": "ボット操作全般"
        };
        // @ts-ignore
        return categories[label as any] as string;
      };
      const categoriesList = ["voice", "player", "playlist", "utility", "bot"];
      const rawcommands = this.commands.filter(ci => !ci.unlist);
      const commands = {} as {[category:string]:CommandInterface[]};
      // Generate command list
      for(let i = 0; i < rawcommands.length; i++){
        if(commands[rawcommands[i].category]){
          commands[rawcommands[i].category].push(rawcommands[i]);
        }else{
          commands[rawcommands[i].category] = [rawcommands[i]];
        }
      }
      // Generate embed
      for(let i = 0; i < categoriesList.length; i++){
        embed.push(
          new discord.MessageEmbed()
          .setTitle(getCategoryText(categoriesList[i]))
          .addFields(commands[categoriesList[i]].map(ci => {return {
            name: ci.name + ", " + ci.alias.join(", "),
            value: ci.description,
            inline: true
          } as discord.EmbedField}))
        );
      }
      for(let i = 0; i < embed.length; i++){
        embed[i].setTitle("コマンド一覧(" + embed[i].title + ")");
        embed[i].setDescription("コマンドの一覧です。\r\n`" + (i+1) + "ページ目(" + embed.length + "ページ中)`\r\nコマンドプレフィックスは、`" + options.data[message.guild.id].PersistentPref.Prefix + "`です。");
        embed[i].setColor(getColor("COMMAND"));
      }
      const msg = await message.reply({embeds:[embed[0]]});
      const toggle = await PageToggle.init(msg, embed);
      options.EmbedPageToggle.push(toggle);
    }else{
      const ci = CommandsManager.Instance.resolve(options.rawArgs);
      if(ci && !ci.unlist){
        const prefix = options.data[message.guild.id] ? options.data[message.guild.id].PersistentPref.Prefix : ">";
        const embed = 
          new discord.MessageEmbed()
          .setTitle("コマンド `" + ci.name + "` の詳細")
          .setDescription(ci.description)
          .setColor(getColor("COMMAND"))
          .addField("エイリアス", "`" + ci.alias.join("`, `") + "`")
        ;
        if(ci.usage){
          embed.addField("使い方", "`" + prefix + ci.usage + "` \r\n`<>` 内の引数は必須の引数、`[]`内の引数は任意の引数です。");
        }
        if(ci.examples){
          embed.addField("使用例", "`" + prefix + ci.examples + "`");
        }
        await message.reply({embeds:[embed]});
      }else{
        await message.reply(":face_with_raised_eyebrow: コマンドが見つかりませんでした");
      }
    }
  }
}
