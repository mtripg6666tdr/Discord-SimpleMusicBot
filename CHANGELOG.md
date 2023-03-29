# v4.0.0-beta.0
**これは、プレリリースバージョンです**
## 機能追加
* 新しいキャッシュシステムを追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1166)
  * 二つのキャッシュレベル`"memory"`と`"persistent"`の二段階が`config.json`で設定できます
  * `"memory"`を設定した場合、楽曲のデータをメモリにキャッシュし、次に同じ楽曲がリクエストされた際にそれを利用します。
    * ループ機能を使用した際などにも高速化が期待できます。
    * 同じ曲を何曲も追加した際にメモリの増加が無くなり、メモリ使用の減少が見込めます。
    * メモリキャッシュは一定期間で自動的に削除されます。
  * `"persistent"`に設定した場合、上記のメモリキャッシュに加え、`cache`フォルダに永続的なデータをキャッシュします。
    * ディスク容量に余裕がある場合、こちらを設定することをおすすめします。
    * データには実際の音声データは含まれていません。
  * `システム情報`コマンドにて、メモリキャッシュの数および永続キャッシュの合計容量を確認できます。
  * `invoke sp;purgememcache`にてメモリキャッシュを、`invoke sp;purgediskcache`で永続キャッシュを削除できます(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1190)
  * `cache`フォルダに保存されるファイルは任意のタイミングで削除することができます。
* テキストチャンネルおよびボイスチャンネル以外の、スレッドチャンネル、テキストボイスチャンネル、ステージチャンネルで利用可能になりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1168)
* データベースを使用した際に、再生の分析情報が保存されるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1170)
  * ビューワーなどの開発は未定です
* ボットのニックネームに:u7a7a:、:stop_button:が含まれていた場合、ボイスチャンネルに参加した際にそれぞれ:u6e80:、:arrow_forward:に自動的に変更することで、ボイスチャンネルに参加しているかがわかりやすくなる機能の追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1177, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1178)
  * 退出すると元の絵文字に戻ります
* 日本語以外の言語に対応しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1173)
  * 翻訳に協力していただける方々を募集中です
  * [Crowdinのプロジェクトページ](https://ja.crowdin.com/project/discord-simplemusicbot)でよろしくお願いします。
* スラッシュコマンドの`再生`コマンドで、添付ファイルからの再生に対応しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1191)
* メッセージを右クリック/ホールドして実行できるコマンドが追加されました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1203)
  * `キューに追加されました`の埋め込みなどのメッセージに対して`再生`コマンドを実行することでキューに追加/再生できます。
  * `エクスポート`コマンドにより出力されたメッセージの上で右クリックして`インポート`を実行することでインポートできます。
## 機能変更/修正
* `debug`が`true`の際にも、`config.json`に`errorChannel`が設定されていれば、チャンネルにログを送信する(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1131)
* `config.json`で、多くのキーが必須になりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1142)
  * [ドキュメント](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/installation/configuration)をご覧の上アップデートしてください。
* `システム情報`コマンドで表示される内容の修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1147)
* カスタムロガーを廃止し、ライブラリを使用するようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1150)
  * パフォーマンスの向上が期待できます。
  * 新しいログレベルとして`TRACE`が追加されました。
* 一部のスラッシュコマンドが変更となりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1155)
  * `study` => `bgm`
  * `dc` => `disconnect`
  * `mv` => `move`
  * `np` => `nowplaying`
  * `rmall` => `removeall`
* 一部のコマンドが変更となりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1155)
  * `ヘルプ`コマンドのエイリアスに`support`が追加されました。
  * `アップタイム`コマンドの`ピング`確認機能が、`ピング`コマンドに分割されました。
* 環境変数`GAS_URL`および`GAS_TOKEN`がそれぞれ`DB_URL`および`DB_TOKEN`に変更されました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1170)
* HTTPベースのボット独自のデータベースが廃止されました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1170)
* `インポート`コマンドでキューの埋め込みからインポートすることはできなくなりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1203)
## バグ修正
* スキップの投票が機能しない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1163)
  * v3で https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1162 で修正された問題のv4側の修正です
* データベースなどの準備が正しく終了するまでボットがコマンドを受け入れないようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1170)
* コストのデータを正しくリセットする(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1210)
  * v3で https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1209 で修正された問題のv4側の修正です
## ドキュメント
* ドキュメントの継続的な変更(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1114, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1165, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1169)
## 依存関係のアップデート
* 依存関係の更新は、対応Node.jsのバージョンの変更やメインライブラリの変更などを通して追加/変更/削除が多いため、変更ログをご参照ください。
## その他の変更
* `bot.ts`の分割(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1124)
* コードの改善(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1132, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1171)
* コアのライブラリを`eris`から`oceanic.js`に変更(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1126)
* スラッシュコマンドの同期機能が改善されました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1159, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1160)
* インタラクションの処理を改善しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1161)

## その他の特記事項
* v4.0.0-beta.0はプレリリースのベータ版です。**`config.json`で`debug`を`true`に設定しないと起動しないようになっています。**
* v4系では、Node.js v16.16以上が必須となります

[マイルストーン](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/milestone/2?closed=1)

---

# v4.0.0-beta.1
## その他の変更
* Dockerのイメージが壊れている問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1220)
## その他の特記事項
* これはプレリリースのベータ版です。**`config.json`で`debug`を`true`に設定しないと起動しないようになっています。**
* v4系では、Node.js v16.16以上が必須となります

---

# v4.0.0-beta.2
**これは、プレリリースバージョンです**
## 機能追加
* 関数の実行時間に関するログを、一部の関数で再度追加しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1227)
* Replit Databaseがバックアップ用のサーバーとして利用可能になりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1251)
* HTTPベースのボット独自のデータベースを復活しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1252)
## バグ修正
* `キュー内を検索`コマンドが失敗する場合がある問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1248)
* `システム情報`コマンドでサーバーアイコンに関するバグを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1253)
## ドキュメント
* ロガーが内部的に使用するポート番号の変更方法を追記(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1249)
## 依存関係のアップデート
* @sinclair/typebox 0.25.24 => 0.26.4
* html-to-text 9.0.4 => 9.0.5
* i18next 22.4.11 => 22.4.13
## その他の変更
* 継続的な翻訳(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1207, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1225, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1228, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1254, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1256, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1257)
* 現状にそぐわない古いメッセージを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1255)

## その他の特記事項
* これはプレリリースのベータ版です。**`config.json`で`debug`を`true`に設定しないと起動しないようになっています。**
* v4系では、Node.js v16.16以上が必須となります。
* Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.0.0-beta.3
**これは、プレリリースバージョンです**
## 機能追加
* サーバーのロケールを取得するよう試みる(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1263)
* サーバーからキックされた/サーバーが削除された際にデータベースのデータを可能な場合削除する(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1266)
## バグ修正
* 権限の文言を翻訳(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1267)
## ドキュメント
* ドキュメントの継続的なアップデート(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1265)
## その他の変更
* 継続的な翻訳(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1262, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1264)

## その他の特記事項
* これはプレリリースのベータ版です。**`config.json`で`debug`を`true`に設定しないと起動しないようになっています。**
* v4系では、Node.js v16.16以上が必須となります。
* Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.0.0-beta.4
**これは、プレリリースバージョンです**
## バグ修正
* 一部の音楽の再生が途中で終了する・エラーで止まる問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1280)
* 状態のバックアップが動作していない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1282)
* 予期せず必要以上にバイナリの更新確認を行う問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1284)
* `コマンド`コマンドの間違った表示を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1289)
## ドキュメント
* ネイティブライブラリ用のビルドツールの必要性についてドキュメントに明記(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1273)
* 言語の決定方法や設定方法などについてのドキュメントの追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1283)
## その他の変更
* 継続的な翻訳(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1269, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1277, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1288, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1290)
* Docker-Composeで利用できるようサンプルファイルを追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1275)
* Dockerイメージに一部のオプションの依存関係が欠落していた問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1276)

## その他の特記事項
* これはプレリリースのベータ版です。**`config.json`で`debug`を`true`に設定しないと起動しないようになっています。**
* v4系では、Node.js v16.16以上が必須となります。
* Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.0.0-beta.5
**これは、プレリリースバージョンです**
## バグ修正
* ボイスチャンネルに参加せずに検索を使用した際にエラーが発生する問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1297)
* `最後の曲を先頭に`コマンドのメッセージ内容が正しくないのを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1298)
* `検索`コマンドで送信されるボタンのラベルが間違っている問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1303)
* `現在再生中`コマンドがエラーで失敗することがある問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1304)
## 依存関係のアップデート
* @mtripg6666tdr/oceanic-command-resolver 1.0.0-alpha.8 => 1.0.0-alpha.9
* @sinclair/typebox 0.26.5 => 0.26.7
* candyget 0.5.3 => 0.5.4
## その他の変更
* 継続的な翻訳(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1299, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1300, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1301, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1302, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1306)

## その他の特記事項
* これはプレリリースのベータ版です。**`config.json`で`debug`を`true`に設定しないと起動しないようになっています。**
* v4系では、Node.js v16.16以上が必須となります。
* Dockerのイメージは、リリース後30～40分程度で公開されます。

---
