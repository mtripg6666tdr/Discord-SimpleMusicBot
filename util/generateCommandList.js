/*
 * Copyright 2021-2022 mtripg6666tdr
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
const { CommandManager } = require("../dist/Component/CommandManager");
const { categories, categoriesList } = require("../dist/Commands/commands");

/**
 * @type { import("../src/Commands").BaseCommand[] }
 */
const commands = new CommandManager().commands.filter(
  /**
   * @param { import("../src/Commands").BaseCommand } c 
   * @returns { boolean }
   */
  c => !c.unlist || !!c.permissionDescription
);

for(let i = 0; i < commands.length; i++){
  const cmd = commands[i];
  fs.writeFileSync(path.join(__dirname, `../docs/docs/commands/commands/${cmd.asciiName}.md`), `---
sidebar_label: ${cmd.name}
---
# \`${cmd.name}\`コマンド
${cmd.description}

## エイリアス
${cmd.alias.map(alias => `- ${alias}`).join("\r\n")}

${cmd.usage ? `## 使い方\r\n\`\`\`\r\n${cmd.usage}\r\n\`\`\`\r\n` : ""}
${cmd.examples ? `## 使用例\r\n\`\`\`\r\n${cmd.examples}\r\n\`\`\`\r\n` : ""}

## 実行に必要な権限
${cmd.permissionDescription}

※管理者権限や、サーバーの管理権限を持つユーザーはこの権限を満たしていなくてもいつでもこのコマンドを実行できます。
  \r\n`, {encoding: "utf-8"});
}

process.exit(0);
