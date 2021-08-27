import { TextChannel } from "discord.js";
import * as http from "http";
import { MusicBot } from "./bot";
import { btoa, log } from "./Util";
// =============
// メインエントリ
// =============
log("[Entry]Discord-SimpleMusicBot by mtripg6666tdr");
require("dotenv").config();
global.AbortController = require("abort-controller");
const nodeVersion = process.versions.node.split(".")[0];
if(Number(nodeVersion) >= 15){
  log("[Entry]Node major version " + nodeVersion + " is incompatible to this project, but I'll do the best!", "warn");
}

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

if(!process.env.DEBUG){
  // ハンドルされなかったエラーのハンドル
  process.on("uncaughtException", (error)=>{
    if(bot.Client && process.env.ERROR_REPORT){
      try{
        const errorText = typeof error === "string" ? error : JSON.stringify(error);
        (bot.Client.channels.resolve(process.env.ERROR_REPORT) as TextChannel).send(errorText);
      }
      catch(e){
        console.error(e);
        process.exit(1);
      }
    }
  }).on("SIGINT", ()=>{
    if(bot.Client && process.env.ERROR_REPORT){
      (bot.Client.channels.resolve(process.env.ERROR_REPORT) as TextChannel).send("Process terminated");
    }
  });
}

// ボット開始
bot.Run(process.env.TOKEN, true, 40);