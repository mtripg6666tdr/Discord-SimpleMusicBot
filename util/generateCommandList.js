// @ts-check
const fs = require("fs");
const path = require("path");
const { CommandsManager } = require("../dist/Commands");
const { categories, categoriesList } = require("../dist/Commands/commands");

/**
 * @type { import("../src/Commands").CommandInterface[] }
 */
const commands = new CommandsManager().commands.filter(
  /**
   * 
   * @param { import("../src/Commands").CommandInterface } c 
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
 * @type { {[key in keyof typeof categories]:import("../src/Commands").CommandInterface[] } }
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
     * @type { (command:import("../src/Commands").CommandInterface)=>void }
     */
    command => {
      addLine(`### \`${command.name}\`コマンド`);
      addLine(command.description + "  ");
      addLine(`#### エイリアス`);
      addLine("`" + command.alias.join("`, `") + "`");
      if(command.usage){
        addLine("#### 使い方");
        addLine(command.usage);
      }
      if(command.examples){
        addLine("#### 使用例");
        addLine(command.examples);
      }
    }
  )
  addLine("");
});
addLine(`(c) ${new Date().getFullYear()} mtripg6666tdr`);

fs.writeFileSync(path.join(__dirname, "../docs/commands.md"), md, {encoding:"utf-8"});
process.exit(0);