---
sidebar_position: 6
---
# 【環境別】Glitch で使用する

:::danger

ここで紹介しているのは、セットアップの一例です。ご自身で利用される際は、Glitchなどの利用するサービスの利用規約、プライバシーポリシー、およびヘルプセンターなどをご参照の上、自己責任の範囲でご使用ください。ここに記載されている内容は、あくまで参考です。  
また、このボットやボットの開発者はGlitchと提携等はしておらず、無関係です。Glitchのサポートに、ボットについての問い合わせることはご遠慮ください。このガイドはGlitchでの使用を促すものではありません。

:::

:::info

ここで紹介する方法は、[「クローンして実行する」](./normal)をベースにしています。
必ず[「クローンして使用する」](./normal)も併せてご確認ください。

:::

Discord-SimpleMusicBotを [Glitch](https://glitch.com/) で実行する手順を説明します。

## 前提条件
* Glitchへの登録は完了しているものとします。
* PCで作業していることを前提としています。
* Glitchで常時稼働する方法についてサポートはいたしません。

## 手順
### 1. 新しいプロジェクトを作成します
Glitchのトップ画面から、右上にある`New project`をクリックして`Import from GitHub`をクリックします。表示されたプロンプトに`https://github.com/mtripg6666tdr/Discord-SimpleMusicBot`と入力してOKします。

### 2. 最新のバージョンにリセットします。
  `master`ブランチは開発用ブランチなので、最新のリリースの時点にリセットします。  
  `TERMINAL`から、以下のコマンドを実行します。
  ```sh
  git remote add origin https://github.com/mtripg6666tdr/Discord-SimpleMusicBot.git
  git fetch
  git reset --hard <最新のバージョン>
  ```
  `最新のバージョン`は適宜現時点での最新のバージョンに読みかえてください。

### 3. ボットが動作するようファイルを編集します
ボットが動作するよう、いくつかのファイルを変更する必要があります。
* 
  ```diff title="tsconfig.build.json"
        "importHelpers": true,
  -     "outDir": "dist/",
  +     "outDir": "out/",
        "allowJs": false,
  ```

* 
  ```diff title="package.json"
      "start": "npm run build && npm run onlystart",
  -   "onlystart": "node util/exec dist",
  +   "onlystart": "node util/exec out",
  -   "build": "rimraf dist/ typings/ && tsc",
  +   "build": "rimraf out/ typings/ && tsc || exit 0",
      "lint": "eslint .",
  ```

### 4. ボットの各種設定をします
[「ボットの設定について」](./configuration.md)を参考に、ボットの設定を行います。

* `config.json`は画面左の`Files`のところにある`+`ボタンをクリックし、`config.json`という名前でファイルを作成し、`config.json.sample`の内容をコピー＆ペーストして設定します。  
  ![Files>+](https://static-objects.usamyon.moe/dsmb/docs-assets/guide_glitch_file.png)
  　
  ![config.jsonの名前で保存](https://static-objects.usamyon.moe/dsmb/docs-assets/guide_glitch_add_file.png)
* `.env`は図のように設定します。
  ![envの設定例](https://static-objects.usamyon.moe/dsmb/docs-assets/guide_glitch_env.png)

### 5. 完了
  しばらくすると、ボットが起動します。ボットの状況については画面下の`LOGS`をクリックしてログを参照してください。
