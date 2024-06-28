const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let nodePath = "node";

if(fs.existsSync("./node_modules/node/bin/node.exe")){
  nodePath = "node_modules\\node\\bin\\node.exe";
}else if(fs.existsSync("./node_modules/.bin/node")){
  nodePath = "node_modules/.bin/node";
}

const result = spawnSync(nodePath, ["--version"]);

const version = result.stdout.toString().trim();
console.log("Node.js " + version + " detected");
const nodeOptions = [];
const nodeMajor = Number(version.substring(1).split(".")[0]);
if(nodeMajor >= 17){
  nodeOptions.push("--dns-result-order=ipv4first");
}
console.log("Options:", nodeOptions.join(" ") || "<NONE>");
console.log("Starting...");
console.log("===========");

const main = spawn(
  nodePath,
  nodeOptions.concat(process.argv.slice(2)),
  {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  }
);

main.on("exit", (code) => process.exit(code));
