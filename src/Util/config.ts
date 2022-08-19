import * as fs from "fs";
import * as path from "path";
import CJSON from "comment-json";

type ConfigJson = {
  adminId: string, 
  debug: boolean, 
  maintenance: boolean, 
  errorChannel: string, 
  proxy: string,
  prefix:string,
}

const rawConfig = fs.readFileSync(path.join(__dirname, "../../config.json"), {encoding: "utf-8"});

const config = Object.assign({
  prefix: ">",
}, CJSON.parse(rawConfig, null, true)) as unknown as ConfigJson;

if(![
  config.adminId === null || typeof config.adminId === "string",
  typeof config.debug === "boolean",
  config.errorChannel === null || typeof config.errorChannel === "string",
  typeof config.maintenance === "boolean",
  config.proxy === null || typeof config.proxy === "string",
  (typeof config.prefix === "string" && config.prefix.length >= 1) || config.prefix === null,
].every(test => test)){
  throw new Error("Invalid config.json");
}

export const { prefix, adminId, debug, errorChannel, maintenance, proxy } = config;