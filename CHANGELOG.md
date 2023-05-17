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
