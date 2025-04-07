# v4.5.0
## 機能追加
* 再生開始時にボイスチャンネルやステージチャンネルのトピックを更新する設定(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2900, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2902)
  * [`設定>トピック更新`コマンド](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/guide/commands/setting_updatetopic)
* 「フルキャッシュ」というキャッシュレベルを追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2903)
  * [キャッシュについてのページ](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/setup/feature/cache)をご参照ください
## バグ修正
* 一部のソースの再生が失敗する問題を軽減(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2893, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2898, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2905)
  * 内部的な話では、一度失敗したストラテジーをスキップすることにより、バックアップのストラテジーによる再生成功率が増加し、軽減することが見込まれます。
* 副音声がある音楽について、副音声の再生をしない(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2894)
* 特別コマンドがスラッシュコマンド経由で実行された際に正しく引数が解釈されない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2901)
* 必要以上にイベントハンドラが設定されていた問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2904)
## 依存関係のアップデート
* @sinclair/typebox 0.34.30 => 0.34.31
## その他の変更
* Docker イメージの構成時に、phantomjs を構成するように(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2893, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2897)

### その他の特記事項
#### 設定ファイルの再設定を行うことをお勧めします
いくつかの設定が追加されました。設定ファイルの説明ページをご覧の上、設定ファイルを更新してください。
新規で追加されたり、設定項目が変更になったりしたものは以下の通りです。
* `.env`
  * `VISITOR_DATA`
  * `PO_TOKEN`
  * `TSG_URL`
* `config.json`
  * `cacheLevel`

→ ドキュメント: [ボットの設定について](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/installation/configuration)
#### 再生時のエラーについて
現在、一部の環境において、一部のソースから楽曲が正常に再生されない問題が確認されています。
これは、大手VPS、クラウドサービス、および公開プロキシ、VPNなどの環境下で高確率で発生することが確認されています。
プロキシ機能を再実装することも視野に入れながら、継続的に改善を行っています。  
このバージョンでも、軽減策が導入されていますが、完全な修正ができていないこと、あらかじめご了承ください。
#### Node.jsのバージョンについて
Node.js v16以上の環境で動作することを想定していますが、できれば最新のLTS版を推奨しています。  
古いバージョンの場合、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
#### Dockerについて
* Dockerのイメージは、リリース後10～20分程度で公開されます。
#### 本ボットの開発状況について
* 現在、私(mtripg6666tdr)が非常に忙しく、本ボットの機能強化に時間を割くことができない状態です。現在、多くの機能要望等をいただいておりますが、今しばらくお待ちいただければ幸いです。今後ともよろしくお願いいたします。
* 引き続きバグ修正は最優先事項として対処していきますので、バグを発見された際はお気軽にissueを開くか、サポートサーバーまでお知らせください。
* 随時Pull Requestも受け付けております。開発にご協力いただける方は、ぜひともよろしくお願いします。

[**マイルストーン**](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/milestone/18?closed=1)

---

# v4.5.1
## 依存関係のアップデート
* @distube/ytdl-core 4.16.5 => 4.16.8
* @sinclair/typebox 0.34.31 => 0.34.33
* html-entities 2.5.3 => 2.6.0
## その他の変更
* `TSG_URL`を`compose.yml`で設定している場合、イメージのURLを、フォークしたプロジェクトに変更することを推奨します。
  * とはいえ、これらの設定で再生が改善しない場合があることも同時に確認されていますので、設定自体の必要性には疑問が残ります。
  * 変更については、ドキュメントの[ボットの設定について](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/installation/configuration)をご参照ください。
### その他の特記事項
#### 再生時のエラーについて
現在、一部の環境において、一部のソースから楽曲が正常に再生されない問題が確認されています。
これは、大手VPS、クラウドサービス、および公開プロキシ、VPNなどの環境下で高確率で発生することが確認されています。
プロキシ機能を再実装することも視野に入れながら、継続的に改善を行っています。  
このバージョンでも、軽減策が導入されていますが、完全な修正ができていないこと、あらかじめご了承ください。
#### Node.jsのバージョンについて
Node.js v16以上の環境で動作することを想定していますが、できれば最新のLTS版を推奨しています。  
古いバージョンの場合、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
#### Dockerについて
* Dockerのイメージは、リリース後10～20分程度で公開されます。
#### 本ボットの開発状況について
* 現在、私(mtripg6666tdr)が非常に忙しく、本ボットの機能強化に時間を割くことができない状態です。現在、多くの機能要望等をいただいておりますが、今しばらくお待ちいただければ幸いです。今後ともよろしくお願いいたします。
* 引き続きバグ修正は最優先事項として対処していきますので、バグを発見された際はお気軽にissueを開くか、サポートサーバーまでお知らせください。
* 随時Pull Requestも受け付けております。開発にご協力いただける方は、ぜひともよろしくお願いします。

---
