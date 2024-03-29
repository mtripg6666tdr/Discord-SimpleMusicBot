---
sidebar_position: 5
---

# コマンド使用時の権限
複数のメンバーがボイスチャンネルに参加している場合に、一部コマンドの使用が制限されるようになっています。  
これは、ボイスチャンネルのメンバーの一部が独断で判断しキューを攪乱するなどの行為を回避するものです。  
この時に、これらの制限されたコマンドを使用できるのは以下に該当するメンバーのみです。
- DJロールのメンバー
  :::info
  ボットに"DJロール"として認識されるロールは、デフォルトでは`DJ`という名前のロールです。  
  "DJロール"として認識されるロールの名前は、[`config.json`で変更できます](./installation/configuration.md#djrolenames-string--null--undefined)。
  :::
- サーバーの管理権限、チャンネルの管理権限、そして管理者権限を持っているメンバー  
- 操作の対象となる楽曲を追加したユーザー（一部のコマンドのみ。）
  - 例）自分で追加した楽曲に対しては、いつでも削除コマンドを使用できます。  

各コマンドを使用する際の具体的な権限については、[機能ガイド>コマンド](../guide/commands/overview.md)からご確認いただけます。

:::note
各コマンドの権限の一覧は[こちら](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/issues/519#issuecomment-1264396918)を参照から確認できます。
:::
