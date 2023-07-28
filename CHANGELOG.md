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
