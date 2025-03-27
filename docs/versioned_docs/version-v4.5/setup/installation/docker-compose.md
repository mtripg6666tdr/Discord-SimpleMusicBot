---
sidebar_position: 1
---
# Docker Composeを使用する
`compose.yml`を利用し、`MongoDB`の立ち上げまでを一括して行える、
[Docker Compose](https://docs.docker.com/compose/)を利用した方法を利用することができます。  
また、この方法を使用すると、ボットの複数台の同時稼働も容易になります。

## 必要な環境
このボットを [Docker](https://www.docker.com/)、Docker-Composeで利用するためには、以下の環境が必要です。
- Dockerを利用できること
- CPUのアーキテクチャがAMD64またはARM64

:::info

この方法を使用すると、基本的に`latest`タグが付いたイメージが使用されます。  
イメージは、リリースノートが公開されてから、約30～40分後にビルドが完了し公開されます。

:::

## 設定の手順
### 1. `compose.yml`を用意します。
[ここ](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/compose.yml.sample)から、
`compose.yml.sample`を入手し、適当なフォルダに`compose.yml`として配置し、必要であれば適宜編集を加えます。  

### 2. ボットの設定
ボットを実行するには、ボットのトークンを含む各種設定が必要です。[「ボットの設定について」](./configuration)を参考に、設定を行ってください。  
設定ファイルは適当な場所に配置します。その際はファイルのパスを控えておいてください。
`.env`の内容は`.env`を使用せずとも、`compose.yml`に直接記述することもできます。
```yml title=compose.yml
# ...
  bot:
    image: ghcr.io/mtripg6666tdr/discord-music-bot:latest
    # ...
    # highlight-start
    environment:
      - KEY=VALUE
    # highlight-end
# ...
```

### 3. `compose.yml`を編集します
- `.env`ファイルを利用する場合、`.envファイルのパスを指定`のコメントの下の行を`.env`のパスに書き換えます。
- `.env`ファイルを使用しない場合は、`environment:`以下に必要な環境変数を書き加えます。
- `config.jsonのパスを指定`のコメントの下の行を`config.json`のパスに書き換えます。
- ログの保存先のフォルダを用意し、`ログの保存先を指定`コメントの下の行を、そのフォルダのパスに書き換えます。

### 3. 実行
以下のコマンドで、データベースを立ち上げ、ボットを実行します。
```sh
docker compose up -d
```

## 起動と停止
- 起動するには、以下のコマンドを使用します。
  ```sh
  docker compose up -d
  ```

- 停止するには、以下のコマンドを使用します。
  ```sh
  docker compose stop
  ```

- 停止してコンテナを削除するには、以下のコマンドを使用します。
  ```sh
  docker compose down
  ```

## 更新
ボットを更新するには、以下のコマンドを実行します。
```sh
docker compose pull
docker compose down
docker compose up -d
```

