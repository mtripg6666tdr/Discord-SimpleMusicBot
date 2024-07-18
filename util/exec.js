#!/usr/bin/env node

/*
 * Copyright 2021-2024 mtripg6666tdr
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

const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let nodePath = "node";

if(fs.existsSync("./node_modules/node/bin/node.exe")){
  nodePath = "node_modules\\node\\bin\\node.exe";
}else if(fs.existsSync("./node_modules/.bin/node")){
  nodePath = "node_modules/.bin/node";
}

const result = spawnSync(nodePath, ["--version"]);

const version = result.stdout.toString().trim();
console.log("Node.js " + version + " detected");
const nodeOptions = [];
const nodeMajor = Number(version.substring(1).split(".")[0]);
if(nodeMajor >= 17){
  nodeOptions.push("--dns-result-order=ipv4first");
}
console.log("Options:", nodeOptions.join(" ") || "<NONE>");
console.log("Starting...");
console.log("===========");

const main = spawn(
  nodePath,
  nodeOptions.concat(process.argv.slice(2)),
  {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  }
);

main.on("exit", (code) => process.exit(code));
