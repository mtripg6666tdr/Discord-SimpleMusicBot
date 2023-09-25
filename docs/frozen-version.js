// @ts-check
/** @type {import("fs")} */
const fs = require("fs");
/** @type {import("path")} */
const path = require("path");
/** @type {import("recursive-copy").default} */
const copy = require("recursive-copy");
const prettyJs = require("pretty-js");
// ex. v3.9.0
const version = process.env.VERSION;
const versionPrefix = version.split(".").slice(0, 2).join(".");
const prettyJsOption = {
  indent: "  ",
  quoteProperties: true,
  trailingNewline: true,
};

(async () => {
  const newDocsDir = path.join(__dirname, "./versioned_docs/version-" + versionPrefix);
  if(!fs.existsSync(newDocsDir)){
    fs.mkdirSync(newDocsDir);
  }
  await copy(path.join(__dirname, "./docs"), newDocsDir);
  const supportInfoFilePath = path.join(newDocsDir, "setup", "support.md");
  if(fs.existsSync(supportInfoFilePath)){
    fs.unlinkSync(supportInfoFilePath);
  }
  const sidebars = require("./sidebars");
  fs.writeFileSync(
    path.join(__dirname, "./versioned_sidebars/", "version-" + versionPrefix + "-sidebars.json"),
    prettyJs(JSON.stringify(sidebars), prettyJsOption),
  );
  const versionsFilePath = path.join(__dirname, "./versions.json");
  const versions = JSON.parse(fs.readFileSync(versionsFilePath, {encoding: "utf-8"}));
  versions.unshift(versionPrefix);
  fs.writeFileSync(
    versionsFilePath,
    prettyJs(JSON.stringify(versions), prettyJsOption),
  );
})();
