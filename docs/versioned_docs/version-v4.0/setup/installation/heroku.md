---
sidebar_position: 4
---
# 【環境別】Heroku で使用する

:::danger

ここで紹介しているのは、セットアップの一例です。ご自身で利用される際は、Herokuなどの利用するサービスの利用規約、プライバシーポリシー、およびヘルプセンターなどをご参照の上、自己責任の範囲でご使用ください。ここに記載されている内容は、あくまで参考です。  
また、このボットやボットの開発者はHerokuと提携等はしておらず、無関係です。Herokuのサポートに、ボットについての問い合わせることはご遠慮ください。  
このガイドはHerokuでの使用を促すものではありません。

:::

:::info

ここで紹介する方法は、[「クローンして実行する」](./normal)をベースにしています。
必ず[「クローンして使用する」](./normal)も併せてご確認ください。

:::

:::info

こちらの説明はコミュニティにより作成されました。ここに記載されている内容についてのお問い合わせは、基本的にお答えいたしかねます。

:::

## はじめに
筆者の環境を簡単に紹介します。
- 最終確認日
  * 2023/1/1 15:30
- ローカル
  * Windows 10 PowerShell
  - [git](https://git-scm.com/) や [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) 導入済み
- [Heroku](https://heroku.com/)
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
  git reset --hard <使用したいバージョン>
  ```

### 5. 設定用ファイル`.env`と`Config.json`の準備

  ※[「ボットの設定について」](./configuration.md)を参照してください

  ```sh
  cp .env.sample .env
  cp config.json.sample config.json
  ```

  任意のエディタで`.env`と`config.json`を設定してください。

### 6. 設定用ファイルをpushするために`.gitignore`を修正

任意のエディタで".gitignore"を修正します。  

`修正例:`

```diff title=".gitignore"
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

:::danger

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
