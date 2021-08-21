# Discord-SimpleMusicBot
Discord向け日本製シンプル音楽ボット。  
YouTubeなどからの再生に対応。
選曲はキーワードで指定可能なのでURLを控える必要はありません。  
このOSSのBotで、みんなで今すぐVCで音楽を楽しみましょう。

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
- Botに関するサポート（下記）

## インストール＆実行
Node.js v12以上で動作確認しています。  
~~実際には、パッケージ`discord.js`はNode.js v16.1.0以上が必須であるため、npmパッケージのnodeを利用しています。  ~~
~~上手くいかない場合には環境に直接Node.js v16.1.0以上をインストールして下さい。~~  
> Node.js v15以上ではAborted Exceptionが発生するバグがあるため(現在原因不明)、Node.js v14以下で使用してください。
npmパッケージの`ffmpeg-stable`(optionalDependencies)を利用できない場合、手動で`ffmpeg`へのパスを通す必要があります。  

1. リポジトリをクローン
```bash
$ git clone https://github.com/mtripg6666tdr/Discord-SimpleMusicBot.git
```

2. カレントディレクトリ移動
```bash
$ cd Dicord-SimpleMusicBot
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

## 注意
開発中のためバグが多々あります。
バグを発見した場合、機能追加の提案をしたい場合はGitHubのIssueまたはPull Request、あるいは下記サポートにてお願いいたします。

## サポート
Discordにて、インストール等のサポートを行っています。  
[サポートサーバーへの参加はこちら](https://discord.gg/7DrAEXBMHe)

## ライセンス
GPLv3  
詳細はリポジトリ直下の[LICENSE.md](LICENSE.md)を参照。
