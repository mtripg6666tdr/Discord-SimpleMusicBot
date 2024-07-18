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

const candyget = require("candyget");

async function main(){
  const latestReleaseRes = await candyget.json("https://api.github.com/repos/mtripg6666tdr/Discord-SimpleMusicBot/releases/latest");
  if(latestReleaseRes.statusCode !== 200){
    throw new Error("Failed to get the latest release.");
  }

  // e.g., "v4.1.6"
  const latestVersion = latestReleaseRes.body.name;

  const hookRes = await candyget.post(process.env.HOOK_URL, "string", {
    headers: {
      "CF-Access-Client-Id": process.env.HOOK_CLIENT_ID,
      "CF-Access-Client-Secret": process.env.HOOK_CLIENT_SECRET,
    },
  }, {
    name: "ghcr.io/mtripg6666tdr/discord-music-bot",
    tag: latestVersion.substring(1),
  });

  if(hookRes.statusCode !== 202){
    throw new Error(`Failed to hook updating to the version. Status: ${hookRes.statusCode}, Body: ${hookRes.body}`);
  }
}

void main();
