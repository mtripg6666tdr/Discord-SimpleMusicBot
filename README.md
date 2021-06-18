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
Node.js v12以上で動作確認しています。ffmpegへのパスを通しておいてください。通せない場合にはnpmパッケージの`ffmpeg-stable`(optionalDependencies)を利用できます。  

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

4. Botのトークンを設定
```bash
$ echo TOKEN=トークン>.env
```
※トークンの部分をBotのトークンに置き換えてください。

5. トランスパイル＆実行
```bash
$ npm start
```

本リポジトリではより多くの環境で利用可能な`node-opus`および`opusscript`を使用していますが、ご利用の環境で`@discordjs/opus`が利用できる場合には安定性などの点からこちらを利用することをおすすめします。
```bash
$ npm uninstall node-opus
$ npm uninstall opusscript
$ npm install @discordjs/opus
```

## 注意
開発中のためバグが多々あります。
バグを発見した場合、機能追加の提案をしたい場合はGitHubのIssueまたはPull Request、あるいは下記サポートにてお願いいたします。

## サポート
Discordにて、インストール等のサポートを行っています。  
[サポートサーバーへの参加はこちら](https://discord.gg/7DrAEXBMHe)

## ライセンス
GPLv3  
詳細はリポジトリ直下の[LICENSE.md](LICENSE.md)を参照。
