// @ts-check
require("dotenv").config();
const eris = require("eris");
const miniget = require("miniget");
/** @type {*} */
const { TOKEN, CHANNEL_ID } = process.env;
const client = new eris.Client(TOKEN, {
  intents: ["guilds"]
});
client.once("ready", async () => {
  const headers = {
    "User-Agent": "mtripg6666tdr/Discord-SimpleMusicBot Actions"
  };
  const { html_url: htmlUrl, name, draft } = JSON.parse(await miniget("https://api.github.com/repos/mtripg6666tdr/Discord-SimpleMusicBot/releases/latest", {headers}).text());
  const ogpImage = await new Promise(resolve => {
    /** @type {Buffer[]} */
    const bufs = [];
    miniget("https://opengraph.githubassets.com/1/mtripg6666tdr/Discord-SimpleMusicBot/releases/tag/" + name, {headers})
      .on("data", chunk => bufs.push(chunk))
      .on("end", () => resolve(Buffer.concat(bufs)))
    ;
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
  process.exit(0);
}).connect();
