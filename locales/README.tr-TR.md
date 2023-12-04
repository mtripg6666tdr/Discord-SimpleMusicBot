# Discord-SimpleMusicBot
[![GitHub package.json dynamic](https://img.shields.io/github/package-json/version/mtripg6666tdr/Discord-SimpleMusicBot/master)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/package.json) [![GitHub package.json dependency version (prod)](https://img.shields.io/badge/dynamic/json?color=blue&label=oceanic.js&query=%24.dependencies%5B%22oceanic.js%22%5D&url=https%3A%2F%2Fraw.githubusercontent.com%2Fmtripg6666tdr%2FDiscord-SimpleMusicBot%2Fmaster%2Fpackage.json)](https://github.com/OceanicJS/Oceanic) [![CI](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml) [![CodeQL](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml) [![Build Docker](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/build-docker.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/build-docker.yml) [![Discord Support](https://img.shields.io/discord/847435307582095360?label=discord&logo=discord&logoColor=white)](https://sr.usamyon.moe/8QZw) [![Crowdin](https://badges.crowdin.net/discord-simplemusicbot/localized.svg)](https://crowdin.com/project/discord-simplemusicbot) [![GitHub License](https://img.shields.io/github/license/mtripg6666tdr/Discord-SimpleMusicBot)](LICENSE)

[日本語](/README.md)・[English](/locales/README.en-US.md)・[Français](/locales/README.fr-FR.md)

<img alt="bot usage example" src="https://user-images.githubusercontent.com/56076195/218059644-2ebdf405-b9f8-4561-a3cc-2bcecf09f145.png" width="550" />

Discord向け日本製シンプル音楽ボット。  
YouTubeなどからの再生に対応。 選曲はキーワードで指定可能なのでURLを控える必要はありません。  
このOSSのBotで、みんなで今すぐボイスチャンネルで音楽を楽しみましょう。  
下部に掲載のサポートサーバーよりボットを試すことができます。お気軽にサポートサーバーにご参加ください。

## 機能
- 🎵できる限り高音質で再生
- ⌨️スラッシュコマンドおよび従来のメッセージベースのコマンドに両対応
- 🔗 URLから再生
  - YouTubeの動画のリンク
  - YouTubeのプレイリストのリンク
  - SoundCloudの楽曲ページのリンク
  - ニコニコ動画の再生ページへのリンク
  - [などなど...](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/guide/feature/overview)
- 🔎 キーワードから検索して再生(YouTubeとSoundCloud)
- 🔁 トラックごと及びキュー全体でループ
- ❕ プレフィックス変更
  - ボットのニックネームを変更することで、サーバーごとにプレフィックスを変更できます。
  - ボットを自分でホストする場合、設定ファイルからボットレベルでデフォルトのプレフィックスを設定できます。
  - 複数文字に対応しています。
- ▶️事前設定による音楽の自動再生
- 👍 Botに関する[サポート](#サポート)(下記)

## ガイド
ボットの設定方法、コマンドなどはこちらからご覧になれます。
- [ドキュメント](https://web.usamyon.moe/Discord-SimpleMusicBot/)

## 貢献について
開発中のためバグが多々あります。  
本リポジトリへの貢献は大歓迎です！  
バグを発見した場合等も重複したIssueがないことを確認し、Issueをまず開いてください。可能な場合、Pull Requestをそのうえで開いてください。  
Issueのほか、下記のサポートサーバーでも各種お問い合わせを受け付けています。  
いづれかの手段でお気軽にどうぞ！

## ローカライズについて
プロジェクトでは、Crowdinで多言語化をしています。ボットの翻訳に協力してくださる方と、日本語か英語を話せる校正者の方を随時募集しています。  
翻訳元の言語は日本語です。翻訳先の言語は以下の通りです。
* アメリカ英語
* イギリス英語(READMEは除く)
* 繁体中文
* フランス語
* タイ語
* トルコ語

ここに掲載されていない言語であっても、翻訳を希望される場合はお気軽にお問い合わせください。

[Crowdinのプロジェクトページ](https://crowdin.com/project/discord-simplemusicbot)

## サポート
Discordにて、インストール等のサポート、およびアップデートのお知らせ等を行っています。  
ボットを試すこともできますので、興味を持たれた方はぜひご参加ください。  
[サポートサーバーへの参加はこちら](https://sr.usamyon.moe/8QZw)  
[サポートされているバージョン](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support)

## ライセンス
GPLv3  
詳細は[COPYING](COPYING)を参照。
