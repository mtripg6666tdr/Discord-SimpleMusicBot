export function parseQuery(url:string){
  return Object.assign({}, ...(url.substring(2).split("&").map(q => q.split("=")).map(qs => ({[decodeURIComponent(qs[0])]:decodeURIComponent(qs[1])}))));
}

export type GuildData = {[guildId:string]:string};