---
sidebar_position: 5
---
# メッセージの一括削除
(v3.0.0で追加)

:::info

サーバー/ボット管理者向けの機能です

:::

:::info

このコマンドの使用には、メッセージの管理権限が必要です。

:::

チャンネル内の、ボットによるメッセージを指定件数分だけまとめて削除する機能を搭載しています。

## 使用方法
`バルク削除`コマンドを使用します。エイリアスとして、`bulk_delete`や`bulk-delete`、`bulkdelete`を使用できます。  
スラッシュコマンドの場合、`/bulk_delete`を使用できます。

## 使用例
- ボットからの最新50件のメッセージを削除する
```
バルク削除 50
```

:::note
現在の処理状況を表示するメッセージが表示されますが、削除が完了すると、このメッセージも数秒で削除されます。
:::