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

// @ts-check
require("dotenv").config();
const oceanic = require("oceanic.js");
const candyget = require("candyget");

/** @type {*} */
const { TOKEN, CHANNEL_ID, GITHUB_REF, ROLE_ID, REPO_NAME } = process.env;

candyget.defaultOptions.headers ??= {};
candyget.defaultOptions.headers["User-Agent"] = "mtripg6666tdr/Discord-SimpleMusicBot Actions";

async function main(){
  if(!GITHUB_REF.includes("v4")){
    console.log("No notification needed");
    process.exit(0);
  }

  // Get the latest release info
  const { body: apiData } = await candyget.json(`https://api.github.com/repos/${REPO_NAME}/releases/latest`);
  const { html_url: htmlUrl, name, draft } = apiData;

  // Get an OGP image for the release
  const ogpImage = await candyget.buffer(`https://opengraph.githubassets.com/1/${REPO_NAME}/releases/tag/${name}`)
    .then(res => {
      if(!res.headers["content-type"]?.startsWith("image/")) throw new Error("No image detected");
      return res.body;
    });

  if(!name){
    throw new Error(`No name detected: ${apiData}`);
  }

  if(!draft){
    // Send a message automatically if it is not a draft and there are sufficient data retrieved.
    const client = new oceanic.Client({ auth: `Bot ${TOKEN}` });

    const { id } = await client.rest.channels.createMessage(CHANNEL_ID, {
      content: `## ${name}リリース🎉${ROLE_ID ? `\r\n<@&${ROLE_ID}>` : ""}\r\nリリースノート: <${htmlUrl}>`,
      files: [
        {
          name: "unknown.png",
          contents: ogpImage,
        }
      ],
      allowedMentions: {
        roles: true,
      },
    });

    await client.rest.channels.crosspostMessage(CHANNEL_ID, id);

    console.log("Post successfully");
  }
}

void main();
