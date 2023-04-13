// @ts-check
require("dotenv").config();
const oceanic = require("oceanic.js");
const candyget = require("candyget");
/** @type {*} */
const { TOKEN, CHANNEL_ID, GITHUB_REF } = process.env;
if(!GITHUB_REF.includes("v4")){
  console.log("No notification needed");
  process.exit(0);
}
const client = new oceanic.Client({
  auth: `Bot ${TOKEN}`,
  gateway: {
    intents: ["GUILDS"],
  },
});
client.once("ready", async () => {
  (candyget.defaultOptions.headers || (candyget.defaultOptions.headers = {}))["User-Agent"] = "mtripg6666tdr/Discord-SimpleMusicBot Actions";
  const apiData = await candyget.json("https://api.github.com/repos/mtripg6666tdr/Discord-SimpleMusicBot/releases/latest").then(res => res.body);
  const { html_url: htmlUrl, name, draft } = apiData;
  const ogpImage = await candyget.buffer("https://opengraph.githubassets.com/1/mtripg6666tdr/Discord-SimpleMusicBot/releases/tag/" + name).then(res => {
    if(!res.headers["content-type"]?.startsWith("image/")) throw new Error("No image detected");
    return res.body;
  });
  if(!name){
    throw new Error(`No name detected: ${apiData}`);
  }
  if(!draft){
    const message = await client.rest.channels.createMessage(CHANNEL_ID, {
      content: `**お知らせ**\r\n${name}リリース🎉\r\nリリースノート: <${htmlUrl}>`,
      files: [
        {
          name: "unknown.png",
          contents: ogpImage,
        }
      ],
    });
    await message.crosspost().catch(() => {});
  }
  client.disconnect(false);
  console.log("Post successfully");
  process.exit(0);
}).connect();
