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
import type { SlashCommandBooleanOption, SlashCommandIntegerOption, SlashCommandStringOption } from "@discordjs/builders";
import type { RouteLike } from "@discordjs/rest";

import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";

import { CommandsManager } from "../Commands";

const rest = new REST({version: "9"}).setToken(process.env.TOKEN);

module.exports = function(route:RouteLike){
  const commandsInfo = [];
  // @ts-ignore
  const commands = (new CommandsManager() as CommandsManager).commands.filter(c => !c.unlist);

  for(let i = 0; i < commands.length; i++){
    const builder = new SlashCommandBuilder();
    builder
      .setName(commands[i].alias.filter(c => c.match(/^[\w-]{2,32}$/))[0])
      .setDescription(commands[i].description);
    if(commands[i].argument){
      commands[i].argument.forEach(arg => {
        const addingOptionArgs = function<T extends SlashCommandBooleanOption|SlashCommandIntegerOption|SlashCommandStringOption>(option:T){
          option
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required);
          if(arg.choices && Object.keys(arg.choices).length > 0){
            Object.keys(arg.choices).forEach(key => (option as SlashCommandIntegerOption).addChoices({
              name: key,
              value: arg.choices[key] as number
            }));
          }
          return option;
        };
        switch(arg.type){
        case "bool":
          builder.addBooleanOption(addingOptionArgs);
          break;
        case "integer":
          builder.addIntegerOption(addingOptionArgs);
          break;
        case "string":
          builder.addStringOption(addingOptionArgs);
          break;
        }
      });
    }
    commandsInfo.push(builder.toJSON());
  }

  (async ()=>{
    try{
      console.log(await rest.put(route, {
        body: commandsInfo
      }));
      process.exit(0);
    }
    catch(e){
      console.error(e);
    }
  })();
};
