# Discord-SimpleMusicBot
[![GitHub package.json dynamique](https://img.shields.io/github/package-json/version/mtripg6666tdr/Discord-SimpleMusicBot/master)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/package.json) [![GitHub package.json dépendance version (prod)](https://img.shields.io/badge/dynamic/json?color=blue&label=oceanic.js&query=%24.dependencies%5B%22oceanic.js%22%5D&url=https%3A%2F%2Fraw.githubusercontent.com%2Fmtripg6666tdr%2FDiscord-SimpleMusicBot%2Fmaster%2Fpackage.json)](https://github.com/OceanicJS/Oceanic) [![CI](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml) [![CodeQL](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml) [![Construire Docker](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/build-docker.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/build-docker.yml) [![Discord Support](https://img.shields.io/discord/847435307582095360?label=discord&logo=discord&logoColor=white)](https://sr.usamyon.moe/8QZw) [![Crowdin](https://badges.crowdin.net/discord-simplemusicbot/localized.svg)](https://crowdin.com/project/discord-simplemusicbot) [![Licence GitHub](https://img.shields.io/github/license/mtripg6666tdr/Discord-SimpleMusicBot)](LICENSE)

[日本語](/README.md)・[English](/locales/README.en-US.md)・[Français](/locales/README.fr-FR.md)

<img alt="exemple d'utilisation de bot" src="https://user-images.githubusercontent.com/56076195/218059644-2ebdf405-b9f8-4561-a3cc-2bcecf09f145.png" width="550" />

Discord向けの、シンプルな音楽ボット。 YouTubeなどからの再生に対応。 選曲はキーワードで可能なので、URLを控える必要はありません。   
Avec ce bot OSS, profitons tous de la musique sur le canal vocal dès maintenant.   
Vous pouvez essayer le bot à partir du serveur d'assistance répertorié ci-dessous.

## 特長
- 🎵 できる限り高音質で再生
- 🔎 URLやキーワードから検索して再生
  - YouTubeの動画のキーワード・リンク
  - lien de la liste de lecture youtube
  - SoundCloudの楽曲のキーワードやリンク
  - Lien vers la page de lecture de Nico Nico Douga
  - [再生できるソースの一覧はこちら](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/guide/feature/overview)
- ⌨️ スラッシュコマンドおよび従来のメッセージベースのコマンドに両対応
  - メッセージベースのコマンドに使用するプレフィックスも変更可能
  - スラッシュコマンドのみに対応させることも可能
- ⏯️ ボタンで直感的にプレーヤーを操作可能
- 🔁 Boucle par piste et à travers les repères
- ▶️ 事前設定による音楽の自動再生
- 😸 データベースなど他のプログラムは必要なし
  - リソースが少なくても実行可能
  - 比較的手順の少ない、簡単なセットアップを実現
- 👍 Botに関する[サポート](#サポート)(下記)

## ドキュメント・ガイド
Vous pouvez voir comment configurer le bot, les commandes, etc. ici.
- [ドキュメントサイト](https://web.usamyon.moe/Discord-SimpleMusicBot/)

## À propos de la cotisation
常に開発中であるためバグが多々あると思います。そして、プロジェクトの性質上、時間とともに機能しなくなることもよくあります。

また、開発者は最近ずっと多忙であるため、あまりメンテナンスに時間を割けていないのも実情です<!--[^1]-->。

<!--
[^1]: GitHub Sponsors を通して私に寄付いただけると、こちらに割ける時間を確保しやすくなります[^2]。寄付に関わらず、サポートの対応に影響はありません。
[^2]: もしよろしければご検討ください。ご不便おかけし申し訳ございません。できる限り頑張ります。
-->

ですので、できる限り頑張りますが、Pull Request を通して貢献していただける方や、そのほか[ドキュメント](https://web.usamyon.moe/Discord-SimpleMusicBot/)の下部に掲載されている方法で貢献していただける方ががいらっしゃいましたら、大変嬉しいですし、非常に助かります。

> [!TIP] Pull Request を通した貢献に際して、ルールや役立つ事項を[CONTRIBUTING.md](.github/CONTRIBUTING.md)にまとめております。 お手数ですが、ぜひご一読ください。

なにとぞ、よろしくお願いいたします。

### バグのご報告について
バグのご報告は、Issueや下記サポートサーバーのサポートチャンネルを通して受け付けております。 ご報告あり次第、できる限り優先して対応いたします。

### 機能追加のご要望について
機能追加のご要望も、Issue や下記のサポートサーバーを通して受け付けております。 しかしながら、上の理由により実装時期が全く保証できない状況です。大変申し訳ございませんが、予めご了承ください。

## À propos de la localisation
Le projet est multilingue avec Crowdin.ボットの翻訳に協力してくださる方と、日本語か英語を話せる校正者の方を随時募集しています。   
翻訳元の言語は日本語です。翻訳先の言語は以下の通りです。
* アメリカ英語
* イギリス英語(READMEは除く)
* 繁体中文
* フランス語
* タイ語
* トルコ語

ここに掲載されていない言語であっても、翻訳を希望される場合はお気軽にお問い合わせください。

[Crowdinのプロジェクトページ](https://crowdin.com/project/discord-simplemusicbot)

## soutien
Sur Discord, nous fournissons une assistance telle que l'installation et la notification des mises à jour.   
[サポートサーバーへの参加はこちら](https://sr.usamyon.moe/8QZw)  
[サポートされているバージョン](https://web.usamyon.moe/Discord-SimpleMusicBot/docs/next/setup/support)

## Licence
GPLv3  
Voir [COPIER](COPYING) pour plus de détails.
