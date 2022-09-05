/*
 * Copyright 2021-2022 mtripg6666tdr
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

import "../dotenv";
import type { RouteLike } from "@discordjs/rest";
import type { APIApplicationCommand } from "discord-api-types/v10";

import { REST } from "@discordjs/rest";

const rest = new REST({version: "10"}).setToken(process.env.TOKEN);

module.exports = function(route:RouteLike){
  (async ()=>{
    try{
      let data = null as APIApplicationCommand[];
      data = await rest.get(route) as typeof data;
      await Promise.all(data.map(async (c, i) => {
        await rest.delete(route + "/" + c.id as RouteLike);
        console.log(c.name, "was deleted", "#" + i);
      }));
      process.exit(0);
    }
    catch(e){
      console.error(e);
    }
  })();
};
