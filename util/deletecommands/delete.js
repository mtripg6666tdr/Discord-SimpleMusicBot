// @ts-check
require("dotenv").config();
const { REST } = require("@discordjs/rest");
const rest = new REST({version: '9'}).setToken(process.env.TOKEN);

/**
 * 
 * @param { import("@discordjs/rest").RouteLike } route 
 */
module.exports = function(route){
  (async()=>{
    try{
      /**
       * @type { import("discord-api-types").APIApplicationCommand[] }
       */
      let data = null;
      // @ts-ignore
      data = await rest.get(route);
      await Promise.all(data.map(async(c) => {
        // @ts-ignore
        console.log(await rest.delete(route + "/" + c.id));
      }));
      process.exit(0);
    }
    catch(e){
      console.error(e);
    }
  })();
}