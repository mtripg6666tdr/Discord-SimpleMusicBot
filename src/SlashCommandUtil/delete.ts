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
