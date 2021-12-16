# Discord-SimpleMusicBot
[![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/mtripg6666tdr/Discord-SimpleMusicBot/discord.js)](https://github.com/discordjs/discord.js)
[![CI](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/testing.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/testing.yml)
[![CodeQL](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml)
![GitHub repo size](https://img.shields.io/github/repo-size/mtripg6666tdr/Discord-SimpleMusicBot)
[![GitHub License](https://img.shields.io/github/license/mtripg6666tdr/Discord-SimpleMusicBot)](LICENSE.md)

Discord向け日本製シンプル音楽ボット。  
YouTubeなどからの再生に対応。
選曲はキーワードで指定可能なのでURLを控える必要はありません。  
このOSSのBotで、みんなで今すぐVCで音楽を楽しみましょう。

<details>
  <summary>目次</summary>

- [Discord-SimpleMusicBot](#discord-simplemusicbot)
  - [機能](#機能)
  - [インストール＆実行](#インストール実行)
    - [ライブラリとして使用する](#ライブラリとして使用する)
  - [使用する権限](#使用する権限)
  - [キューやループの有効無効等のデータのバックアップ](#キューやループの有効無効等のデータのバックアップ)
    - [Google Apps Scriptを使用する場合](#google-apps-scriptを使用する場合)
    - [自分でAPIサーバーを構築する場合](#自分でapiサーバーを構築する場合)
      - [**GET (type=j)**](#get-typej)
      - [**GET (type=queue)**](#get-typequeue)
      - [**POST (type=j)**](#post-typej)
      - [**POST (type=queue)**](#post-typequeue)
  - [アドオン機能について](#アドオン機能について)
  - [注意](#注意)
  - [貢献について](#貢献について)
  - [コード使用について](#コード使用について)
  - [サポート](#サポート)
  - [ライセンス](#ライセンス)
</details>

## 機能
- 取得できる限り高音質で再生
- URLから再生
  - YouTubeの動画のリンク
  - YouTubeのプレイリストのリンク
  - SoundCloudの楽曲ページのリンク
  - Discordの音声の添付ファイル付メッセージへのリンク
  - Googleドライブの音声ファイルへの限定公開URL
  - 音声ファイルへの直URL
- キーワードから検索して再生(YouTubeとSoundCloud)
- トラックごと及びキュー全体でループ
- プレフィックス変更
  - デフォルトのプレフィックスは`>`です。
  - 変更にはボット名の先頭に角括弧を付けてプレフィックスを記述します。たとえば、プレフィックスを`?`に変更する場合、ボット名を`[?]サンプルボット`などとします。
- Botに関するサポート（下記）

## インストール＆実行
devDependenciesの(npmパッケージとしての)Node.jsを利用するようになっていますので、グローバルにインストールされているNode.jsのバージョンに制約はありませんが、最新の安定版のNode.jsを利用することをお勧めします。  
npmパッケージの`ffmpeg-stable`(optionalDependencies)を利用できない場合、手動で`ffmpeg`へのパスを通す必要があります。    

1. リポジトリをクローン
```bash
$ git clone https://github.com/mtripg6666tdr/Discord-SimpleMusicBot.git
```

2. カレントディレクトリ移動
```bash
$ cd Discord-SimpleMusicBot
```

3. 必須パッケージインストール
```bash
$ npm install
```

4. Botのトークンなどを設定  
ボットのトークンを[`.env`](.env)ファイルに指定します。  
書き方は[`.env.sample`](.env.sample)に書いてありますので、リネームしてお使いください。  

5. スラッシュコマンドの登録  
必要な場合はスラッシュコマンドの登録を行います。スラッシュコマンドの登録をする場合には、ボットを招待する際に`bot`スコープに加え、`commands`スコープが必要となります。
- アプリケーションスコープ
```bash
$ npm run applyslashcommandapplication
```
アプリケーションスコープでスラッシュコマンドを登録すると反映まで約1時間かかります  
- サーバースコープ
```bash
$ npm run applyslashcommandguild
```
サーバースコープの場合即時に反映されます

6. トランスパイル＆実行
```bash
$ npm start
```

本リポジトリではより多くの環境で利用可能な`node-opus`および`opusscript`を使用していますが、ご利用の環境で`@discordjs/opus`が利用できる場合には安定性などの点からこちらを利用することをおすすめします。
```bash
$ npm uninstall node-opus
$ npm uninstall opusscript
$ npm install @discordjs/opus
```

### ライブラリとして使用する
本ボットをそのままライブラリとして使用することができます。
```bash
npm i mtripg6666tdr/Discord-SimpleMusicBot
```
```ts
import MusicBot from "discord-music-bot";
const bot = new MusicBot();
bot.Run(/* token */);
```
エクスポートされているのは[`こちら`](src/bot.ts)の`MusicBot`クラスです。型定義についてはこちらを参照してください。

## 使用する権限
ボットの権限フラグの整数は`3271680`です。
|権限名|権限名(日本語)|権限の説明|
|----|----|----|
|View Channels|チャンネルの閲覧|基本動作のために必須|
|Send Messages|メッセージの送信|基本動作のために必須|
|Manage Messages|メッセージの管理|送信されたリンクの埋め込みを消去するために必要|
|Embed links|埋め込みリンク|各コマンドに対する応答に必要|
|Attach files|ファイルを添付|エクスポートコマンドに必要|
|Read Message History|メッセージ履歴を読む|インポートコマンドに必要|
|Connect|接続|ボイスチャンネルへの接続に必要|
|Speak|発言|ボイスチャンネルでオーディオを再生するのに必要|

  ## キューやループの有効無効等のデータのバックアップ
  本ボットはキューの内容やループの有効無効、ボイスチャンネルの接続状態をバックアップすることができます。  
  ※バックアップサーバーはなくても実行できます。  
  仕様についての詳細は以下を参照してください  
<details>
  <summary>開く</summary>

バックアップにはまずバックアップ先のサーバーを作成する必要があります。  
作成する場合、[Google Apps Script](https://script.google.com)を利用するか、任意の言語を使用してサーバーを作成することができます。

### Google Apps Scriptを使用する場合
Google Apps Scriptを使用する場合、新規プロジェクトを作成し、[サンプルのGSファイル](util/exampleDbServer.gs)の内容を`コード.gs`にペーストして、スクリプト内にある通り定数を設定して、Webアプリとしてデプロイしてください。  
デプロイが完了したら、URLの[.env](.env)への登録を忘れずに。

### 自分でAPIサーバーを構築する場合
APIサーバーのエンドポイントはひとつで、クエリパラメーターもしくはリクエストボディのjsonデータによって動作を変えます。  
APIサーバーは以下の仕様に沿うようにしてください。  
#### **GET (type=j)**
> 各サーバーのステータス情報を返却します  

リクエストクエリ: 
```
?type=j&token={token}&guildid={guildid}
```
> `{token}`: `process.env.GAS_TOKEN` に指定したトークン。これにより認証します。)  
> `{guildid}`: 要求するサーバーIDをカンマで連結したリスト(ex. 111111111111,22222222222,3333333333333)  
> 
レスポンス: トークンが一致すればデータベースに存在する各サーバーのJSONデータを返却します  
例:
```json
{"サーバーID": "文字列化したステータス情報", ...}
```

#### **GET (type=queue)**
> 文字列化した各サーバーのキューを返却します

リクエストクエリ: 
```
?type=queue&token={token}&guildid={guildid}
```
> `{token}`: `process.env.GAS_TOKEN` に指定したトークン。これにより認証します。)  
> `{guildid}`: 要求するサーバーIDをカンマで連結したリスト(ex. 111111111111,22222222222,3333333333333)  

レスポンス: トークンが一致すればデータベースに存在する各サーバーのJSONデータを返却します
例:
```json
{"サーバーID": "文字列化したキュー", ...}
```

#### **POST (type=j)**
> データベースに文字列化した各サーバーのステータス情報を登録します。または既に存在する場合は更新します。

リクエストペイロード(JSON):
```json
{
  "token": "{token}",
  "type": "j",
  "guildid": "{guildid}",
  "data": "{data}"
}
```
> `{token}`: `process.env.GAS_TOKEN` に指定したトークン。これにより認証します。)  
> `{guildid}`: {data}に含まれるステータス情報のサーバーIDをカンマで連結したリスト  
> `{data}`: 以下のようなJSONを文字列化した文字列
> ```json
> {"サーバーID": "文字列化したステータス情報", ...}
> ```

レスポンス: トークンが一致すればデータベースを更新し、成功すればHTTP 200を返却。失敗すればそれ以外を返却。コンテンツは不要。

#### **POST (type=queue)**
> データベースに文字列化した各サーバーのキューを登録します。または既に存在する場合は更新します。

リクエストペイロード(JSON):
```json
{
  "token": "{token}",
  "type": "queue",
  "guildid": "{guildid}",
  "data": "{data}"
}
```
> `{token}`: `process.env.GAS_TOKEN` に指定したトークン。これにより認証します。)  
> `{guildid}`: {data}に含まれるキューデータのサーバーIDをカンマで連結したリスト  
> `{data}`: 以下のようなJSONを文字列化した文字列
> ```json
> {"サーバーID": "文字列化したキュー", ...}
> ```

レスポンス: トークンが一致すればデータベースを更新し、成功すればHTTP 200を返却。失敗すればそれ以外を返却。コンテンツは不要。
</details>

## アドオン機能について
本ボットは、ちょっとした追加機能を追加することができます。
<details>
  <summary>詳細は開く</summary>
  
  アドオン機能を追加するには、プロジェクトの`src`フォルダと同じ階層に`addon`フォルダを作成します。
  ボットは、addonフォルダにある拡張子がjsのファイルを自動的にアドオンとして実行します。  
  `サンプル.js`
  ```js
module.exports = function(parent){
  console.log("aaa");
  parent.on("ready", ()=> {
    console.log("Ready called!");
  });
}
  ```
  jsファイルは、関数ひとつをデフォルトエクスポートしてください。関数はボットの起動時に呼ばれ、引数を一つ受け取ります。  
  引数は`EventEmitter`となっており、`discord.js`の`Client.on`、`Client.once`、`Client.off`などと同じようにイベントハンドラを設定することができます。
  サポートされるイベント名は`ready`、`messageCreate`、`interactionCreate`です。イベントの引数は、`discord.js`と同じです。
  - イベントをハンドルして本来のボットの操作を中断したりフィルターしたりすることはできません。
  - イベントはボットの本来の動作の前に呼ばれます。
</details>
  
## 注意
開発中のためバグが多々あります。  
バグを発見した場合、機能追加の提案をしたい場合はGitHubのIssueまたはPull Request、あるいは下記サポートにてお願いいたします。

## 貢献について
本リポジトリへの貢献は大歓迎です！IssueまたはPull Requestは気軽にお送りください！

## コード使用について
- コードの使用時は必ずライセンスに沿った使い方をしてください

## サポート
Discordにて、インストール等のサポート、および重要な更新のお知らせ等を行っています。  
[サポートサーバーへの参加はこちら](https://discord.gg/7DrAEXBMHe)

## ライセンス
GPLv3  
詳細はリポジトリ直下の[LICENSE](LICENSE)を参照。
