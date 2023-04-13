---
sidebar_position: 4
---

# ボットの権限
このボットで使用するコマンドは、以下にリストされているもののみです。これらの権限が確実に与えられるようにしてください。

:::info
ボットの権限フラグの整数は`7465984`です。  
OAuth認証でボットをサーバーに追加する際に、`permissions=7465984`の形で渡すことで、以下の権限を一括で付与できます。
:::

|権限名|権限名(日本語)|権限の説明|
|----|----|----|
|Read Messages/View Channels|チャンネルの閲覧|基本動作のために必須|
|Send Messages|メッセージの送信|基本動作のために必須|
|Manage Messages|メッセージの管理|送信されたリンクの埋め込みを消去するために必要|
|Embed links|埋め込みリンク|各コマンドに対する応答に必要|
|Attach files|ファイルを添付|エクスポートコマンドに必要|
|Read Message History|メッセージ履歴を読む|インポートコマンドに必要|
|Connect|接続|ボイスチャンネルへの接続に必要|
|Speak|発言|ボイスチャンネルでオーディオを再生するのに必要|
|Mute Members|メンバーをミュート|抑制されているボイスチャンネルでミュートを外すのに必要|

:::info
Discord Developer Portalで、ボットに対してMessage Content Intentを有効にしないと、メッセージベースのコマンドや、その他の一部機能を使用することはできません。
![Message Content Intent](https://cdn.discordapp.com/attachments/1024683345625497601/1025018178146926733/unknown.png)

無効にしたまま使用する場合は、[`config.json`で`noMessageContent`を`true`に設定](installation/configuration.md#nomessagecontent-boolean)してください。 
:::
