# v4.4.0
お待たせしました！長らくバグ修正等、ボットの改善にお時間を頂き申し訳ありません‼
## 機能追加
* 参加サーバー数や接続中サーバー数をステータスに表示する機能(@TAKUANf, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2775, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2806)
  * 表示には、`config.json`で、設定が必要です。詳しくは、[ドキュメント](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/setup/installation/configuration#showguildcountstatus-boolean--undefined)をご参照ください。
## 機能修正・変更
* `バルク削除`コマンドは、14日以上前のメッセージを削除することはできません(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2804)
  * もともとAPIの仕様がそうだったらしいです。
  * ドキュメントに追記しました。
## バグ修正
* 一部の条件下で正常に再生されない問題を修正(@TAKUANf, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2775)
* Node.js v16での互換性の問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2788)
* 特定の条件下で'channel'を読み取れない旨のエラーが発生する問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2800)
  * 特定の条件下がまだわからないため、エラーメッセージが表示された方は、情報を提供いただけると嬉しいです。
* 特定の条件下で、ボットがボイスチャンネルから切断した・されたときに、エラー発生する問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2801)
* 一部のソースの楽曲が意図せず正常に追加できない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2802)
* 14日以上前のメッセージをバルク削除しないよう修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2804)
## ドキュメント
* バルク削除に関する注意を追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2804)
## 依存関係のアップデート
* @distube/ytdl-core 4.14.4 => 4.16.3
* @sinclair/typebox 0.33.9 => 0.34.16
* dotenv 16.4.5 => 16.4.7
* i18next 23.15.0 => 24.2.2
* i18next-fs-backend 2.3.2 => 2.6.0
* node-html-parser 6.1.13 => 7.0.1
* spotify-url-info 3.2.16 => 3.2.18
* tslib 2.7.0 => 2.8.1
* undici 5.28.4 => 5.28.5
### Optional
* @discordjs/opus 0.9.0 => 0.10.0
* mongodb 6.8.1 => 6.13.0
## その他の変更
* 翻訳の更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2727)
* ワークフローの修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2789)
* ワークフローでNode.js v22でもテストする(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2790)

### その他の特記事項
#### 貢献者
* @TAKUANf の貢献が含まれています、ありがとうございます！
#### 再生時のエラーについて
現在、一部の環境において、一部のソースにおいて正常に楽曲が再生されない問題が確認されています。
これは、大手VPS、クラウドサービス、および公開プロキシ、VPNなどの環境下で高確率で発生することが確認されています。
今後、プロキシ機能を再実装することを視野に入れ、改善を行う予定です。  
本リリースでも、一定程度の改善が見込まれますが、完全な修正ができていないこと、あらかじめご承知おきください。
#### Node.jsのバージョンについて
Node.js v16以上の環境で動作することを想定していますが、できれば最新のLTS版を推奨しています。  
古いバージョンの場合、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
#### Dockerについて
* Dockerのイメージは、リリース後10～20分程度で公開されます。
#### 本ボットの開発状況について（再掲）
* 現在、私(mtripg6666tdr)が非常に忙しく、本ボットの機能強化に時間を割くことができない状態です。現在、多くの機能要望等をいただいておりますが、今しばらくお待ちいただければ幸いです。今後ともよろしくお願いいたします。
* 引き続きバグ修正は最優先事項として対処していきますので、バグを発見された際はお気軽にissueを開くか、サポートサーバーまでお知らせください。
* 随時Pull Requestも受け付けております。開発にご協力いただける方は、ぜひともよろしくお願いします。

[**マイルストーン**](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/milestone/16?closed=1)(空)

---

# v4.4.1
## バグ修正
* メッセージの表記ゆれを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2813)
* ボットのステータス更新を必要以上にしないよう修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2814)
* オートコンプリートが機能しない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2815)
* ラジオ機能が動作しない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2816)
* 一定の条件下で参加サーバーの情報が意図せず出力される問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2817)
## 依存関係のアップデート
* @sinclair/typebox 0.34.16 => 0.34.21
### その他の特記事項
#### 再生時のエラーについて
現在、一部の環境において、一部のソースから楽曲が正常に再生されない問題が確認されています。
これは、大手VPS、クラウドサービス、および公開プロキシ、VPNなどの環境下で高確率で発生することが確認されています。
今後、プロキシ機能を再実装することも視野に入れながら、継続的に改善を行う予定です。  
このバージョンでも、完全な修正ができていないこと、あらかじめご了承ください。
#### Node.jsのバージョンについて
Node.js v16以上の環境で動作することを想定していますが、できれば最新のLTS版を推奨しています。  
古いバージョンの場合、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
#### Dockerについて
* Dockerのイメージは、リリース後10～20分程度で公開されます。
#### 本ボットの開発状況について（再掲）
* 現在、私(mtripg6666tdr)が非常に忙しく、本ボットの機能強化に時間を割くことができない状態です。現在、多くの機能要望等をいただいておりますが、今しばらくお待ちいただければ幸いです。今後ともよろしくお願いいたします。
* 引き続きバグ修正は最優先事項として対処していきますので、バグを発見された際はお気軽にissueを開くか、サポートサーバーまでお知らせください。
* 随時Pull Requestも受け付けております。開発にご協力いただける方は、ぜひともよろしくお願いします。

---

# v4.4.2
## その他の変更
* Docker イメージのベースイメージを更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2821)
  * `20-bullseye` => `22-bookworm`
  * Docker イメージのビルドに失敗するのを修正します(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2820)
### その他の特記事項
#### 再生時のエラーについて
現在、一部の環境において、一部のソースから楽曲が正常に再生されない問題が確認されています。
これは、大手VPS、クラウドサービス、および公開プロキシ、VPNなどの環境下で高確率で発生することが確認されています。
今後、プロキシ機能を再実装することも視野に入れながら、継続的に改善を行う予定です。  
このバージョンでも、完全な修正ができていないこと、あらかじめご了承ください。
#### Node.jsのバージョンについて
Node.js v16以上の環境で動作することを想定していますが、できれば最新のLTS版を推奨しています。  
古いバージョンの場合、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
#### Dockerについて
* Dockerのイメージは、リリース後10～20分程度で公開されます。
#### 本ボットの開発状況について（再掲）
* 現在、私(mtripg6666tdr)が非常に忙しく、本ボットの機能強化に時間を割くことができない状態です。現在、多くの機能要望等をいただいておりますが、今しばらくお待ちいただければ幸いです。今後ともよろしくお願いいたします。
* 引き続きバグ修正は最優先事項として対処していきますので、バグを発見された際はお気軽にissueを開くか、サポートサーバーまでお知らせください。
* 随時Pull Requestも受け付けております。開発にご協力いただける方は、ぜひともよろしくお願いします。

---

# v4.4.3
## バグ修正
* ラジオ機能で、ラジオ機能の検出精度を向上しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2829)
## ドキュメント
* [公開ボット/コミュニティリソース](https://web.usamyon.moe/Discord-SimpleMusicBot/community-resources)を追加しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2828)
## 依存関係のアップデート
* @distube/ytdl-core 4.16.3 => 4.16.4
* @sinclair/typebox 0.34.21 => 0.34.25
## その他の変更
* 寄付のボタンをリポジトリに追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2823)
* eslint を v8 から v9 に更新しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2787)
### その他の特記事項
#### 再生時のエラーについて
現在、一部の環境において、一部のソースから楽曲が正常に再生されない問題が確認されています。
これは、大手VPS、クラウドサービス、および公開プロキシ、VPNなどの環境下で高確率で発生することが確認されています。
今後、プロキシ機能を再実装することも視野に入れながら、継続的に改善を行う予定です。  
このバージョンでも、完全な修正ができていないこと、あらかじめご了承ください。
#### Node.jsのバージョンについて
Node.js v16以上の環境で動作することを想定していますが、できれば最新のLTS版を推奨しています。  
古いバージョンの場合、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
#### Dockerについて
* Dockerのイメージは、リリース後10～20分程度で公開されます。
#### 本ボットの開発状況について（再掲）
* 現在、私(mtripg6666tdr)が非常に忙しく、本ボットの機能強化に時間を割くことができない状態です。現在、多くの機能要望等をいただいておりますが、今しばらくお待ちいただければ幸いです。今後ともよろしくお願いいたします。
* 引き続きバグ修正は最優先事項として対処していきますので、バグを発見された際はお気軽にissueを開くか、サポートサーバーまでお知らせください。
* 随時Pull Requestも受け付けております。開発にご協力いただける方は、ぜひともよろしくお願いします。

---
