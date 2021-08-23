/*
 * Wrapper to run main bot on replit
 */
const { spawn, execSync } = require("child_process");
if(process.argv[2] == "-s"){
  execSync("npm i node@v14-lts");
  execSync("cp node_modules/node/bin/* ./");
  execSync("npm r node");
}else{
  const main = spawn("./node", ["dist"]);
  main.stdout.on("data", e => console.log(e.toString()));
  main.stderr.on("data", e => console.error(e.toString()));
}