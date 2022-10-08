// @ts-check
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.json");
console.log(`Config path: ${configPath}`);
const alreadyExists = fs.existsSync(configPath);
console.log(alreadyExists ? "Config file exists" : "Config file not found");
const original = alreadyExists ? fs.readFileSync(configPath, {encoding: "utf-8"}) : null;
alreadyExists && console.log("Reading original config");
if(alreadyExists){
  fs.copyFileSync(configPath, path.join(__dirname, "../config.backup.temp.json"));
  console.log("Made backup of the original config file. If the config file is left overwritten, please remove config.json and rename config.backup.temp.json into config.json.");
}
const sampleJson = `
// Test is in progress now. Please do not modify this file
{
  "adminId": "123456", // 管理ユーザーのユーザーID (任意)、なければnull

  "debug": false, // デバッグ可能かどうか
  
  "maintenance": true, // メンテナンス中かどうか
  // ボットの操作を全封鎖するときのみ設定してください。

  "errorChannel": "987654", // エラーログを送信するテキストチャンネル、なければnull
  // エラーレポートを送るテキストチャンネルのID (任意)

  "proxy": "https://example.com", // HTTPプロキシのアドレス、なければnull

  "prefix": "<" // デフォルトプレフィックス、一文字。省略されたりnullなら\`>\`
}`;
fs.writeFileSync(configPath, sampleJson, {encoding: "utf-8"});
console.log("Successfully wrote the config for test");
const configLoaderPath = "../dist/Util/config";

describe("Config", function() {
  describe("#Load", function(){
    it("loading config without errors", function() {
      assert.ok(require(configLoaderPath));
    });
  });

  describe("#CheckValues", function(){
    const config = (mod => "default" in mod ? mod.default : mod)(require(configLoaderPath));
    /** @type {[string, string|boolean][]} */
    const tests = [
      ["adminId", "123456"],
      ["debug", false],
      ["maintenance", true],
      ["errorChannel", "987654"],
      ["proxy", "https://example.com"],
      ["prefix", "<"],
    ];

    tests.forEach(([prop, expected]) => {
      it(`${prop} is same as expected`, function(){
        assert.equal(config[prop], expected)
      });
    });
  })
});

let hasExited = false;
const onExit = () => {
  if(hasExited) return;
  hasExited = true;
  if(original){
    fs.writeFileSync(configPath, original, {encoding: "utf-8"});
    console.log("Config file was restored successfully");
  }else{
    fs.unlinkSync(configPath);
    console.log("Config file was removed successfully");
  }
};

process.once("exit", onExit);
process.once("uncaughtException", onExit);
