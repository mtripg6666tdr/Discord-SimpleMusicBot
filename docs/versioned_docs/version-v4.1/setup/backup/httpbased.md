---
sidebar_position: 2
---
# ボット独自のデータベース
(v1.0.0で追加)

ボット独自のデータベースは、HTTP通信をベースとしたサーバーです。  
このサーバーをバックアップ先のサーバーとして使用するには、まずサーバーを構築する必要があります。

:::warning

このバックアップのオプションは**現在推奨されていません**。可能であればほかのオプションを使用してください。

:::

:::info

サンプルの実装を使えば、自分で実装することなくデータベースを使用できます。

:::

## 構築
サーバーの構築は、以下に示すAPI仕様に従って作るだけであるため、任意の言語で実装することができます。

## API仕様
APIサーバーのエンドポイントはひとつで、クエリパラメーターもしくはリクエストボディのjsonデータによって動作を変えるようになっている必要があります。  
### **GET (type=j)**
  > 各サーバーのステータス情報を返却します  

  リクエストクエリ: 
  ```
  ?type=j&token={token}&guildid={guildid}
  ```
  > `{token}`: `process.env.DB_TOKEN` に指定したトークン。これにより認証します。)  
  > `{guildid}`: 要求するサーバーIDをカンマで連結したリスト(ex. 111111111111,22222222222,3333333333333)  

  レスポンス: トークンが一致すればデータベースに存在する各サーバーのJSONデータを返却します  
  例:
  ```json
  {"status": 200, "data": {"サーバーID": "文字列化したステータス情報", ...}}
  ```
  失敗した場合は、ステータスコードだけのオブジェクトを返します。
  ```json
  {"status": 400}
  ```
### **GET (type=queue)**
  > 文字列化した各サーバーのキューを返却します

  リクエストクエリ: 
  ```
  ?type=queue&token={token}&guildid={guildid}
  ```
  > `{token}`: `process.env.DB_TOKEN` に指定したトークン。これにより認証します。)  
  > `{guildid}`: 要求するサーバーIDをカンマで連結したリスト(ex. 111111111111,22222222222,3333333333333)  

  レスポンス: トークンが一致すればデータベースに存在する各サーバーのJSONデータを返却します
  例:
  ```json
  {"status": 200, "data": {"サーバーID": "文字列化したキュー", ...}}
  ```
  失敗した場合は、ステータスコードだけのオブジェクトを返します。
  ```json
  {"status": 400}
  ```

### **POST (type=j)**
  > データベースに文字列化した各サーバーのステータス情報を登録します。または既に存在する場合は更新します。

  リクエストペイロード(JSON):
  ```json
  {
    "token": "{token}",
    "type": "j",
    "guildid": "{guildid}",
    "data": "{data}"
  }
  ```
  > `{token}`: `process.env.DB_TOKEN` に指定したトークン。これにより認証します。)  
  > `{guildid}`: \{data\}に含まれるステータス情報のサーバーIDをカンマで連結したリスト  
  > `{data}`: 以下のようなJSONを文字列化した文字列
  > ```json
  > {"サーバーID": "文字列化したステータス情報", ...}
  > ```

  レスポンス: トークンが一致すればデータベースを更新し、成功すれば、以下のようなJSONを返す
  ```json
  {"status": 200}
  ```
  失敗した場合は、ステータスコードだけのオブジェクトを返します。
  ```json
  {"status": 400}
  ``` 

### **POST (type=queue)**
  > データベースに文字列化した各サーバーのキューを登録します。または既に存在する場合は更新します。

  リクエストペイロード(JSON):
  ```json
  {
    "token": "{token}",
    "type": "queue",
    "guildid": "{guildid}",
    "data": "{data}"
  }
  ```
  > `{token}`: `process.env.DB_TOKEN` に指定したトークン。これにより認証します。)  
  > `{guildid}`: \{data\}に含まれるキューデータのサーバーIDをカンマで連結したリスト  
  > `{data}`: 以下のようなJSONを文字列化した文字列
  > ```json
  > {"サーバーID": "文字列化したキュー", ...}
  > ```

  レスポンス: トークンが一致すればデータベースを更新し、成功すれば、以下のようなJSONを返す
  ```json
  {"status": 200}
  ```
  失敗した場合は、ステータスコードだけのオブジェクトを返します。
  ```json
  {"status": 400}
  ```

:::info
仕様上は、すべての応答でHTTP 200を返すことが望まれますが、後にあげるサンプルサーバーでは、正常に処理されたとき以外はHTTP 400を返すようになっています。
:::

## サーバーのサンプル実装
以下のサンプル実装を使用して、簡単にAPIサーバーを構築したり、あるいは各自のバックアップサーバーの構築の参考にすることができます。

- [Node.js(ファイルベース)](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/util/exampleDbServer/node)
  - このサンプルでは、`package.json`があるディレクトリの`.data`ディレクトリの中にデータをファイルとして保存しています。
  - 環境変数として`TOKEN`を設定してください。これが`DB_TOKEN`の設定内容となります。
  - ポート番号は`8082`です。
  - `npm run build`でコンパイルし、`npm run start`でサーバーを開始することができます。

## ボットに構成する
`DB_URL`に構築したサーバーのURL、`DB_TOKEN`に秘密のパスフレーズを設定してください。

:::info
バックアップサーバーと`DB_TOKEN`に設定するパスフレーズは、セキュリティのためのものであり、同じ文字列が設定されてさえいれば、任意の文字列を指定することができます。
:::
