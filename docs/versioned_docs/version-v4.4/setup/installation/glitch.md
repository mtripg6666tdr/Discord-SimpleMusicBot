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
  refresh
  ```
  `最新のバージョン`(例：`v4.2.0`)は適宜現時点での最新のバージョンに読みかえてください。

:::info
最新のバージョンは、[リリースページ](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/releases)で確認してください。
:::

### 3. ボットが動作するようファイルを編集します
ボットが動作するよう、いくつかのファイルを変更する必要があります。

* 
  ```diff title="util/tsconfig/tsconfig.build.json"
        "forceConsistentCasingInFileNames": true,
        "importHelpers": true,
        // highlight-start
  -     "outDir": "../../dist/",
  +     "outDir": "../../out/",
        // highlight-end
        "allowJs": false,
        "skipLibCheck": true,
  ```

* 
  ```diff title="package.json"
    "scripts": {
      "test": "mocha",
      "start": "npm run build && npm run onlystart",
      // highlight-start
  -   "onlystart": "node util/exec dist",
  +   "onlystart": "node util/exec out",
  -   "build": "node builder.mjs bake && tsc -p util/tsconfig/tsconfig.build.json",
  +   "build": "node builder.mjs bake && tsc -p util/tsconfig/tsconfig.build.json || exit 0",
  -   "build:bundled": "node builder.mjs bake && tsc -p util/tsconfig/tsconfig.bundle.json && node builder.mjs bundle",
  +   "build:bundled": "node builder.mjs bake && tsc -p util/tsconfig/tsconfig.bundle.json && node builder.mjs bundle --use-out-dir",
      // highlight-end
      "prelint": "node builder.mjs bake",
      "lint": "tsc && eslint .",
      "cleanup": "rimraf dist/ typings/ build/ out/ src/Commands/_index.ts",
      "generatecommandlist": "node util/generateCommandList"
    },
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

## ボットの更新
ボットを最新のバージョンに更新するには、以下のコマンドをまず実行してください。
```sh
git fetch

# <最新のバージョン>は、適宜最新のバージョンに読み替えてください。
# 例えば、最新バージョンがv4.3.0だった場合、
# git reset --hard v4.3.0
# となります
git reset --hard <最新のバージョン>

refresh
```
コマンドを実行したら、Glitchのエディターから、上で説明した通りにファイルの変更を行ってください。  

この操作ののち、しばらくするとボットが起動します。
