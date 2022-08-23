import "./dotenv";

import * as http from "http";

import { Util } from "./Util";
import { MusicBot } from "./bot";
// =============
// メインエントリ
// =============
Util.logger.log("[Entry]Discord-SimpleMusicBot by mtripg6666tdr");

const bot = new MusicBot(process.env.TOKEN, Boolean(Util.config.maintenance));

// Webサーバーのインスタンス化
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  const data = {
    status: 200,
    message: "Discord bot is active now",
    client: bot.Client?.user ? Buffer.from(bot.Client?.user.id) : null,
    readyAt: bot.Client?.uptime ? Buffer.from(bot.Client.uptime.toString()).toString("base64") : null,
    guilds: bot.Client?.guilds.size || null,
  };
  Util.logger.log("[Server]Received a http request");
  res.end(JSON.stringify(data));
}).listen(8081);

if(!Util.config.debug){
  // ハンドルされなかったエラーのハンドル
  process.on("uncaughtException", async (error)=>{
    console.error(error);
    if(bot.Client && Util.config.errorChannel){
      try{
        const errorText = typeof error === "string" ? error : JSON.stringify(error);
        await bot.Client.createMessage(Util.config.errorChannel, errorText);
      }
      catch(e){
        console.error(e);
        process.exit(1);
      }
    }
  }).on("SIGINT", ()=>{
    if(bot.Client && Util.config.errorChannel){
      bot.Client.createMessage(Util.config.errorChannel, "Process terminated");
    }
  });
}

// ボット開始
bot.run(true, 40);
