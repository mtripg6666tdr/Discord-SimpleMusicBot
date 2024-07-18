#!/usr/bin/env node

/*
 * Copyright 2021-2024 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

// @ts-check
const fs = require("fs");
const path = require("path");
const config = require("../dist/config").getConfig();

let overview = `# コマンド一覧
この節では、ボットで使用できるコマンドのほとんどが解説されています。

:::info
詳細な説明ではないため、各コマンドの使用法について疑問があれば、サポートまでお問い合わせください。
:::

<div class="no-wrap-table">

|コマンド名|概要|
|:--------|:---|
`;

require("../dist/i18n").initLocalization(false, config.defaultLanguage).then(() => {
  const { CommandManager } = require("../dist/Component/commandManager");
  // const { categories, categoriesList } = require("../dist/Commands/commands");

  const commandDocPath = path.join(__dirname, "../docs/docs/guide/commands/");

  const existingFiles = new Set(fs.readdirSync(commandDocPath));
  existingFiles.delete("_category_.json");
  existingFiles.delete("overview.md");

  /**
   * @type { import("../src/Commands").BaseCommand[] }
   */
  const commands = new CommandManager().commands.filter(
    /**
     * @param { import("../src/Commands").BaseCommand } c 
     * @returns { boolean }
     */
    c => !c.unlist
  );

  for(let i = 0; i < commands.length; i++){
    const cmd = commands[i];
    const filename = `${cmd.asciiName.replaceAll(">", "_")}.md`;
    if(existingFiles.has(filename)){
      existingFiles.delete(filename);
    }
    fs.writeFileSync(path.join(commandDocPath, filename), `---
sidebar_label: ${cmd.name}
---
# \`${cmd.name}\`コマンド
${cmd.description}

スラッシュコマンドでは、\`/${cmd.asciiName.replaceAll(">", " ")}\`を使用してください。

## 別名
\`${cmd.name}\`以外にも以下の別名を使用できます。

${cmd.alias.map(alias => `- ${alias}`).join("\r\n")}

${cmd.usage ? `## 使い方\r\n\`\`\`\r\n${cmd.usage[config.defaultLanguage]}\r\n\`\`\`\r\n` : ""}
${cmd.examples ? `## 使用例\r\n\`\`\`\r\n${cmd.examples[config.defaultLanguage]}\r\n\`\`\`\r\n` : ""}

## 実行に必要な権限
${cmd.getLocalizedPermissionDescription(config.defaultLanguage)}

※管理者権限や、サーバーの管理権限、チャンネルの管理権限、および管理者権限を持つユーザーはこの権限を満たしていなくてもいつでもこのコマンドを実行できます。
\r\n`, {encoding: "utf-8"});

    overview += `|[${cmd.name}](./${cmd.asciiName.replaceAll(">", "_")}.md)|${cmd.description.replace(/\n/g, "")}|\r\n`
  }

  overview += "\r\n\r\n</div>";
  fs.writeFileSync(path.join(commandDocPath, "overview.md"), overview, { encoding: "utf-8" });

  existingFiles.forEach(file => fs.unlinkSync(path.join(commandDocPath, file)));

  process.exit(0);
});
