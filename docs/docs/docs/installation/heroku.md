---
sidebar_position: 3
---
# herokuで使用する

:::info

こちらの説明はコミュニティにより作成されました。ここに記載されている内容についてのお問い合わせは、基本的にお答えいたしかねます。

:::

## はじめに
筆者の環境を簡単に紹介します。
- 最終確認日
  * 2023/1/1 15:30
- ローカル
  * Win10 PowerShell
  * gitやheroku CLI導入済み
- Heroku
  * スタックはheroku-22
  * 契約プランはEco Dyno

## 手順
### 1. Heroku CLIにログイン

  ```sh
  heroku login
  ```

### 2. Heroku上にAppを作成
   
  ※nodejsを利用しているため、buildpackにnodejsを指定

  ```sh
  heroku create -b heroku/nodejs
  ```

### 3. Heroku Appにffmpegのビルドパックを追加
  
  ※不要かもしれませんが、Herokuでffmpegを実行するのに最適化されているらしいので念のため

  ```sh
  heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
  ```

### 4. 最新版のDiscord-SimpleMusicBotをクローン
  ※[「クローンして実行する」](./normal.md)を参照

  ```sh
  git clone https://github.com/mtripg6666tdr/Discord-SimpleMusicBot.git
  ```

### 5. 設定用ファイル".env"と"Config.json"の準備

  ※[「ボットの設定について」](./configuration.md)を参照してください

  ```sh
  cp .env.sample .env
  cp config.json.sample config.json
  ```

  任意のエディタで`.env`と`config.json`を設定してください。

### 6. 設定用ファイルをpushするために`.gitignore`を修正

任意のエディタで".gitignore"を修正します。  

`修正例:`
```diff
- *.env
+ #*.env

- config.json
+ #config.json
```

### 7. `Procfile`の作成
```sh
touch Procfile
```
任意のエディタで`Procfile`を修正します。
次の1行のみ記入すればOK  

:::warning

npm run startとすると不要なトランスパイルが発生し、依存関係の解決でクラッシュしてしまう

:::
```
worker: npm run onlystart
```

### 8. デプロイ
```sh
git add .
git commit -m "Update: This tweaks will work for Heroku"
git push heroku master
```

### 9. Heroku DashboardにてAppのEco Dynosの設定
  ブラウザで当該Appを開く  
  →Resourcesタブ  
  →Eco Dynos  
  →worker npm run onlystart となっていることを確認  
  →右端のペンマークをクリックし、トグルをONにしてConfirm  

### 10. 完了
  これで動作するはずです。お疲れさまでした。
