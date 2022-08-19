require("dotenv").config();
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
            Object.keys(arg.choices).forEach(key => (option as SlashCommandIntegerOption).addChoices([[key, arg.choices[key] as number]]));
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
