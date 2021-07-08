// =============
// メインエントリ
// =============
require("dotenv").config();
import { TextChannel } from "discord.js";
import * as http from "http";
import { MusicBot } from "./bot";
import { btoa, log } from "./Util/util";

log("[Entry]Discord-SimpleMusicBot by mtripg6666tdr");
const bot = new MusicBot();

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
  log("[Server]Received a http request");
  res.end(JSON.stringify(data));
}).listen(8081);

// ハンドルされなかったエラーのハンドル
process.on("uncaughtException", (error)=>{
  if(bot.Client){
    const errorText = typeof error === "string" ? error : JSON.stringify(error);
    (bot.Client.channels.resolve("846411633458806804") as TextChannel).send(errorText);
  }
}).on("SIGINT", ()=>{
  if(bot.Client){
    (bot.Client.channels.resolve("846411633458806804") as TextChannel).send("Process terminated");
  }
});

// ボット開始
bot.Run(process.env.TOKEN, true, 40);