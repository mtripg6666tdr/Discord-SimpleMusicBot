export function parseQuery(url:string):{[key:string]:string}{
  return Object.assign({}, ...(url.split("&").map(q => q.split("=")).map(qs => ({[decodeURIComponent(qs[0])]:decodeURIComponent(qs[1])}))));
}

export type GuildData = {[guildId:string]:string};