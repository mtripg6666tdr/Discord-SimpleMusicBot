const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const nodeOptions = [];
const nodeMajor = Number(process.versions.node.split(".")[0]);
if(nodeMajor >= 17){
  nodeOptions.push("--dns-result-order=ipv4first");
}

let nodePath = "node";

if(fs.existsSync("./node_modules/.bin/node.cmd")){
  nodePath = "node_modules\\.bin\\node.cmd";
}else if(fs.existsSync("./node_modules/.bin/node")){
  nodePath = "node_modules/.bin/node";
}

console.log("OPTIONS:", nodeOptions.join(" ") || "<NONE>");

const main = spawn(
  nodePath,
  nodeOptions.concat(process.argv.slice(2)),
  {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  }
);
main.on("exit", (code) => console.log(code));

main.ref();
