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

import "dotenv/config";
import "./logger";
import "./polyfill";
import type * as http from "http";

import log4js from "log4js";

import { stringifyObject } from "./Util";
import { MusicBot } from "./bot";
import { useConfig } from "./config";
import { initLocalization } from "./i18n";
import { createServer } from "./server";

const logger = log4js.getLogger("Entry");
const config = useConfig();

logger.info("Discord-SimpleMusicBot by mtripg6666tdr");
logger.info("This application was originally built by mtripg6666tdr and is licensed under GPLv3 or later.");
logger.info("There is no warranty for the work, both of the original and its forks.");
logger.info("However if you found any bugs in the original please feel free to report them by creating an issue on GitHub.");
logger.info("Thank you for using Discord-SimpleMusicBot!");
logger.info(`Node.js v${process.versions.node}`);

const bot = new MusicBot(process.env.TOKEN, Boolean(config.maintenance));
let server: http.Server | null = null;

// Webサーバーのインスタンス化
if(config.webserver){
  server = createServer(bot.client, Number(process.env.PORT) || 8081);
}else{
  logger.info("Skipping to start server");
}

if(!config.debug){
  // ハンドルされなかったエラーのハンドル
  process.on("uncaughtException", async (error)=>{
    logger.fatal(error);
    if(bot.client){
      await reportError(error);
    }
  });
}else{
  process.on("uncaughtException", async (error)=>{
    if(bot.client){
      await reportError(error);
    }
    logger.fatal(error);
    process.exit(1);
  });
}

let terminating = false;
const onTerminated = async function(code: string){
  if(terminating) return;

  terminating = true;

  logger.info(`${code} detected`);

  await bot.stop();

  if(server && server.listening){
    logger.info("Shutting down the server...");
    await new Promise(resolve => server.close(resolve));
  }

  // 強制終了を報告
  if(bot.client && config.errorChannel){
    bot.client.rest.channels.createMessage(config.errorChannel, {
      content: "Process terminated",
    }).catch(() => {});
  }

  if(global.workerThread){
    logger.info("Shutting down worker...");
    await global.workerThread.terminate();
  }

  logger.info("Shutting down completed");

  log4js.shutdown((er) => {
    if(er){
      console.error(er);
    }
  });

  setTimeout(() => {
    console.error("Killing... (forced)");
    process.exit(1);
  }, 5000).unref();
};

["SIGINT", "SIGTERM", "SIGUSR2"].forEach(signal => {
  process.on(signal, onTerminated.bind(undefined, signal));
});

logger.info("Loading locales...");
// eslint-disable-next-line @typescript-eslint/no-floating-promises
initLocalization(config.debug, config.defaultLanguage).then(() => {
  // ボット開始
  bot.run();
});

async function reportError(err: any){
  if(!config.errorChannel) return;

  try{
    await bot.client.rest.channels.createMessage(config.errorChannel, {
      content: stringifyObject(err),
    }).catch(() => {});
  }
  catch(e){
    logger.error(e);
  }
}
