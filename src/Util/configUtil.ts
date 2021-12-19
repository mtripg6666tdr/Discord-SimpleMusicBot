import * as fs from "fs";
import * as path from "path";
import CJSON from "comment-json";
type ConfigJson = {
  adminId: string, 
  debug: boolean, 
  maintenance: boolean, 
  errorChannel: string, 
  proxy: string,
}

const config:ConfigJson = CJSON.parse(fs.readFileSync(path.join(__dirname, "../../config.json"), {encoding: "utf-8"}));

if(![
  config.adminId === null || typeof config.adminId === "string",
  typeof config.debug === "boolean",
  config.errorChannel === null || typeof config.errorChannel === "string",
  typeof config.maintenance === "boolean",
  config.proxy === null || typeof config.proxy === "string",
].every(test => test)){
  throw new Error("Invalid config.json");
}

export const { adminId, debug, errorChannel, maintenance, proxy } = config;