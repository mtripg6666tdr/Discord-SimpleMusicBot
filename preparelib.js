const { exec } = require("child_process");

const dirs = __dirname.replace(/\\/g, "/").split("/");
if(dirs[dirs.length - 2] === "node_modules"){
  console.log("Preparing library...");
  exec("npx tsc -p tsconfig.lib.json");
}