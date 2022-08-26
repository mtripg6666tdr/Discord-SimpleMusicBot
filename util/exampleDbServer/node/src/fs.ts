import * as fs from "fs";
import * as path from "path";

if(!fs.existsSync(path.join(__dirname, "../.data"))){
  fs.mkdirSync(path.join(__dirname, "../.data"));
}
const statusesPath = path.join(__dirname, "../.data/status.json");

export function getStatus(guildids:string[]){
  const statuses = (fs.existsSync(statusesPath) ? JSON.parse(fs.readFileSync(statusesPath, {encoding: "utf-8"})) : {}) as {[guildid:string]:string};
  const result = {} as {[guildid:string]:string};
  guildids.forEach(id => statuses[id] ? result[id] = statuses[id] : null);
  return result;
}

export function setStatus(data:{[guildid:string]:string}){
  const statuses = (fs.existsSync(statusesPath) ? JSON.parse(fs.readFileSync(statusesPath, {encoding: "utf-8"})) : {}) as {[guildid:string]:string};
  Object.keys(data).forEach(key => {
    if(data[key]){
      statuses[key] = data[key];
    }else if(statuses[key]){
      delete statuses[key];
    }
  });
  fs.writeFileSync(statusesPath, JSON.stringify(statuses), {encoding: "utf-8"});
}

export function getQueue(guildids:string[]){
  const result = {} as {[guildid:string]:string};
  guildids.forEach(id => {
    const jsonPath = path.join(__dirname, `../.data/${id}.json`);
    if(fs.existsSync(jsonPath)){
      result[id] = fs.readFileSync(jsonPath, {encoding: "utf-8"});
    }
  });
  return result;
}

export function setQueue(data:{[guildid:string]:string}){
  Object.keys(data).forEach(id => {
    const jsonPath = path.join(__dirname, `../.data/${id}.json`);
    fs.writeFileSync(jsonPath, data[id], {encoding: "utf-8"});
  });
}
