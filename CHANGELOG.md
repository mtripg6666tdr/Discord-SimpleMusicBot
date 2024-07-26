# v4.3.0
## 機能追加
* 一時停止中にボイスチャンネルのメンバーがボットのみになった際にも、一定時間経過後に自動的にボイスチャンネルから退出するようになりました(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2279)
* スキップ投票のオン・オフを切り替えられる機能を追加 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2280)
* 「現在再生中」パネルの表示設定を追加 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2280)
  * 「表示しない」「通知を送信しない」「通常送信（デフォルト）」の中から選べるようになりました。設定はサーバーごとに保持されます。
* 指定した時間経過したのちに、自動的にボイスチャンネルから切断する、スリープタイマー機能を追加 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2414)
* 最大五曲分まで、追加したい曲をキーワードベースで追加できる機能「バルク再生」を追加 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2428)
  * 従来でも、「再生」コマンドの引数として、URLを複数個スペース区切りで指定することにより、楽曲を複数、一括で追加することはできましたが、今回は、キーワードが複数あった場合でもできるような機能となります。
  * メッセージベースのコマンドの場合、スペースが引数の区切りと判断されるため、一つの楽曲を指定したつもりでもキーワードが複数あると別の楽曲として認識され、意図したとおりに動作しない場合があります。今後のリリースで修正する予定です。
    * 例：現在の仕様では、`曲A 歌ってみた`と「バルク再生」を実行した場合、実際には、曲Aの歌ってみたを検索したいにも関わらず、`曲A`と`歌ってみた`がそれぞれ楽曲検索され二曲分追加されます。
## 機能修正/変更
* よりスムーズに再生されるよう表示を改善 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2416, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2432)
* コンソールに表示されるログの文言を一部修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2427)
## バグ修正
* BGM 機能が有効の場合、一定の条件下でBGM機能が無効にできない問題を修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2239)
* `SIGINT`でプロセスを終了しようとした際、`undefined`と表示される問題を修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2262)
* ニコニコ動画の再生に関する問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2407, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2408)
* ボットにコマンドを送信していなくても通常のチャットでレートリミットがかかってしまう問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2412)
* 楽曲を削除したり、移動すると、均等再生を設定していても適切にソートされない問題を修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2415)
* 「フレーム」コマンドを実行時に表示される奇妙な小数点以下の数値を修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2430, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2441)
* 特定の条件下で、曲を追加した際に意図した場所と違う位置に曲が追加される問題を修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2442)
## ドキュメント
* Replit で使用する方法のページをドキュメントサイトから削除 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2167)
  * Replitでのホストは、来年以降Replit Deploymentsを利用する必要があり、Replit Deploymentsは完全有料なため、ドキュメントの保守が不可能になったためです。
  * もし、Replit Deploymentsを有償でご利用されている方で、ドキュメントを執筆していただける方がいらっしゃれば、ぜひドキュメントの再度の執筆をお願いしたく思っております。ご迷惑をおかけいたしますが、何卒ご了承くださいませ。
* ドキュメントの継続的な更新 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2195, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2366, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2369, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2394, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2433)
## 依存関係のアップデート
* @mtripg6666tdr/oceanic-command-resolver 1.3.0 => 1.4.2
* @sinclair/typebox 0.31.28 => 0.32.34
* dotenv 16.3.1 => 16.4.5
* html-entities 2.4.0 => 2.5.2
* https-proxy-agent 7.0.2 => 7.0.4
* i18next 22.5.1 => 23.11.5
* oceanic.js 1.8.1 => 1.11.0
* spotify-url-info 3.2.10 => 3.2.15
* throttle-debounce 5.0.0 => 5.0.2
* tslib 2.6.2 => 2.6.3
* そのほか、数々の脆弱性の問題に対処
### Optional
* @distube/ytsr 2.0.0 => 2.0.4
* mongodb 6.3.0 => 6.7.0
## その他の変更
* 新しいビルド方式を試験的に導入 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2220)
  * 新しいビルド方式により、大量のファイルを数個のファイルに減らすことにより、メモリ消費が劇的に減少しました。
  * クローンして実行している場合、この機能を利用するには、通常とは異なる操作が必要です。
    * 詳細の方法については、[クローンして実行する](http://web.usamyon.moe/Discord-SimpleMusicBot/docs/setup/installation/normal)の最下部をご確認ください。
  * Docker や Docker Compose をご利用の場合、この機能はデフォルトで有効になっています。
* プレイリストパーサーとして新しいライブラリ(@distube/ytpl)を導入(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2260)
* Node.js v16 のサポートを継続 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2261)
* TypeScript の Strict Type Checking を有効化 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2277)
* コードベースの継続的な改善 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2371)
* ライセンスの年号を更新 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2413)

### その他の特記事項
#### Node.jsのバージョンについて
Node.js v16以上の環境で動作することを想定していますが、できれば最新のLTS版を推奨しています。  
古いバージョンの場合、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
#### Dockerについて
* Dockerのイメージは、リリース後30～40分程度で公開されます。
#### 本ボットの開発状況について（再掲）
* 現在、私(mtripg6666tdr)が非常に忙しく、本ボットの機能強化に時間を割くことができない状態です。現在、多くの機能要望等をいただいておりますが、今しばらくお待ちいただければ幸いです。今後ともよろしくお願いいたします。
* 引き続きバグ修正は最優先事項として対処していきますので、バグを発見された際はお気軽にissueを開くか、サポートサーバーまでお知らせください。
* 随時Pull Requestも受け付けております。開発にご協力いただける方は、ぜひともよろしくお願いします。

[**マイルストーン**](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/milestone/15?closed=1)

---

# v4.3.1
## バグ修正
* ボットが正常に終了しない問題を修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2447)
* エラー発生時のボットの挙動を修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2448)
## ドキュメント
* ドキュメントの継続的な更新 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2450)
## 依存関係のアップデート
### Optional
* mongodb 6.7.0 => 6.8.0

## その他の特記事項
* Node.jsは、最新のLTSのバージョンをご利用いただくことを強く推奨しています。v16以上であれば動作はしますが、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
* Dockerのイメージは、リリース後30～40分程度で公開されます。

---

# v4.3.2
## バグ修正
* 一部のコマンドを使用した際にクラッシュすることがある問題を修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2451)
* 再生中にエラーが発生した場合に、クラッシュすることがある問題を修正 (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2452)
## その他の変更
* Docker のアップデートによる仕様変更に合わせ、`docker-compose.yml`を`compose.yml`に変更し、`version`を削除するなどの対応を行いました (https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2454)
## その他の特記事項
* Node.jsは、最新のLTSのバージョンをご利用いただくことを強く推奨しています。v16以上であれば動作はしますが、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
* Dockerのイメージは、リリース後10～20分程度で公開されます。

---

# v4.3.3
## バグ修正
* 一部のソースで、音楽ソースの内容を正しく判断できず再生に失敗する問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2455)
* 均等再生機能を使用するとクラッシュする場合がある問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2470)
* 大文字にするとコマンドが使えない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2472)
* エラー発生時に、特定の条件下で長文のエラーメッセージが表示される問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2473)
* v4.3.0で導入された遅延メッセージ関連の機能をリファクタリングし、数々のバグを改善(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2474)
* 非公開の音楽ソースのURL等が漏洩する可能性のある問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2475)
* キュー追加位置の算出に問題があったため修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2477)
## 依存関係のアップデート
* comment-json 4.2.3 => 4.2.4
* https-proxy-agent 7.0.4 => 7.0.5
* spotify-url-info 3.2.15 => 3.2.16
## その他の特記事項
* Node.jsは、最新のLTSのバージョンをご利用いただくことを強く推奨しています。v16以上であれば動作はしますが、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
* Dockerのイメージは、リリース後10～20分程度で公開されます。

---

# v4.3.4
## バグ修正
* 一部のソースの再生が機能しなくなったのを暫定的に修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2479, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2482)
  * 今回の修正は暫定的な修正のため、以下の問題があります。
    * フレーム機能など一部の機能が機能しません。
    * 再生までに通常より長く時間がかかります。
  * 実際の修正は、提供可能になり次第パッチリリースとして再度提供する予定です。
* ドキュメントのリンクを修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2481)
## その他の特記事項
* Node.jsは、最新のLTSのバージョンをご利用いただくことを強く推奨しています。v16以上であれば動作はしますが、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
* Dockerのイメージは、リリース後10～20分程度で公開されます。

---

# v4.3.5
## バグ修正
* 一部のソースの再生が機能しなくなったのを暫定的に修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2484, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2491)
  * 暫定的・応急的な修正の第二弾です。
  * 再生まで通常より長く時間がかかるなどの問題が発生する可能性があります。
  * 追加の修正を行い次第、パッチリリースを再度提供する予定です。
* エラー発生時にメッセージが荒れる問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2485)
* 一部の条件下でキューに曲を追加できない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2492)
## 依存関係のアップデート
* libsodium-wrappers 0.7.13 => 0.7.14
## その他の特記事項
* Node.jsは、最新のLTSのバージョンをご利用いただくことを強く推奨しています。v16以上であれば動作はしますが、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
* Dockerのイメージは、リリース後10～20分程度で公開されます。

---

# v4.3.6
本修正に取り組む予定ではありますが、現時点で都合により数週間ほど着手できないことがわかっているので、現時点までに実装したバグ修正をリリースします。（そのため今回のリリースも応急パッチの扱いとなります。）
## バグ修正
* 一定の条件下で、プレイリスト追加時のサムネイルが表示されない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2495)
* 一定の条件下で、エラー発生時にその旨のメッセージが送信されないことがある問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2498)
* エラー発生時に、キャッシュを確実にクリアするよう修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2503)
* ラジオ機能使用時に、ラジオ機能によって追加された曲と思われる場合のみ、キューに曲が追加されるよう修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2504)
  * 完全な判定ではないため、一定の条件下で、ラジオ機能によって追加された曲でなくても曲が追加されることがあります~~が、誤差ということでご理解ください~~。
* 一部のソースの再生が機能しなくなったのを暫定的に修正後、一部の環境で再生が安定しない問題を緩和(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2507, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2511)
* `ログ`コマンドで、依存関係のパッケージのバージョンが正しく表示されない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2509)
## ドキュメント
* ドキュメントの継続的な更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2496)
## 依存関係のアップデート
* i18next 23.11.5 => 23.12.1
## その他の特記事項
* Node.jsは、最新のLTSのバージョンをご利用いただくことを強く推奨しています。v16以上であれば動作はしますが、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
* Dockerのイメージは、リリース後10～20分程度で公開されます。

---

# v4.3.7
## バグ修正
* ラジオ機能がうまく動作していない問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2513)
## その他の特記事項
* Node.jsは、最新のLTSのバージョンをご利用いただくことを強く推奨しています。v16以上であれば動作はしますが、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
* Dockerのイメージは、リリース後10～20分程度で公開されます。

---

# v4.3.8
## バグ修正
* 一部のソースの再生が機能しなくなったのを暫定的に修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2534, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2537)
  * 引き続き必要に応じて修正パッチをリリースしていきます。
* `この曲で終了`コマンドの表示を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2535)
* ラジオ機能で再生失敗が複数回起きた時などにキューが無限に長くなる問題を修正(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2538)
## ドキュメント
* ドキュメント上でサポートされている Node.js のバージョンを更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2518)
  * 正確にいつからかはわからないですが、v16.16以前のバージョンでも動作するようになっています。
  * 現在、ボットの動作に必要な最低限の Node.js のバージョンは v16.4 です。
* ドキュメントの継続的な更新(https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2526, https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/pull/2527)
## 依存関係のアップデート
* oceanic.js 1.10.0 => 1.11.1
* i18next 23.12.1 => 23.12.2
* @sinclair/typebox 0.32.34 => 0.32.35
## その他の特記事項
* Node.jsは、最新のLTSのバージョンをご利用いただくことを強く推奨しています。v16以上であれば動作はしますが、一部機能が制限されることがあります。詳しくは[こちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support#nodejs%E3%81%AE%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E3%81%AB%E3%82%88%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%AE%E9%81%95%E3%81%84)をご覧ください。
* Dockerのイメージは、リリース後10～20分程度で公開されます。

---
