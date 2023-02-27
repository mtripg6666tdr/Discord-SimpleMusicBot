---
sidebar_position: 1
---
# Cloning the repository directly
You can run the bot by cloning the repository (by `git`) to run the bot.

## Prerequirements
Running the bot by this way, you must meet below requirements.

:::info
The prerequirements dependes on the version of the bot. This page explains that for v3. Refer [README in the v2 branch (Japanese)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/tree/v2#readme) to see that for v2.
:::

### Minumum requrements
- Node.js from v12 to v18 supports the device and has been installed.
- `npm` is available.
- `ffmpeg`is available.
- `git` is available.

:::note 
- `ffmpeg` will be downloaded automatically by `npm` when it installs the dependencies so you don't have to download in advance or export `PATH`. However in some enviroments `npm` fails to download the proper `ffmpeg`. If so you have to download and setup `ffmpeg` manually.
- When you have to install `ffmpeg` manually, you should choose the latest version of it.
- If both of the ffmpeg installed manually and that installed by `npm` are available, the bot will use the latter one.
:::

### Recommendation
- Python 2.x or 3.x installed
- If you use the Unix series, `nscd` should be installed and running.

:::note
`nscd` can be installed via `apt` or other package managers.
:::

### Note
- Cloudflare WARP might prevent the bot from running correctly, so if your bot doesn't work correctly please turn it off.

## Steps

### 1. Clone
Go to the directory where you want to be install and run:

```bash
# cloning the repisitory
git clone https://github.com/mtripg6666tdr/Discord-SimpleMusicBot.git
# go into the directory
cd Discord-SimpleMusicBot
```
We recommend that you specify the latest version because the master branch is also used in development and might have the known bugs.
When you want to use v3.4.0 for instance, run as:
```bash
git reset --hard v3.4.0
```

Running the following command starts to install depepdencies.
```bash
npm install
```

### 2. Configuration
To run the bot, you have to configure the bot. See ["Configuration"](./configuration) and configure. `.env` file and `config.json` file should be placed in the same directory as `package.json`.

### 3. Transpile and run
Type the following commands:
```bash
# Transpilation
npm run build
# Run
npm run onlystart
```
  
:::tip
You can also use the one command below in order to transpile and start the bot in one line.
```bash
npm run start
```
:::

From the next time you run it, just type `npm run onlystart`.

Note that slash-commands are registered automatically. See [the page](../feature/slashcommand.md) to learn more about the slash-commands.

## Updating the bot
Run the following commands for example to get the bot up-to-date.
```bash
# Update the code
git fetch
git reset --hard <the latest version>
# Update dependencies
npm install
# Transpilation
npm run build
# Run
npm run onlystart
```

:::tip
You can also use the one command below in order to transpile and start the bot in one line.
```bash
npm run start
```
:::
