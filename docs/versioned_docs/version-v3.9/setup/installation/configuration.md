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
  ボットのトークンです。Discord Developer Portalから取得してください。
### `CSE_KEY`  
  歌詞検索に使用するGoogle Custom Searchのkeyです。(任意指定)
### `GAS_URL`  
  「キューやループの有効無効等のデータのバックアップ」に使用するデータベースサーバーのURLです。(任意指定)  
  サーバーの仕様等については[バックアップ](../backup/overview.md)を参照してください。
### `GAS_TOKEN`
  「キューやループの有効無効等のデータのバックアップ」に使用するデータベースサーバーのトークンです。(任意指定)  
  サーバーの仕様等については[バックアップ](../backup/overview.md)を参照してください。

## `config.json`ファイル
- [サンプルファイル](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/config.json.sample)

こちらにはボットの設定情報などを記述します。  

:::warning
任意指定の設定に関しては、**値をnullにしてください("null"ではなくnull)**  
例：
```json
{
  "proxy": null
}
```
:::

`config.json.sample`がサンプルファイルとなっていますので、コピー＆リネームしてお使いください。  
(カッコ内は設定値の、TypeScript表記の"型"です。)
### `adminId` (string|null)  
  管理人のユーザーのID。設定しない場合は`null`
### `debug` (boolean)  
  デバッグ用の構成で起動するかを指定します。通常であれば`false`に設定してください。  
  デバッグ用構成を有効にすると、ボットの動作が以下のように変更されます。
  - 出力されるログの量が増えます。
  - 権限がある場合、ログが`logs`フォルダーにファイルとして出力されます。
  - 想定されていないエラーが発生した場合、ボットはクラッシュし、プログラムが終了します。

:::info
このオプションは、`Node.js`の`--inspect`オプションとはまったく別であるため、このオプションを使用しても、デバッガーを接続することはできません。
:::

### `maintenance` (boolean)  
  メンテナンス用の構成で起動するか。メンテナンス用構成では、`adminId`で指定した管理者以外からのコマンドをすべて無視するようになります。
### `errorChannel` (string|null)  
  エラーレポートを送信するテキストチャンネルのID。設定しない場合は`null`
### `proxy` (string|null)  
  プロキシを使用する場合はそのURL。設定しない場合は`null`
### `prefix` (string|null)  
  指定する場合は一文字でデフォルトプレフィックスを指定してください。(任意指定)  
  こちらは互換性のため、プロパティ自体が省略されていても動作するようになっています。
### `webserver` (boolean)  
  ウェブサーバーを起動するか（任意指定）  
  こちらは互換性のため、プロパティ自体が省略されていても動作するようになっています。
### `bgm` (object)  
  このプロパティを設定することで、自動的にBGMを再生するように構成できます。(任意指定)  
  設定方法については[こちらのファイル](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/util/config-with-bgm.json)を参考にしてください。  
  こちらは互換性のため、プロパティ自体が省略されていても動作するようになっています。
### `noMessageContent` (boolean)
  Message Content IntentがDiscord Developers Portalで無効になっている場合は、`true`に設定してください。(任意指定)  
  デフォルトは`false`です。  
  こちらは互換性のため、プロパティ自体が省略されていても動作するようになっています。

---

設定はこれで以上となります。
