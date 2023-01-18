// @ts-check
require("dotenv").config();
const eris = require("eris");
const candyget = require("candyget");
/** @type {*} */
const { TOKEN, CHANNEL_ID, GITHUB_REF } = process.env;
if(!GITHUB_REF.includes("v3")){
  console.log("No notification needed");
  process.exit(0);
}
const client = new eris.Client(TOKEN, {
  intents: ["guilds"]
});
client.once("ready", async () => {
  (candyget.defaultOptions.headers || (candyget.defaultOptions.headers = {}))["User-Agent"] = "mtripg6666tdr/Discord-SimpleMusicBot Actions";
  const { html_url: htmlUrl, name, draft } = await candyget.json("https://api.github.com/repos/mtripg6666tdr/Discord-SimpleMusicBot/releases/latest").then(res => res.body);
  const ogpImage = await candyget.buffer("https://opengraph.githubassets.com/1/mtripg6666tdr/Discord-SimpleMusicBot/releases/tag/" + name).then(res => {
    if(!res.headers["content-type"]?.startsWith("image/")) throw new Error("No image detected");
    return res.body;
  });
  if(!draft){
    const message = await client.createMessage(CHANNEL_ID, {
      content: `**お知らせ**\r\n${name}リリース🎉\r\nリリースノート: <${htmlUrl}>`,
    }, {
      name: "unknown.png",
      file: ogpImage
    });
    await message.crosspost().catch(() => {});
  }
  client.disconnect({
    reconnect: false,
  });
  console.log("Post successfully");
  process.exit(0);
}).connect();
