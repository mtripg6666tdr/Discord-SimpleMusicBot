---
sidebar_position: 2
---
# Dockerを使用する
プリビルドされているDockerイメージを使用して簡単にボットを実行できます。

## 必要な環境
このボットをDockerで利用するためには、以下の環境が必要です。
- Dockerを利用できること
- CPUのアーキテクチャがAMD64またはARM64

## 設定の手順
### 1. イメージをPull
イメージをPullします。
```bash
docker pull ghcr.io/mtripg6666tdr/discord-music-bot:latest
```

:::note
バージョンを指定してPullすることもできます。  
`docker pull ghcr.io/mtripg6666tdr/discord-music-bot:3.4.0`  
イメージが用意されているのは、v3.4.0以降です。  
:::

:::danger
GitHub Packagesに公開されているパッケージのうち、`3.4.0`のようなバージョンの文字列でタグ付けされていないバージョンは、開発段階のイメージですので、使用しないでください。
:::

:::note
イメージは、リリースノートが公開されてから、約30～40分後にビルドが完了し公開されます。
:::

### 2. ボットの設定
ボットを実行するには、ボットのトークンを含む各種設定が必要です。[「ボットの設定について」](./configuration)を参考に、設定を行ってください。  
設定ファイルは適当な場所に配置します。その際はファイルのパスを控えておいてください。
`.env`の内容は`.env`を使用せずとも、コマンドラインで指定することもできます。

### 3. 実行
以下のコマンドを使用して実行します。
```bash
docker container run --mount type=bind,source="<config.jsonのパス>",target=/app/config.json --env-file "<.envのパス>" --name <インスタンスの名前> --detach ghcr.io/mtripg6666tdr/discord-music-bot
```
例えば、`config.json`の場所が`C:\data\config.json`、`.env`の場所が`C:\data\.env`、インスタンスの名前を`dsmb-instance-1`とするの場合、以下のように設定します。
```bash
docker container run --mount type=bind,source="C:\data\config.json",target=/app/config.json --env-file "C:\data\.env" --name dsmb-instance-1 --detach ghcr.io/mtripg6666tdr/discord-music-bot
```
`.env`の内容をコマンドラインで渡す場合は以下のようにします。
```bash
docker container run --mount type=bind,source="<config.jsonのパス>",target=/app/config.json --env TOKEN=<Discordのトークン> --name <インスタンスの名前> --detach ghcr.io/mtripg6666tdr/discord-music-bot
```
コマンドの使用方法に関する詳細は[Dockerの公式ドキュメント](https://docs.docker.jp/engine/reference/commandline/container_run.html)を参照してください。

## 起動と停止
- 起動するには以下のコマンドを使用します。  
  ```bash
  docker container start <インスタンスの名前>
  ```
  コマンドの使用方法に関する詳細は[Dockerの公式ドキュメント](https://docs.docker.jp/engine/reference/commandline/container_start.html)を参照してください。

- 停止するには以下のコマンドを使用します。  
  ```bash
  docker container stop <インスタンスの名前>
  ```
  コマンドの使用方法に関する詳細は[Dockerの公式ドキュメント](https://docs.docker.jp/engine/reference/commandline/container_stop.html)を参照してください。

## 更新
ボットを更新するには、コンテナを削除してから、[上の手順](#1-イメージをpull)にしたがって再度コンテナを作成します。
```bash
# 稼働している場合は、停止します。
docker container stop <インスタンスの名前>
# コンテナの削除
docker container rm <インスタンスの名前>
```
