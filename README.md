# Discord-SimpleMusicBot 
![GitHub package.json dynamic](https://img.shields.io/github/package-json/version/mtripg6666tdr/Discord-SimpleMusicBot)
[![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/mtripg6666tdr/Discord-SimpleMusicBot/eris)](https://github.com/abalabahaha/eris)
[![CI](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/test.yml)
[![CodeQL](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/actions/workflows/codeql-analysis.yml)
![GitHub repo size](https://img.shields.io/github/repo-size/mtripg6666tdr/Discord-SimpleMusicBot)
[![GitHub License](https://img.shields.io/github/license/mtripg6666tdr/Discord-SimpleMusicBot)](LICENSE)

![Bot use image](https://user-images.githubusercontent.com/56076195/149505763-276ec199-44c5-4ccc-a72d-5ac630ff4c0f.png)

Discord向け日本製シンプル音楽ボット。  
YouTubeなどからの再生に対応。
選曲はキーワードで指定可能なのでURLを控える必要はありません。  
このOSSのBotで、みんなで今すぐVCで音楽を楽しみましょう。  
下部に掲載のサポートサーバーよりボットを試すことができます。お気軽にサポートサーバーにご参加ください。

<details>
  <summary>目次</summary>

- [Discord-SimpleMusicBot](#discord-simplemusicbot)
  - [機能](#機能)
  - [実行環境の準備](#実行環境の準備)
  - [インストール＆実行](#インストール実行)
    - [設定ファイルの詳細について](#設定ファイルの詳細について)
      - [`.env`ファイル](#envファイル)
      - [`config.json`ファイル](#configjsonファイル)
    - [ライブラリとして使用する](#ライブラリとして使用する)
  - [スラッシュコマンドについて](#スラッシュコマンドについて)
  - [使用する権限](#使用する権限)
  - [キューやループの有効無効等のデータのバックアップ](#キューやループの有効無効等のデータのバックアップ)
    - [サーバー作成に役立つ、バックアップサーバーのサンプル実装](#サーバー作成に役立つバックアップサーバーのサンプル実装)
    - [APIサーバーの仕様](#apiサーバーの仕様)
      - [**GET (type=j)**](#get-typej)
      - [**GET (type=queue)**](#get-typequeue)
      - [**POST (type=j)**](#post-typej)
      - [**POST (type=queue)**](#post-typequeue)
  - [アドオン機能について](#アドオン機能について)
  - [注意](#注意)
  - [貢献について](#貢献について)
  - [コード使用について](#コード使用について)
  - [サポート](#サポート)
    - [サポートされているバージョン](#サポートされているバージョン)
  - [ライセンス](#ライセンス)
</details>

## 機能
- 🎵できる限り高音質で再生
- ⌨️スラッシュコマンドおよびテキストベースのコマンドに両対応
- 🔗 URLから再生
  - YouTubeの動画のリンク
  - YouTubeのプレイリストのリンク
  - SoundCloudの楽曲ページのリンク
  - ニコニコ動画の再生ページへのリンク
  - Discordの音声の添付ファイル付メッセージへのリンク
  - Googleドライブの音声ファイルへの限定公開URL
  - 音声ファイルへの直URL
- 🔎 キーワードから検索して再生(YouTubeとSoundCloud)
- 🔁 トラックごと及びキュー全体でループ
- ❕ プレフィックス変更
  - デフォルトのプレフィックスは`>`です。
  - 変更には各サーバーでボットのニックネームを変更します。具体的には、ニックネームの先頭に角括弧を付けてプレフィックスを記述します。たとえば、プレフィックスを`?`に変更する場合、ボット名を`[?]サンプルボット`などとします。(最大一文字)
  - ボットを自分でホストする場合、後述の`config.json`でボットレベルでデフォルトのプレフィックスを変更することができます。(複数文字に対応)
- 👍 Botに関するサポート（下記）

[コマンドの一覧はこちらからご覧になれます](docs/commands.md)

## 実行環境の準備
- Node.js v12以上v16以下がサポートされている環境  
  - ほとんどのデバイスがサポートされています  
  - [npmのffmpeg](https://www.npmjs.com/package/ffmpeg-static)が利用できない場合は、`npm install`したときに、その旨の表示がされます。
    - その場合は、自分で別途ffmpegをインストールする必要があります。
    - 最新版でも入れておきましょう
  - Python2.xまたはPython3.xをインストールしておくことを推奨します。
    - `python --version`でバージョンが出ればインストールされています
  - Unix系の環境であれば、`nscd`をインストールしないとffmpegが動かないことがあるみたいです
    - `apt install nscd`とかを実行してインストールしておきましょう
    - インストールが完了したら、`systemctl --all |grep nscd`でサービスが稼働しているか確認しておきましょう
- ちなみに、デフォルトのmasterブランチと、v2ブランチとはサポートされているNode.jsのバージョンがかなり違うので、詳しくはブランチを切り替えるか下の方にある表を参照してください。
- v2ブランチへの切り替え方法が分からないなどあればサポートへどうぞ

## インストール＆実行
1. リポジトリをクローン
  ```bash
  git clone https://github.com/mtripg6666tdr/Discord-SimpleMusicBot.git
  ```

2. カレントディレクトリ移動
  ```bash
  cd Discord-SimpleMusicBot
  ```

3. 必須パッケージインストール
  ```bash
  npm install
  ```

4. Botのトークンなどの設定  
ボットのトークンを[`.env`](.env)ファイルに指定します。  
書き方は[`.env.sample`](.env.sample)に書いてありますので、コピー＆リネームしてお使いください。  
さらに細かい設定ができる`config.json`もありますので、こちらも設定してください。
  <details>
    <summary>詳細は開く</summary>

  ### 設定ファイルの詳細について
  本ボットの設定ファイルは、`.env`と`config.json`の2ファイルです。
  #### `.env`ファイル
  こちらには主にトークンなどの認証情報を記述します。
  任意指定の設定に関しては、**`CSE_KEY=`の部分も記述しないでください。**
  `.env.sample`がサンプルファイルとなっていますので、コピー＆リネームしてお使いください。
  - TOKEN  
    ボットのトークンです。Discord Developer Portalから取得してください。
  - CSE_KEY  
    歌詞検索に使用するGoogle Custom Searchのkeyです。(任意指定)
  - GAS_URL  
    「キューやループの有効無効等のデータのバックアップ」に使用するデータベースサーバーのURLです。(任意指定)  
    サーバーの仕様等についてはあとのセクションを参照してください。
  - GAS_TOKEN  
    「キューやループの有効無効等のデータのバックアップ」に使用するデータベースサーバーのトークンです。(任意指定)  
    サーバーの仕様等についてはあとのセクションを参照してください。

  #### `config.json`ファイル
  こちらにはボットの設定情報などを記述します。
  任意指定の設定に関しては、**値をnullにしてください("null"ではなくnull)**
  `config.json.sample`がサンプルファイルとなっていますので、コピー＆リネームしてお使いください。
  (カッコ内は、型です。)
  - adminId (string|null)  
    管理人のユーザーのID。設定しない場合は`null`
  - debug (boolean)  
    デバッグ用の構成で起動するか。
  - maintenance (boolean)  
    メンテナンス用の構成で起動するか。
  - errorChannel (string|null)  
    エラーレポートを送信するテキストチャンネルのID。設定しない場合は`null`
  - proxy (string|null)  
    プロキシを使用する場合はそのURL。設定しない場合は`null`
  - prefix (string|null)  
    指定する場合は一文字でデフォルトプレフィックスを指定してください。(任意指定)  
    こちらは互換性のため、プロパティ自体が省略されていても動作するようになっています。
  - webserver (boolean)  
    ウェブサーバーを起動するか（任意指定）  
    こちらは互換性のため、プロパティ自体が省略されていても動作するようになっています。
  </details>
  
5. トランスパイル  
```bash
$ npm run build
```

6. 実行
```bash
$ npm run onlystart
```

なお、スラッシュコマンドは、起動時に自動的に追加されるようになりました。

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

## スラッシュコマンドについて
スラッシュコマンドは、ボットの初回起動時に自動的にアプリケーションレベルに登録されるようになりました。  
ちなみに登録の反映には初回起動から最大で一時間程度かかります。  
（※サーバーレベルでのコマンド登録機能は廃止されました）  
必要に応じて、次のコマンドを使用することで、コマンドを整理することができます。  
  - このボットに登録されていないコマンドを削除したい場合  
    `invoke sp;cleanupsc`  
  - このボットにアプリケーションレベルで登録されているコマンドを削除する場合  
    `invoke sp;removesca`  
  - このボットにサーバーレベルで登録されているコマンドを削除する場合  
    `invoke sp;removescg`  

## 使用する権限
ボットの権限フラグの整数は`7465984`です。
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
|Mute Members|メンバーをミュート|抑制されているボイスチャンネルでミュートを外すのに必要|

  ## キューやループの有効無効等のデータのバックアップ
  本ボットはキューの内容やループの有効無効、ボイスチャンネルの接続状態をバックアップすることができます。  
  ※バックアップサーバーはなくても実行できます。  
  仕様についての詳細は以下を参照してください  
<details>
  <summary>開く</summary>

バックアップには、まずバックアップ先のサーバーを作成する必要があります。  

### サーバー作成に役立つ、バックアップサーバーのサンプル実装
- [Google Apps Script](util/exampleDbServer/gas/exampleDbServer.gs)
- [Node.js(ファイルベース)](util/exampleDbServer/node)

### APIサーバーの仕様
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
{"status": 200, "data": {"サーバーID": "文字列化したステータス情報", ...}}
```
失敗した場合は、ステータスコードだけのオブジェクトを返します。
```json
{"status": 400}
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
{"status": 200, "data": {"サーバーID": "文字列化したキュー", ...}}
```
失敗した場合は、ステータスコードだけのオブジェクトを返します。
```json
{"status": 400}
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

レスポンス: トークンが一致すればデータベースを更新し、成功すれば、以下のようなJSONを返す
```json
{"status": 200}
```
失敗した場合は、ステータスコードだけのオブジェクトを返します。
```json
{"status": 400}
```

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

レスポンス: トークンが一致すればデータベースを更新し、成功すれば、以下のようなJSONを返す
```json
{"status": 200}
```
失敗した場合は、ステータスコードだけのオブジェクトを返します。
```json
{"status": 400}
```
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
バグを発見した場合、機能追加の提案をしたい場合はGitHubのIssue、あるいは下記サポートにてお願いいたします。

## 貢献について
本リポジトリへの貢献は大歓迎です！  
バグを発見した場合等も重複したIssueがないことを確認し、Issueをまず開いてください。可能な場合、Pull Requestをそのうえで開いてください。  
Issueのほか、下記のサポートサーバーでも各種お問い合わせを受け付けています。  
いづれかの手段でお気軽にどうぞ！  
**ただし、現在多忙のため、依存関係のアップデート関連にしか時間を割くことができず、Issueにdefermentタグをつけさせていただく場合があります。可能な限り早く対応できるように努力いたしますので、何卒ご了承ください。**  

## コード使用について
- コードの使用時は必ず[ライセンス](LICENSE)に沿った使い方をしてください

## サポート
Discordにて、インストール等のサポート、および重要な更新のお知らせ等を行っています。  
ボットを試すこともできますので、興味のある方はご参加ください。  
[サポートサーバーへの参加はこちら](https://discord.gg/7DrAEXBMHe)  

### サポートされているバージョン
|バージョン|Node.js|discord.js|eris|サポート状況|サポート範囲|
|:---------|-------|----------|----|:----------|:----------:|
|            [v1](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/tree/v1)    |>=12.0.0|v12.x   |-|:x:サポート終了             |-|
|            [v2](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/tree/v2)    |>=16.6.0|~v13.6.0|-|:white_check_mark:サポート中|依存関係の更新と重大なバグ等|
|[v3(master)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/tree/master)|>=12 |-|@latest|:white_check_mark:サポート中|フルサポート|

## ライセンス
GPLv3  
詳細はリポジトリ直下の[LICENSE](LICENSE)を参照。
