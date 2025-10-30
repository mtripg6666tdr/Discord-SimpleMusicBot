# Discord-SimpleMusicBot 
[![GitHub package.json dynamic](https://img.shields.io/github/package-json/version/mtripg6666tdr/Discord-SimpleMusicBot/master)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/package.json)
[![GitHub package.json dependency version (prod)](https://img.shields.io/badge/dynamic/json?color=blue&label=oceanic.js&query=%24.dependencies%5B%22oceanic.js%22%5D&url=https%3A%2F%2Fraw.githubusercontent.com%2Fmtripg6666tdr%2FDiscord-SimpleMusicBot%2Fmaster%2Fpackage.json)](https://github.com/OceanicJS/Oceanic)
[![CI](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml)
[![CodeQL](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml)
[![Build Docker](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/build-docker.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/build-docker.yml)
[![Discord Support](https://img.shields.io/discord/847435307582095360?label=discord&logo=discord&logoColor=white)](https://sr.usamyon.moe/8QZw)
[![Crowdin](https://badges.crowdin.net/discord-simplemusicbot/localized.svg)](https://crowdin.com/project/discord-simplemusicbot)
[![GitHub License](https://img.shields.io/github/license/mtripg6666tdr/Discord-SimpleMusicBot)](LICENSE)

[日本語](/README.md)・[English](/locales/README.en-US.md)・[Français](/locales/README.fr-FR.md)

<img alt="bot usage example" src="https://user-images.githubusercontent.com/56076195/218059644-2ebdf405-b9f8-4561-a3cc-2bcecf09f145.png" width="550">

Discord向けの、シンプルな音楽ボット。YouTubeなどからの再生に対応。
選曲はキーワードで可能なので、URLを控える必要はありません。  
このOSSのBotで、みんなで今すぐボイスチャンネルで音楽を楽しみましょう。  
下部に掲載のサポートサーバーよりボットを試すことができます。お気軽にサポートサーバーにご参加ください。

## 特長
- 🎵 できる限り高音質で再生
- 🔎 URLやキーワードから検索して再生
  - YouTubeの動画のキーワード・リンク
  - YouTubeのプレイリストのリンク
  - SoundCloudの楽曲のキーワードやリンク
  - ニコニコ動画の再生ページへのリンク
  - [再生できるソースの一覧はこちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/guide/feature/overview)
- ⌨️ スラッシュコマンドおよび従来のメッセージベースのコマンドに両対応
  - メッセージベースのコマンドに使用するプレフィックスも変更可能
  - スラッシュコマンドのみに対応させることも可能
- ⏯️ ボタンで直感的にプレーヤーを操作可能
- 🔁 トラックごと及びキュー全体でループ
- ▶️ 事前設定による音楽の自動再生
- 😸 データベースなど他のプログラムは必要なし
  - リソースが少なくても実行可能
  - 比較的手順の少ない、簡単なセットアップを実現
- 👍 Botに関する[サポート](#サポート)(下記)

## ドキュメント・ガイド
ボットの設定方法、コマンドなどはこちらからご覧になれます。  
- [ドキュメントサイト](https://web.usamyon.moe/Discord-SimpleMusicBot/)

## 貢献について
常に開発中であるためバグが多々あると思います。そして、プロジェクトの性質上、時間とともに機能しなくなることもよくあります。

また、開発者は最近ずっと多忙であるため、あまりメンテナンスに時間を割けていないのも実情です<!--[^1]-->。

<!--
[^1]: GitHub Sponsors を通して私に寄付いただけると、こちらに割ける時間を確保しやすくなります[^2]。寄付に関わらず、サポートの対応に影響はありません。
[^2]: もしよろしければご検討ください。ご不便おかけし申し訳ございません。できる限り頑張ります。
-->

ですので、できる限り頑張りますが、Pull Request を通して貢献していただける方や、そのほか[ドキュメント](https://web.usamyon.moe/Discord-SimpleMusicBot/)の下部に掲載されている方法で貢献していただける方ががいらっしゃいましたら、大変嬉しいですし、非常に助かります。

> [!TIP]
> Pull Request を通した貢献に際して、ルールや役立つ事項を[CONTRIBUTING.md](.github/CONTRIBUTING.md)にまとめております。
> お手数ですが、ぜひご一読ください。

なにとぞ、よろしくお願いいたします。

### バグのご報告について
バグのご報告は、Issueや下記サポートサーバーのサポートチャンネルを通して受け付けております。
ご報告あり次第、できる限り優先して対応いたします。

### 機能追加のご要望について
機能追加のご要望も、Issue や下記のサポートサーバーを通して受け付けております。
しかしながら、上の理由により実装時期が全く保証できない状況です。大変申し訳ございませんが、予めご了承ください。

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
