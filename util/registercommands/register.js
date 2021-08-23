// @ts-check
require("dotenv").config();
const { REST } = require("@discordjs/rest");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { Command } = require("../../dist/Commands");
const rest = new REST({version: '9'}).setToken(process.env.TOKEN);

/**
 * 
 * @param { import("@discordjs/rest").RouteLike } route 
 */
module.exports = function(route){
  const commandsInfo = [];
  /**
   * @type { import("../../src/Commands").CommandInterface[] }
   */
  const commands = new Command().commands.filter(
    /**
     * 
     * @param { import("../../src/Commands").CommandInterface } c 
     * @returns { boolean }
     */
    c => !c.unlist
  );

  for(let i = 0; i < commands.length; i++){
    const builder = new SlashCommandBuilder();
    builder
      .setName(commands[i].alias.filter(c => c.match(/^[\w-]{2,32}$/))[0])
      .setDescription(commands[i].description);
    if(commands[i].argument){
      commands[i].argument.forEach(arg => {
        const addingOptionArgs = option =>
          option
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
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

  (async()=>{
    try{
      await rest.put(route, {
        body: commandsInfo
      });
    }
    catch(e){
      console.error(e);
    }
  })();
}