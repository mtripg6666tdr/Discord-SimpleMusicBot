import "./dotenv";
import type { TextChannel } from "discord.js";

import * as http from "http";

import { Util } from "./Util";
import { MusicBot } from "./bot";
// =============
// メインエントリ
// =============
Util.logger.log("[Entry]Discord-SimpleMusicBot by mtripg6666tdr");

const bot = new MusicBot(Boolean(Util.config.maintenance));

// Webサーバーのインスタンス化
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  const data = {
    status: 200,
    message: "Discord bot is active now",
    client: bot.Client && bot.Client.user ? btoa(bot.Client.user.id) : null,
    readyAt: bot.Client && bot.Client.readyAt ? btoa(bot.Client.readyAt.getTime().toString()) : null,
    guilds: bot.Client && bot.Client.guilds && bot.Client.guilds.cache ? bot.Client.guilds.cache.size : null
  };
  Util.logger.log("[Server]Received a http request");
  res.end(JSON.stringify(data));
}).listen(8081);

if(!Util.config.debug){
  // ハンドルされなかったエラーのハンドル
  process.on("uncaughtException", (error)=>{
    console.error(error);
    if(bot.Client && Util.config.errorChannel){
      try{
        const errorText = typeof error === "string" ? error : JSON.stringify(error);
        (bot.Client.channels.resolve(Util.config.errorChannel) as TextChannel).send(errorText);
      }
      catch(e){
        console.error(e);
        process.exit(1);
      }
    }
  }).on("SIGINT", ()=>{
    if(bot.Client && Util.config.errorChannel){
      (bot.Client.channels.resolve(Util.config.errorChannel) as TextChannel).send("Process terminated");
    }
  });
}

// ボット開始
bot.Run(process.env.TOKEN, true, 40);
