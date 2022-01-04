// @ts-check
require("dotenv").config();
const { MusicBot } = require("../dist/lib");
const CJSON = require("comment-json");
const fs = require("fs");
const path = require("path");

if(!fs.existsSync(path.join(__dirname, "../config.json"))){
  const config = CJSON.parse(fs.readFileSync(path.join(__dirname, "../config.json.sample"), {encoding:"utf-8"}));
  Object.keys(config).forEach(key => {
    if(config[key] === "") config[key] = null;
  });
  fs.writeFileSync(path.join(__dirname, "../config.json"), JSON.stringify(config), {encoding:"utf-8"});
}
const bot = new MusicBot(false);
bot.client.on("ready", ()=>{
  bot.client.destroy();
  console.log("🎉Everything seems to work fine");
  process.exit(0);
});
bot.Run(process.env.TOKEN, false);