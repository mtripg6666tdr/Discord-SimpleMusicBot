const fs = require("fs");
const path = require("path");
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
  fs.mkdirSync(newDocsDir);
  await copy(path.join(__dirname, "./docs"), newDocsDir);
  const sidebars = require("./sidebars");
  fs.writeFileSync(
    path.join(__dirname, "./versioned_sidebars/", "version-" + versionPrefix + "-sidebars.json"),
    prettyJs(JSON.stringify(sidebars), prettyJsOption),
  );
  const versionsFilePath = fs.readFileSync(path.join(__dirname, "./versions.json"));
  const versions = JSON.parse(versionsFilePath, {encoding: "utf-8"});
  versions.push(versionPrefix);
  fs.writeFileSync(
    versionsFilePath,
    prettyJs(JSON.stringify(versions), prettyJsOption),
  );
})();
