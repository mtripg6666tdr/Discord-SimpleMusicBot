# プレフィックスの変更
(v1.0.0で追加)  
(v3.10.0で複数文字のプレフィックス対応)  

:::info
この機能は、Message Content Intentが有効になっている場合にのみ使用できます。([→使用する権限](../../setup/permission.md))  
:::

メッセージベースのコマンドを使用する際のプレフィックスを変更することができます(複数文字対応)。  
ボットのデフォルトのプレフィックスは、`>`です。

## ボットレベルで変更する
ボットの管理者は、ボットのデフォルトのプレフィックスを`config.json`にて変更することができます。  
方法については、[こちら](../../setup/installation/configuration.md##prefix-stringnull)を参照してください。

## サーバーでのプレフィックスを変更する
サーバーでのプレフィックスを変更するには、ボットのニックネームをDiscordで変更してください。  
例えば、プレフィックスを`!`に変更したい場合、ボットのニックネームを`[!]音楽ボット`などとします。  
![ニックネーム変更例](https://static-objects.usamyon.moe/dsmb/docs-assets/guide_prefix_nickname.png)

## 現在のプレフィックスを調べる
現在のボットのプレフィックスの設定を確認するには、ボットをメンションしてください。
![ボットのプレフィックスを調べる](https://static-objects.usamyon.moe/dsmb/docs-assets/guide_prefix_2.png)
