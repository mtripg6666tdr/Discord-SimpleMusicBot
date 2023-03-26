# v3.11.0
## 機能追加
* 検索結果から再生した場合もキャンセルボタンを表示する(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1102)
* Spotifyのアルバムを解決できるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1103)
* 検索パネルのタイムアウトを追加しました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1105)
* すでに検索パネルが開かれている状態で検索コマンドが使用された際に、すでに開いている検索を破棄するボタンを表示するようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1105)
* 管理者向けに参加サーバーの分析機能を追加(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1110)
  * 詳細はお問い合わせください。
## 機能修正/変更
* BGM機能で設定した音量が、ノーマルキューでの音量と別に管理されるようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1104)
* HTTPベースのデータベースが機能しないバグを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1107)
* ボイスチャンネルへの参加失敗時にスタックトレースを表示しないよう変更(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1111)
## バグ修正
* 検索パネルの削除に関するいくつかのバグの修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1105)
* 複数のURLを再生コマンドなどに渡した際に正しく追加されないバグを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1106)
* 一部の環境でのボットのシャットダウン時のエラーを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1113)
## ドキュメント
* ドキュメントの継続的な更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1099, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1100, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1108)
## 依存関係のアップデート
## その他の変更

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

[**マイルストーン**](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/milestone/12?closed=1)

---

# v3.11.1
## バグ修正
* `システム情報`コマンドを使用すると、場合によってはエラーが発生する問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1123)
* デバッグモードでも、エラーレポート用のチャンネルが指定された場合、エラーを書き込む(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1127, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1135)
## その他の変更
* v4の開発開始に伴う変更・ドキュメントの更新等(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1114, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1115, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1116, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1125)

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v3.11.2
## バグ修正
* Node.jsのバージョンを正しく取得できておらず、DNS解決の問題が起きる可能性があったバグを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1145)
## 依存関係のアップデート
* eris 0.17.1 => 0.17.2 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1154)

### その他の特記事項
- erisのアップデートが公開され、v3.11.2以前のv3.x系のすべてのバージョンで、今後数週間以内に音声接続が機能しなくなる可能性があります。そのため、v3.11.2へのアップデートを強く推奨します。

---

# v3.11.3
## バグ修正
* スキップ投票の画面が動作しない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1162)
* 頭出しコマンドと再生コマンドに関するバグを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1162)
* 検索コマンドのフッターが間違っていた問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1176)

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v3.11.4
## バグ修正
* 手動で停止した際に、内部のコスト情報をリセットする(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1209)
## 依存関係のアップデート
* @sinclair/typebox 0.25.24 => 0.26.0

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v3.11.5
## バグ修正
* `キュー内を検索`コマンドが失敗する問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/1247)
## 依存関係のアップデート
* @sinclair/typebox 0.26.0 => 0.26.2

### その他の特記事項
- Dockerのイメージは、リリース後30～40分程度で公開されます。

---
