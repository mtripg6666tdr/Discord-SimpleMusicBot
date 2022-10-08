---
sidebar_position: 8
---
# アドオン機能
ちょっとした追加コマンドなどを実装する際にアドオン機能を使用することができます。

  アドオン機能を追加するには、プロジェクトの`src`フォルダと同じ階層に`addon`フォルダを作成します。
  ボットは、addonフォルダにある拡張子がjsのファイルを自動的にアドオンとして実行します。  
  `サンプル.js`
  ```js
module.exports = function(parent){
  console.log("aaa");
  parent.on("ready", ()=> {
    console.log("Ready called!");
  });
}
  ```
  jsファイルは、関数ひとつをデフォルトエクスポートしてください。関数はボットの起動時に呼ばれ、引数を一つ受け取ります。  
  引数は`EventEmitter`となっており、`discord.js`の`Client.on`、`Client.once`、`Client.off`などと同じようにイベントハンドラを設定することができます。
  サポートされるイベント名は`ready`、`messageCreate`、`interactionCreate`です。イベントの引数は、`discord.js`と同じです。
  - イベントをハンドルして本来のボットの操作を中断したりフィルターしたりすることはできません。
  - イベントはボットの本来の動作の前に呼ばれます。
