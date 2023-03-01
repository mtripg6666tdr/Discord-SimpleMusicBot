---
sidebar_position: 5
---
# 【環境別】Glitchで使用する
Discord-SimpleMusicBotをreplitで実行する手順を説明します。

## 前提条件
* Glitchへの登録は完了しているものとします。
* PCで作業していることを前提としています。
* Glitchで常時稼働する方法についてサポートはいたしません。

## 手順
### 1. 新しいプロジェクトを作成します
Glitchのトップ画面から、右上にある`New project`をクリックして`Import from GitHub`をクリックします。表示されたプロンプトに`https://github.com/mtripg6666tdr/Discord-SimpleMusicBot`と入力してOKします。

### 2. ボットが動作するようファイルを編集します
ボットが動作するよう、いくつかのファイルを変更する必要があります。
* `tsconfig.json`
  ```diff
        "importHelpers": true,
  -     "outDir": "dist/",
  +     "outDir": "out/",
        "allowJs": false,
  ```
* `package.json`
  ```diff
      "start": "npm run build && npm run onlystart",
  -   "onlystart": "node util/exec dist",
  +   "onlystart": "node util/exec out",
  -   "build": "rimraf dist/ typings/ && tsc",
  +   "build": "rimraf out/ typings/ && tsc",
      "lint": "eslint .",
  ```

### 3. ボットの各種設定をします
[「ボットの設定について」](./configuration.md)を参考に、ボットの設定を行います。

* `config.json`は画面左の`Files`のところにある`+`ボタンをクリックし、`config.json`という名前でファイルを作成し、`config.json.sample`の内容をコピー＆ペーストして設定します。  
  ![Files>+](https://cdn.discordapp.com/attachments/1076366496818806825/1076524737548800120/image.png)
  　
  ![config.jsonの名前で保存](https://cdn.discordapp.com/attachments/1076366496818806825/1076524799565770832/image.png)
* `.env`は図のように設定します。
  ![envの設定例](https://cdn.discordapp.com/attachments/1076366496818806825/1076524525115670648/image.png)

### 4. 完了
  しばらくすると、ボットが起動します。ボットの状況については画面下の`LOGS`をクリックしてログを参照してください。
