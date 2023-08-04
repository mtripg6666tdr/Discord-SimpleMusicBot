const candyget = require("candyget");

async function main(){
  const latestReleaseRes = await candyget.json("https://api.github.com/repos/mtripg6666tdr/Discord-SimpleMusicBot/releases/latest");
  if(latestReleaseRes.statusCode !== 200){
    throw new Error("Failed to get the latest release.");
  }

  // e.g., "v4.1.6"
  const latestVersion = latestReleaseRes.body.name;

  const hookRes = await candyget.post(process.env.HOOK_URL, "empty", {
    headers: {
      "CF-Access-Client-Id": process.env.HOOK_CLIENT_ID,
      "CF-Access-Client-Secret": process.env.HOOK_CLIENT_SECRET,
    },
  }, {
    name: "ghcr.io/mtripg6666tdr/discord-music-bot",
    tag: latestVersion.substring(1),
  });

  if(hookRes.statusCode !== 202){
    throw new Error("Failed to hook updating to the version.");
  }
}

void main();
