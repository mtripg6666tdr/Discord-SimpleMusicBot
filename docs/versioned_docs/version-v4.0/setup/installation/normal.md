---
sidebar_position: 3
---
# クローンして実行する
リポジトリを [git](https://git-scm.com/) でクローンして実行することができます。

## 必要な環境
このボットをクローンして実行するには、以下の要件が必要です。

### 必須な環境

- [Node.js](https://nodejs.org/) (v16.16以上のv16.x、v18.x、v20.x)がサポートされていて、インストールされていること。
- [npm](https://www.npmjs.com/) が利用できること。
- [ffmpeg](https://ffmpeg.org/) が利用できること。
- [git](https://git-scm.com/) が利用できること。
- C++のビルドツールがインストールされていること。
  - ネイティブな依存関係のビルドに使用されます。
  - Windowsの場合Node.jsのインストール時に、node-gypのビルドツールをインストールするかを聞かれます。
    - もしこれをしないでインストールした場合には、`npm i -g windows-build-tools`を実行するとよいようです。
  - Unix系の場合、そのOSのビルドツールを一発でインストールできる場合があります。
    - Ubuntuの場合、`apt install build-essential`でできます。
    - CentOSの場合、`yum groupinstall "Development Tools"`でできます。

:::note
- `ffmpeg`は、インストール時に`npm`が自動的にダウンロードするため、事前にダウンロードしたり、パスを通したりする必要はありませんが、一部の環境ではこれが利用できない場合があります。その際には、後述の手順で、`npm install`したときに、その旨の表示がされます。この場合、自分で別途ffmpegをインストールする必要があります。  
- 手動でインストールする場合、一部の`ffmpeg`のバージョンは対応していない可能性があるため、最新版を推奨します。
- `npm`で`ffmpeg-static`が利用できる場合、そちらを優先して使用します。
:::

### 推奨事項
これらの事項は、満たしていないと動作しない恐れがある項目です。できる限り満たしておくようにしてください。

- [Python](https://www.python.org/) `2.x` または `3.x` のバージョンがインストールされていること。
- Unix系の環境であれば、`nscd`がインストールされ、サービスが稼働していること。

:::note
`nscd`は、`apt`等のパッケージマネージャーでインストールできます
:::

### 注意

- [Cloudflare WARP](https://1.1.1.1/) などが設定されているとうまく動かないことがあるみたいなので、動作しないようであれば設定を解除してください。
- ボットを実行するユーザーに、ボットを配置するフォルダ(ディレクトリ)の書き込み権限を与えてください。読み取り専用の状態では、一部のボットの機能が正しく動作しない恐れがあります。

## 設定の手順

### 1. クローン
インストールしたいディレクトリへ移動し以下を実行します

```bash
# リポジトリをクローン
git clone https://github.com/mtripg6666tdr/Discord-SimpleMusicBot.git
# カレントディレクトリ移動
cd Discord-SimpleMusicBot
```
masterブランチは開発用のブランチでもあり、未修正のバグが含まれている可能性があるため、最新のバージョンを指定することをお勧めします。
例えば、v3.4.0を使用する場合、以下のようにします。
```bash
git reset --hard v3.4.0
```

以下のコマンドで、依存関係のパッケージをインストールします。
```bash
# 必須パッケージインストール
npm install
```

### 2. ボットの設定
ボットを実行するには、ボットのトークンを含む各種設定が必要です。[「ボットの設定について」](./configuration)を参考に、設定を行ってください。`.env`ファイルや`config.json`ファイルは、`package.json`と同じフォルダに配置します。

### 3. トランスパイル＆実行
以下のコマンドを実行します。

```bash
# トランスパイル
npm run build
# 実行
npm run onlystart
```
  
:::tip
トランスパイルと実行は一括して次のコマンドで行うこともできます。
```bash
npm run start
```
:::

次回から起動する際は、`npm run onlystart`だけで起動することができます。

なお、スラッシュコマンドは、起動時に自動的に追加されるようになりました。スラッシュコマンドについての詳細は、[あとのページ](../feature/slashcommand.md)で解説しています。

## コードの更新
:::warning

v3からv4の更新の際に、config.jsonでの設定内容が追加されています。
追加しないと起動しないようになっていますので、必ずドキュメントサイトや[config.json.sample](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/config.json.sample)を参照の上更新してください。

:::

本ボットを最新のソースコードに更新するには、以下のような操作を行ってください。
```bash
# ソースコードの更新
git fetch
git reset --hard <最新のバージョン>
# 依存関係の更新
npm install
# トランスパイル
npm run build
# 実行
npm run onlystart
```

:::tip
トランスパイルと実行は一括して次のコマンドで行うこともできます。
```bash
npm run start
```
:::
