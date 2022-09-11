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
  c => !c.unlist
);

let md = "";
/**
 * @param {string} line 
 */
const addLine = function(line){
  md += line + "\r\n";
};
addLine("# 利用可能なコマンド一覧");
addLine("本ボットで現在可能なコマンドの一覧です  ");
addLine("エイリアスの中にある文字列で代用することもできます(テキストベースのコマンド使用のみ)  ");
addLine("  ");
addLine("コマンドとは別に超省略形も使用することができます  ");
addLine("例: `!https://~`  ");
addLine("# 目次");
categoriesList.forEach(category => {
  addLine(`- [${categories[category]}](#${categories[category]})`);
})
/**
 * @type { {[key in keyof typeof categories]:import("../src/Commands").BaseCommand[] } }
 */
// @ts-ignore
const categorized = {};
commands.forEach(c => {
  if(categorized[c.category])
    categorized[c.category].push(c);
  else
    categorized[c.category] = [c];
});

categoriesList.forEach(category => {
  addLine(`## ${categories[category]}`);
  categorized[category].forEach(
    /**
     * @type { (command:import("../src/Commands").BaseCommand)=>void }
     */
    command => {
      addLine(`### \`${command.name}\`コマンド`);
      addLine(command.description + "  ");
      addLine(`- エイリアス`);
      addLine("  - `" + command.alias.join("`\r\n  - `") + "`");
      if(command.usage){
        addLine("- 使い方: `" + command.usage + "`");
      }
      if(command.examples){
        addLine("- 使用例: `" + command.examples + "`");
      }
      addLine("---");
    }
  )
  addLine("");
});
addLine(`(c) ${new Date().getFullYear()} mtripg6666tdr`);

fs.writeFileSync(path.join(__dirname, "../docs/commands.md"), md, {encoding:"utf-8"});
process.exit(0);
