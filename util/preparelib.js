const { execFileSync } = require("child_process");
const path = require("path");

const dirs = __dirname.replace(/\\/g, "/").split("/");
if(dirs[dirs.length - 3] === "node_modules"){
  console.log("Preparing library...");
  let commandLine = ["npx", "tsc", "-p", path.join(__dirname, "../tsconfig.lib.json")];
  if(process.platform === "win32"){
    commandLine = ["cmd", "/c", ...commandLine];
  }
  const executable = commandLine.shift();
  execFileSync(executable, commandLine);
}