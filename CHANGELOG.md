# v4.1.0
## 機能追加
* Spotifyの短縮リンクを処理できるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1569, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1609)
* カスタムストリームでflacファイルを再生できるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1570)
* 複数台のボット運用時に、別のボットからキューをインポートしたり、埋め込みから再生したりできるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1571)
* 一部のソースのURLを非表示にする機能を追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1572)
* ニコニコ動画の検索機能を追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1576, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1589)
* スラッシュコマンドから、URL等を公開しないまま楽曲を再生する機能(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1585)
* ミックスリストを再生できるラジオ機能を追加しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1611, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1633, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1634
* メモリキャッシュの最大数を制限しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1636)
## 機能修正/変更
* `proxy`が非推奨になりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1557)
* エフェクトとボリューム調整が両方オンの時に、呪いのような音声が再生される問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1577)
* ボイスチャンネルのメンバー数を数える際、ボットのアカウントを除外してカウントするように変更(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1579)
* `バルク削除`コマンドがスラッシュコマンドから利用できるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1599)
## バグ修正
* 再生に失敗した時の再試行の挙動を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1500)
* ログで、別のサーバーIDが表示される問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1568)
* 非公開のドライブのファイルを再生しようとしたときに、エラーになるよう修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1578)
* 非同期処理のエラーを正しく補足するように修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1581)
* コマンドの権限が満たしていない場合の挙動を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1586)
## ドキュメント
* インストール方法の順序を、推奨される順番に変更(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1530)
* ドキュメントの継続的な更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1531, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1630, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1632, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1610, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1640, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1642)
* 環境変数`PORT`に関する説明を追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1588, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1637, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1638)
## 依存関係のアップデート
* @mtripg6666tdr/oceanic-command-resolver 1.0.0 => 1.1.1
* @sinclair/typebox 0.28.1 => 0.28.10
* https-proxy-agent 5.0.1 => 6.1.0
* spotify-url-info 3.2.3 => 3.2.4
## その他の変更
* 継続的な翻訳(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1580, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1584, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1590, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1620)
* TypeScriptの構成を最適化(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1582)

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。
- Node.js v20を正式にサポートしました。

---

# v4.1.1
## バグ修正
* `ヘルプ`コマンドにニコニコ動画の検索を追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1645)
* 一部のメッセージベースのコマンドが反応しない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1646)

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.1.2
## バグ修正
* ボタンを押すとクラッシュする場合がある問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1649)

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.1.3
## バグ修正
* 複数のアイテムをキューに追加する際に発生する可能性のあったエラーを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1652)

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.1.4
## バグ修正
* 一部の環境で、`ログ log`コマンドが動作しない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1812)
* `リセット`コマンドの挙動を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1813, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1817)
* 切断時に、リソースを確実に破棄するよう修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1817)
* 検索が失敗することの回避策として、代替ライブラリによるフォールバック検索を追加することにより修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1814)
* リソースの取得中に再生がキャンセルされた場合、準備中かどうかを判断するフラグを確実にリセットする(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1815)
## ドキュメント
* BGM機能は、v4.0.0で正式機能になっているため、表記を更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1673)
## 依存関係のアップデート
* @mtripg6666tdr/oceanic-command-resolver 1.1.1 => 1.2.0
* @sinclair/typebox 0.28.10 => 0.29.1
* dotenv 16.0.3 => 16.3.1
* html-entities 2.3.3 => 2.4.0
* https-proxy-agent 6.1.0 => 7.0.0
* i18next 22.4.15 => 22.5.1
* i18next-fs-backend 2.1.1 => 2.1.5
* miniget 4.2.2 => 4.2.3
* oceanic.js 1.6.0 => 1.7.1
* soundcloud.ts 0.5.0 => 0.5.1
* spotify-url-info 3.2.4 => 3.2.5
* tslib 2.5.0 => 2.6.0
### Optional
* mongodb 5.5.0 => 5.6.0
## その他の変更
* 不要な依存関係(@types/follow-redirects)を削除(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1720)

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.1.5
## バグ修正
* 検索結果の表示が奇妙なのを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1862)
* 一部環境でのエラー発生時に表示が荒れる問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1871)
* SpotifyのURLからの再生に関するいくつかの問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1872)
* 新しいユーザー名システムの導入に関する問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1874)
* BGM機能が有効になっているサーバーで発生するバグの調査で見つかった問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1875)
* Twitter (X) からの音楽ソースが再生されない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1876)
## ドキュメント
* flacファイルのサポートを明記(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1824)
* ドキュメントの継続的な更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1849, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1850)
## 依存関係のアップデート
* @sinclair/typebox 0.29.1 => 0.29.6
* https-proxy-agent 7.0.0 => 7.0.1
* soundcloud.ts 0.5.1 => 0.5.2
* tslib 2.6.0 => 2.6.1
* ytdl-core 4.11.4 => 4.11.5
### Optional
* mongodb 5.6.0 => 5.7.0
## その他の変更
* `package-lock.json`のバージョンをアップデート(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1818)
## その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.1.6
## バグ修正
* バージョンの誤表記の問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/issues/1878)
* プライベートなキューのアイテムが、`キュー内を検索`コマンドを使用すると、URLが漏れる問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1894)
## 依存関係のアップデート
* @sinclair/typebox 0.29.6 => 0.30.2
* spotify-url-info 3.2.5 => 3.2.6
## その他の特記事項
* BGM機能で、エラーが発生した際にリカバリーが効かない問題(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/issues/1757 )は、v4.1.5で加えた変更で修正されたようです。
* Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.1.7
## バグ修正
* 新しいユーザーシステム導入に関する問題を修正(二回目)(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1899)
  * まだバグが残ってましたので修正
* BGM再生時に発生したエラーに正しく対処されていなかった問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2010)
* Twitter(X)の動画の再生に関する問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2011)
## 依存関係のアップデート
* @distube/ytsr 1.1.9 => 1.1.11
* @sinclair/typebox 0.30.2 => 0.31.15
* candyget 0.5.4 => 0.5.5
* genius-lyrics 4.4.3 => 4.4.6
* https-proxy-agent 7.0.1 => 7.0.2
* tslib 2.6.1 => 2.6.2
* ytsr 3.8.2 => 3.8.4
* ffmpeg-static 5.1.0 => 5.2.0
* libsodium-wrappers 0.7.11 => 0.7.13
* mongodb 5.7.0 => 6.1.0
## その他の特記事項
* BGM機能で、エラーが発生した際にリカバリーが効かない問題(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/issues/1757 )は、「v4.1.5で加えた変更で修正されたようです。」とお伝えしておりましたが、まだ一部バグが残っていたのでそれに対処しました。
### Node.js v16.x.xについて
* Node.js v16のサポート終了に伴い、Oceanic.jsがNode.js v16でのサポートを打ち切る発表をしておりますが、本ボットでは引き続きNode.js v16.16.0以上の環境で動作するようサポートを行っていく予定です。
  * ただし、このサポートは、あくまでNode.js v18以上がインストールできない環境でボットを使用しているユーザーの方々のためです。Node.js v16には脆弱性があり、使用は推奨されていないため、Node.js v18以上を使用できる環境をご使用の場合には、必ずNode.js v18以上を使用してください。
### Dockerについて
* Dockerのイメージは、リリース後30～40分程度で公開されます。
* 現在、当方のミスによりDockerの`latest`タグがv3.11.10に貼られています。お手数おかけしますが、v4系をご利用でかつ昨日から今日までの間に`latest`タグでプルしてしまった方は、v4.1.7のイメージがプッシュされ次第、もう一度プルしていただきますようお願いいたします。
### 本ボットの開発について
* 現在、私(mtripg6666tdr)が非常に忙しく、本ボットの機能強化に時間を割くことができない状態です。現在、多くの機能要望等をいただいておりますが、今しばらくお待ちいただければ幸いです。今後ともよろしくお願いいたします。
* 引き続きバグ修正は最優先事項として対処していきますので、バグを発見された際はお気軽にissueを開くか、サポートサーバーまでお知らせください。

---
