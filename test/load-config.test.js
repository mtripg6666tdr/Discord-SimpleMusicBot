// @ts-check
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.json");
const alreadyExists = fs.existsSync(configPath);
const original = alreadyExists ? fs.readFileSync(configPath, {encoding: "utf-8"}) : null;
if(alreadyExists){
  fs.copyFileSync(configPath, path.join(__dirname, "../config.backup.temp.json"));
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

  "proxy": "example.com", // HTTPプロキシのアドレス、なければnull

  "prefix": "<" // デフォルトプレフィックス、一文字。省略されたりnullなら\`>\`
}`;
fs.writeFileSync(configPath, sampleJson, {encoding: "utf-8"});
const configLoaderPath = "../dist/Util/config"

describe("Config", function() {
  describe("#Load", function(){
    it("loading config without errors", function() {
      assert.ok(require(configLoaderPath));
    });
  });

  describe("#CheckValues", function(){
    const config = require(configLoaderPath);
    /** @type {[string, string|boolean][]} */
    const tests = [
      ["adminId", "123456"],
      ["debug", false],
      ["maintenance", true],
      ["errorChannel", "987654"],
      ["proxy", "example.com"],
      ["prefix", "<"],
    ];

    tests.forEach(([prop, expected]) => {
      it(`${prop} is same as expected`, function(){
        assert.equal(config[prop], expected)
      });
    });
  })
});

process.on("exit", () => {
  if(original){
    fs.writeFileSync(configPath, original, {encoding: "utf-8"});
  }else{
    fs.unlinkSync(configPath);
  }
});
