// =============
// メインエントリ
// =============
require("dotenv").config();
import * as http from "http";
import { MusicBot } from "./bot";
import { btoa, log } from "./Util/util";

log("[Entry]Discord-SimpleMusicBot by mtripg6666tdr");
const bot = new MusicBot();
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
}).listen(8080);

bot.Run(process.env.TOKEN, true, 40);