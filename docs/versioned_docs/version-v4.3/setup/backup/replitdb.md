---
sidebar_position: 3
---
# Replit Databaseを使用する
(v4.0.0で追加)

[Replit](https://replit.com)でのReplに組み込みの[Replit Database](https://docs.replit.com/hosting/databases/replit-database)を、バックアップ先のサーバーとして使用することができます。

:::info

Replの作成方法などについての詳細な説明は、ここでは解説しません。

:::

:::danger

Replitの登録および使用には、Replitが定める規約等の同意が必要となります。必ずあらかじめ確認してください。

:::

## ボットに構成する
Replitでボットを起動させている場合には、`.env`の`DB_URL`を`replit+local`に設定します。  

```env title=".env"
DB_URL=replit+local
```

:::note

`DB_TOKEN`は使用されません。

:::

## Replitの外部で使用する
Replitの外部で使用することもできますが、[公式のヘルプページ](https://docs.replit.com/hosting/databases/replit-database)に記載の通り、
ReplitのDatabaseのURLは可変なため、推奨されません。  
デバッグ等の目的で外部から使用したい場合は以下の手順に従います。

### 1. Replit DatabaseのURLを控えます
Replの画面から、貝殻マークの`Shell`を選択し、以下のコマンドを入力します。
```sh
echo $REPLIT_DB_URL
```
ここで表示されたURLをコピーして控えておきます。

### 2. ボットに構成します
`.env`でボットに構成します。例えば、前の手順でコピーしたURLが`https://example.com/foobar`だった場合には、以下のように`.env`を設定します。

```env title=".env"
DB_URL=replit+https://example.com/foobar
```
