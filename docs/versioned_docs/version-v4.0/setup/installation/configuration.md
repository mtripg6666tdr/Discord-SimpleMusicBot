# ボットの設定について  
本ボットの設定ファイルは、`.env`と`config.json`の2ファイルです。これらに各種設定を記述します。  
各サンプルファイルを参考にして各自で作成してください。

## `.env`ファイル
- [サンプルファイル](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/.env.sample)

こちらには主にトークンなどの認証情報を記述します。  
`.env.sample`がサンプルファイルとなっていますので、コピー＆リネームしてお使いください。  

:::info

なお、`.env`ファイルを使わず、環境変数でも代用することができます。都合の良い方をお使いください。

:::

:::info

replitなど、環境変数の設定方法が特殊な場合もあるため、replitのようなホスティングサービスを使用する際は、利用するサービスのヘルプページをご覧ください。

:::

### `TOKEN`  
  ボットのトークンです。[Discord Developer Portal](https://discord.com/developers/applications)から取得してください。
### `CSE_KEY`  
  歌詞検索に使用する[Google Custom Search](https://developers.google.com/custom-search/v1/introduction?hl=ja)のkeyです。(任意指定)
### `DB_URL`  
  「キューやループの有効無効等のデータのバックアップ」に使用するデータベースサーバーのURLです。(任意指定)  
  サーバーの仕様等については[バックアップ](../backup/overview.md)を参照してください。
### `DB_TOKEN`
  「キューやループの有効無効等のデータのバックアップ」に使用するデータベースサーバーのトークンです。(任意指定)  
  サーバーの仕様等については[バックアップ](../backup/overview.md)を参照してください。
### `LOG_TRANSFER_PORT`
  内部的に、ロガーで使用されるTCPポートの番号を指定します。(任意指定)  
  複数のボットを同時稼働する際には、それぞれのボットで違う値を設定する必要があります。  
  デフォルトでは`5003`が使用されます。

## `config.json`ファイル
- [サンプルファイル](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/config.json.sample)

こちらにはボットの設定情報などを記述します。  

:::warning
任意指定の設定に関しては、**値をnullにしてください("null"ではなくnull)**  
例：

```json title="config.json"
{
  "proxy": null
}
```
:::

`config.json.sample`がサンプルファイルとなっていますので、コピー＆リネームしてお使いください。  
(カッコ内は設定値の、TypeScript表記の"型"です。)
### `adminId` (string | string[] | null)  
  管理人のユーザーのIDを指定します。複数の管理人がいる場合は、配列で指定してください。設定しない場合は`null`
### `debug` (boolean)  
  デバッグ用の構成で起動するかを指定します。通常であれば`false`に設定してください。  
  デバッグ用構成を有効にすると、ボットの動作が以下のように変更されます。
  - 出力されるログの量が増えます。
  - 権限がある場合、ログが`logs`フォルダーにファイルとして出力されます。
  - 想定されていないエラーが発生した場合、ボットはクラッシュし、プログラムが終了します。

:::info
このオプションは、`Node.js`の`--inspect`オプションとはまったく別であるため、このオプションを使用しても、デバッガーを接続することはできません。
:::

### `maxLogFiles` (number | undefined)
  上の`debug`が`true`に設定されている際に出力されるログファイルの最大数を指定できます。
  設定しないとデフォルトで`100`となります。  
  このプロパティは、省略されても動作するようになっています。

:::note

`debug`プロパティが`false`の場合にはこのオプションに効果はありません。

:::

### `maintenance` (boolean)  
  メンテナンス用の構成で起動するか。メンテナンス用構成では、`adminId`で指定した管理者以外からのコマンドをすべて無視するようになります。

### `errorChannel` (string|null)  
  エラーレポートを送信するテキストチャンネルのID。設定しない場合は`null`

### `proxy` (string|null)  
  プロキシを使用する場合はそのURL。設定しない場合は`null`

### `prefix` (string|null)  
  指定する場合は一文字でデフォルトプレフィックスを指定してください。  

### `webserver` (boolean)  
  ウェブサーバーを起動するか  

### `bgm` (object)  
  このプロパティを設定することで、自動的にBGMを再生するように構成できます。  
  詳細は、[BGM機能](../feature/bgm)を参照してください。

### `noMessageContent` (boolean)
  Message Content Intentが[Discord Developer Portal](https://discord.com/developers/applications)で無効になっている場合は、`true`に設定してください。  
  デフォルトは`false`です。  

### `twentyFourSeven` (string[])
  参加しているユーザーがボイスチャンネルから退出しても、再生を一時停止しないボイスチャンネルのIDを配列で指定します。  
  詳細は、[24/7再生機能](../feature/247)を参照してください。  

### `alwaysTwentyFourSeven` (boolean)
  参加しているユーザーがボイスチャンネルから退出しても、再生を一時停止しない場合には`true`に設定します。  
  このオプションが`true`の場合、上の`twentyFourSeven`は常に無視されます。  
  詳細は、[24/7再生機能](../feature/247)を参照してください。  

### `cacheLevel` ("memory" | "persistent")
  ボットによるキャッシュレベルを設定します。`"memory"`を設定すると、メモリ内にキャッシュを保存します。
  ディスクに余裕がある場合は、`"persistent"`を指定することで、キャッシュを永続化できます。  
  `"persistent"`を指定した場合、キャッシュは`./cache`に保存されますが、任意のタイミングで削除することができます。

### `cacheLimit` (number | undefined)
  `cacheLevel`が`persistent`の場合に、`./cache`に保存されるキャッシュの最大容量をMB(メガバイト)単位で指定します。  
  プロパティを省略すると、`500`MBとなります。

:::note

`cacheLevel`プロパティが`"memory"`の場合にはこのオプションに効果はありません。

:::

### `defaultLanguage` (string)
  ボットのデフォルトの言語を設定します。使用可能な言語はリポジトリの`locales`フォルダをご確認ください。日本語であれば`"ja"`です。

### `country` (string)
  ボットがメインとする国コードを設定します。日本であれば`"JP"`です。

---

設定はこれで以上となります。
