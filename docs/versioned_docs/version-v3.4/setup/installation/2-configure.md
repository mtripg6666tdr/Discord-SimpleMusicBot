# 2. Botのトークンなどの設定  
ボットの各種設定を`.env`、`config.json`に設定します。  
詳しくは以下を参照してください。

## 設定ファイルの詳細について
本ボットの設定ファイルは、`.env`と`config.json`の2ファイルです。

## `.env`ファイル
[サンプルファイル](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/.env.sample)

こちらには主にトークンなどの認証情報を記述します。  
`.env.sample`がサンプルファイルとなっていますので、コピー＆リネームしてお使いください。  
- TOKEN  
  ボットのトークンです。Discord Developer Portalから取得してください。
- CSE_KEY  
  歌詞検索に使用するGoogle Custom Searchのkeyです。(任意指定)
- GAS_URL  
  「キューやループの有効無効等のデータのバックアップ」に使用するデータベースサーバーのURLです。(任意指定)  
  サーバーの仕様等についてはあとのセクションを参照してください。
- GAS_TOKEN  
  「キューやループの有効無効等のデータのバックアップ」に使用するデータベースサーバーのトークンです。(任意指定)  
  サーバーの仕様等についてはあとのセクションを参照してください。

## `config.json`ファイル
[サンプルファイル](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/config.json.sample)

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
(カッコ内は、型です。)
- adminId (string|null)  
  管理人のユーザーのID。設定しない場合は`null`
- debug (boolean)  
  デバッグ用の構成で起動するか。デバッグ用構成では、出力されるログの量が増え、ログがファイルとして出力されます。
- maintenance (boolean)  
  メンテナンス用の構成で起動するか。メンテナンス用構成では、`adminId`で指定した管理者以外からのコマンドをすべて無視します。
- errorChannel (string|null)  
  エラーレポートを送信するテキストチャンネルのID。設定しない場合は`null`
- proxy (string|null)  
  プロキシを使用する場合はそのURL。設定しない場合は`null`
- prefix (string|null)  
  指定する場合は一文字でデフォルトプレフィックスを指定してください。(任意指定)  
  こちらは互換性のため、プロパティ自体が省略されていても動作するようになっています。
- webserver (boolean)  
  ウェブサーバーを起動するか（任意指定）  
  こちらは互換性のため、プロパティ自体が省略されていても動作するようになっています。
- bgm (object)  
  自動的にBGMを再生するように構成できます。設定方法については[こちらのファイル](https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/master/util/config-with-bgm.json)を参考にしてください。


設定が出来たら、トランスパイルして、実行してみましょう！次のページへ進みます。
