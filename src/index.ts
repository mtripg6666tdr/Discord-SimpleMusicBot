// =============
// メインエントリ
// =============
require("dotenv").config();
import * as http from "http";
import { MusicBot } from "./bot";

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Discord Bot is active now");
}).listen(8080);

new MusicBot().Run(process.env.TOKEN);