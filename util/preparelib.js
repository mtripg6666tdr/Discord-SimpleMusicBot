const { exec } = require("child_process");
const path = require("path");

const dirs = __dirname.replace(/\\/g, "/").split("/");
if(dirs[dirs.length - 3] === "node_modules"){
  console.log("Preparing library...");
  exec("npx tsc -p \"" + path.join(__dirname, "../tsconfig.lib.json\""));
}