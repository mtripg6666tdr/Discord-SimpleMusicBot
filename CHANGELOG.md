# v4.2.0
## 機能追加
* ライブ動画に発行されるURLを解釈できるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2032)
* ドライブのファイルのタイトルが表示されるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2062)
* 音声ファイルのタイトルがメタデータに記録されている場合それを抽出して表示するようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2127)
* いくつかの新しい音声エフェクトを追加しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2140)
* DJロールに"DJ"以外の名前が利用できるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2147)
  * [`config.json`の`djRoleNames`](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/setup/installation/configuration#djrolenames-string--null--undefined)で変更が可能です。
* 利用状況に関するデータを収集するようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2157)
  * 詳しくは[ドキュメント](https://sr.usamyon.moe/dsmb-telemetry)を参照してください。
## 機能修正/変更
* 音量調整が改善され、音量の数字が実際に聞こえる音の大きさにより近くなりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1651)
* 時間がたって古くなったキャッシュを自動的に無効化するようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2145)
  * 旧バージョンよりエラーの発生回数が減ることが見込まれます
* 特定の条件を満たした際に、スラッシュコマンドを一括上書き更新することで立ち上がるまでの時間を短くしました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2146)
<!-- ## バグ修正 -->
## ドキュメント
* リンク切れを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2090)
* 音声エフェクトのドキュメントを追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2148)
* Replitのガイドは継続して保守できないと判断し削除(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2166)
* ドキュメントの継続的な更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2126)
## 依存関係のアップデート
* @discordjs/voice 0.16.0 => 0.16.1
* @sinclair/typebox 0.31.17 => 0.31.28
* candyget 0.5.5 => 0.5.6
* i18next-fs-backend 2.2.0 => 2.3.1
* spotify-url-info 3.2.8 => 3.2.10
### Optional
* @distube/ytsr 1.2.0 => 2.0.0
  * このバージョンからオプション(optional)になりました。
* mongodb 6.1.0 => 6.3.0
* zlib-sync 0.1.8 => 0.1.9
## その他の変更
* ワークフローで使用されるNode.jsのバージョンをv20に更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1494)
* Dockerで使用されるNode.jsのバージョンをv20に更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1495)
* 継続的な翻訳の更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2099, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2122)
* 内部のユーティリティ関数の改善(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2138)
* 音声エフェクトの内部構造の改善(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2139)

### その他の特記事項
#### 利用状況に関するデータの収集について
ボットの利用状況に関する匿名の情報と、発生した想定されていないエラーに関するログを自動的に収集するようになりました。
これらのデータはボットの機能改善に活用されます。
詳細は、<https://sr.usamyon.moe/dsmb-telemetry>を参照してください。
#### Node.jsのバージョンについて
Node.js v16以上の環境で動作することを想定していますが、できれば最新のLTS版を推奨しています。  
古いバージョンの場合、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
#### Dockerについて
* Dockerのイメージは、リリース後30～40分程度で公開されます。
#### 本ボットの開発状況について（再掲）
* 現在、私(mtripg6666tdr)が非常に忙しく、本ボットの機能強化に時間を割くことができない状態です。現在、多くの機能要望等をいただいておりますが、今しばらくお待ちいただければ幸いです。今後ともよろしくお願いいたします。
* 引き続きバグ修正は最優先事項として対処していきますので、バグを発見された際はお気軽にissueを開くか、サポートサーバーまでお知らせください。
* 随時Pull Requestも受け付けております。開発にご協力いただける方は、ぜひともよろしくお願いします。

---
