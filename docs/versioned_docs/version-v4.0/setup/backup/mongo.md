---
sidebar_position: 1
---
# MongoDB を使用する
(v3.5.0で追加)

MongoDBをバックアップ先のサーバーとして使用することができます。既存のインスタンスを使用することもできます。

:::info
MongoDBは、各自で準備・起動してください。ここでは詳細な起動方法などは解説しません。
:::

:::danger

MongoDBのセットアップと使用には、MongoDBが定めるライセンスや規約等の同意が必要となります。必ずあらかじめ確認してください。

:::

## ボットに構成する
ボットの`.env`に必要な事項を設定します。  
- `DB_URL`には、MongoDBのサーバーのURLを設定します。これは`mongodb://`または`mongodb+srv://`から始まっている必要があります。
- `DB_TOKEN`は任意指定です。こちらには、データベース名を指定することができます。指定しないと、デフォルトで`discord_music_bot_backup`となります。
