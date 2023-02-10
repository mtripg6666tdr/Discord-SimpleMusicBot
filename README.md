# Discord-SimpleMusicBot 
[![GitHub package.json dynamic](https://img.shields.io/github/package-json/version/mtripg6666tdr/Discord-SimpleMusicBot)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/package.json)
[![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/mtripg6666tdr/Discord-SimpleMusicBot/eris)](https://github.com/abalabahaha/eris)
[![CI](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml)
[![CodeQL](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml)
[![Build Docker](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/build-docker.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/build-docker.yml)
[![Discord Support](https://img.shields.io/discord/847435307582095360?label=discord&logo=discord&logoColor=white)](https://discord.gg/7DrAEXBMHe)
[![GitHub License](https://img.shields.io/github/license/mtripg6666tdr/Discord-SimpleMusicBot)](LICENSE)

![Bot use image](https://user-images.githubusercontent.com/56076195/149505763-276ec199-44c5-4ccc-a72d-5ac630ff4c0f.png)

Discord向け日本製シンプル音楽ボット。  
YouTubeなどからの再生に対応。
選曲はキーワードで指定可能なのでURLを控える必要はありません。  
このOSSのBotで、みんなで今すぐVCで音楽を楽しみましょう。  
下部に掲載のサポートサーバーよりボットを試すことができます。お気軽にサポートサーバーにご参加ください。

## 機能
- 🎵できる限り高音質で再生
- ⌨️スラッシュコマンドおよび従来のメッセージベースのコマンドに両対応
- 🔗 URLから再生
  - YouTubeの動画のリンク
  - YouTubeのプレイリストのリンク
  - SoundCloudの楽曲ページのリンク
  - ニコニコ動画の再生ページへのリンク
  - [などなど...](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/commands/overview)
- 🔎 キーワードから検索して再生(YouTubeとSoundCloud)
- 🔁 トラックごと及びキュー全体でループ
- ❕ プレフィックス変更
  - デフォルトのプレフィックスは`>`です。
  - ボットを自分でホストする場合、後述の`config.json`でボットレベルでデフォルトのプレフィックスを変更することができます。(複数文字に対応)
- ▶️事前設定による音楽の自動再生
- 👍 Botに関するサポート(下記)

## ガイド
ボットの設定方法、コマンドなどはこちらからご覧になれます。  
- [ドキュメント](https://web.usamyon.moe/Discord-SimpleMusicBot/)

## 貢献について
開発中のためバグが多々あります。  
本リポジトリへの貢献は大歓迎です！  
バグを発見した場合等も重複したIssueがないことを確認し、Issueをまず開いてください。可能な場合、Pull Requestをそのうえで開いてください。  
Issueのほか、下記のサポートサーバーでも各種お問い合わせを受け付けています。  
いづれかの手段でお気軽にどうぞ！  

## サポート
Discordにて、インストール等のサポート、およびアップデートのお知らせ等を行っています。  
ボットを試すこともできますので、興味を持たれた方はぜひご参加ください。  
[サポートサーバーへの参加はこちら](https://discord.gg/7DrAEXBMHe)  

### サポートされているバージョン
|バージョン|Node.js|discord.js|eris|サポート状況|サポート範囲|サポート終了[予定]日|
|:---------|-------|----------|----|:----------|:----------:|------------------:|
|[v1](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/tree/v1)|>=12.0.0|^12.0   |-|:x:サポート終了|-|2021/08|
|[v2](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/tree/v2)|>=16.6.0|<=13.6.0|-|:x:サポート終了|-|2022/12|
|[v3(master)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/tree/master)|>=12 |-|@latest|:white_check_mark:サポート中|フルサポート|未定|

## ライセンス
GPLv3  
詳細は[COPYING](COPYING)を参照。
