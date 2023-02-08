/*
 * Copyright 2021-2023 mtripg6666tdr
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

import "./dotenv";
import "./dangerouslyRequireOverride";

import type { LogLevels } from "./Util/log";
import type * as http from "http";

import { Util } from "./Util";
import { MusicBot } from "./bot";
import { createServer } from "./server";

const logger = (content:any, loglevel?:LogLevels) => Util.logger.log(`[Entry]${typeof content === "string" ? content : Util.general.StringifyObject(content)}`, loglevel);

logger("[Entry] Discord-SimpleMusicBot by mtripg6666tdr");
logger("[Entry] This application was originally built by mtripg6666tdr and is licensed under GPLv3 or later.");
logger("[Entry] There is no warranty for the work, both of the original and its forks.");
logger("[Entry] However if you found any bugs in the original please feel free to report them by creating an issue on GitHub.");
logger("[Entry] Thank you for using Discord-SimpleMusicBot!");
logger(`[Entry] Node.js v${process.versions.node}`);

const bot = new MusicBot(process.env.TOKEN, Boolean(Util.config.maintenance));
let server:http.Server = null;

// Webサーバーのインスタンス化
if(Util.config.webserver){
  server = createServer(bot.client, Number(process.env.PORT) || 8081, Util.logger.log);
}else{
  logger("[Entry] Skipping to start server");
}

if(!Util.config.debug){
  // ハンドルされなかったエラーのハンドル
  process.on("uncaughtException", async (error)=>{
    logger(error, "error");
    if(bot.client && Util.config.errorChannel){
      await reportError(error);
    }
  });
  const onTerminated = async function(code:string){
    logger(`${code} detected`);
    logger("Shutting down the bot...");
    bot.stop();
    if(server && server.listening){
      logger("Shutting down the server...");
      await new Promise(resolve => server.close(resolve));
    }
    // 強制終了を報告
    if(bot.client && Util.config.errorChannel){
      bot.client.createMessage(Util.config.errorChannel, "Process terminated").catch(() => {});
    }
    logger("Shutting down completed");
  };
  ["SIGINT", "SIGTERM", "SIGUSR2"].forEach(signal => {
    process.on(signal, onTerminated.bind(undefined, signal));
  });
}

// ボット開始
bot.run(true, 40);

async function reportError(err:any){
  try{
    await bot.client.createMessage(Util.config.errorChannel, Util.general.StringifyObject(err)).catch(() => {});
  }
  catch(e){
    logger(e, "error");
  }
}
