---
sidebar_position: 4
---
# 【環境別】Replitで使用する
Discord-SimpleMusicBotをreplitで実行する手順を説明します。

## 前提条件
* Replitへの登録は完了しているものとします。
* PCで作業していることを前提としています。
* Replitで常時稼働する方法についてサポートはいたしません。

## 手順
### 1. Replを作成します
  Replitのトップページで、右上にある`+`ボタンをクリックし、`Create a Repl`の画面で、右上の`Import from GitHub`をクリックします。  
  * `GitHub URL`の欄に、`https://github.com/mtripg6666tdr/Discord-SimpleMusicBot`と入力します。
  * `Language`を`Node.js`にします。
  
  この状態で`Import from GitHub`をクリックして、完了するまで待ちます。

### 2. Node.jsのバージョンを確認します
  貝殻のマークの`Shell`に移動し、以下のコマンドを実行し、バージョンを確認します
  ```sh
  node -v
  ```

  #### Node.jsのバージョンが14以前の場合
  Node.jsのバージョンがv12.x.xやv14.x.xのような古いバージョンの場合、新しいバージョンのNode.jsが使えるよう次のコマンドを実行してください。
  ```sh
  npm i node@v18-lts --no-save
  ```

### 3. 依存関係をインストールします
  以下のコマンドで依存関係をインストールします
  ```sh
  npm i
  ```

### 4. ソースコードをトランスパイルします
  以下のコマンドでソースコードをトランスパイルします。
  ```sh
  npm run build
  ```

### 4. ボットの各種設定を行います
  ボットの各種設定を[「ボットの設定について」](./configuration.md)を参考に行ってください。

  * `.env`ファイルは**作成せず**に、Replitの画面左側の`Tools`の中にある、`Secrets`を選択して設定してください。
    例えば、`.env`で`TOKEN=DISCORDのトークン`としたければ、`key`に`TOKEN`、`value`に`DISCORDのトークン`を設定します。
  * `config.json`は、Replitの画面左側の`Files`のところにある`New File`と出るボタンを押して、`config.json`を作成し、`config.json.sample`をコピー＆ペースとして設定してください。
  * `config.json`の`webserver`は必ず`true`に設定してください。

### 5. 画面上の`Run`から実行します
  これで設定は完了です。

### エラーが発生して動かない場合
  `Error: Cannot find module ...`というエラーが発生して、ボットが起動しない場合は、以下の手順に従ってください。
  1. Replitの画面の左側の`Files`の右にあるメニューボタンを押して、`Show hidden files`を選択します。
  2. ファイルの一覧から`.replit`というファイルを探し、以下のように変更します
```diff title=".replit"
- entrypoint = "index.js"
+ entrypoint = "dist/index.js"
```
