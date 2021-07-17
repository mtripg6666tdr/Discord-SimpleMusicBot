import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { PageToggle } from "../Component/PageToggle";
import { getColor } from "../Util/colorUtil";

export default class Commands implements CommandInterface{
  name = "コマンド";
  alias = ["command", "commands", "cmd"];
  description = "コマンド一覧を表示します";
  unlist = true;
  category = "bot";
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    const embed = [] as discord.MessageEmbed[];
    embed.push(
      new discord.MessageEmbed()
      // ボイスチャンネル操作
      .setTitle("ボイスチャンネル操作系")
      .addField("参加, join", "ボイスチャンネルに参加します。", true)
      .addField("切断, 終了, leave, disconnect, dc", "ボイスチャンネルから切断します。", true)
      ,
      // プレイヤー制御
      new discord.MessageEmbed()
      .setTitle("音楽プレイヤー制御系")
      .addField("現在再生中, 今の曲, nowplaying, np", "現在再生中の曲の情報を表示します。", true)
      .addField("再生, play, p", "キュー内の楽曲を再生します。引数としてYouTubeの動画のURLを指定することもできます。", true)
      .addField("一時停止, 一旦停止, 停止, pause, stop", "再生を一時停止します。", true)
      .addField("スキップ, skip, s", "現在再生中の曲をスキップします", true)
      .addField("頭出し, rewind, gotop, top", "再生中の曲の頭出しを行います。", true)
      .addField("ループ, loop", "トラックごとのループを設定します。",true)
      .addField("キューループ, loopqueue, queueloop", "キュー内のループを設定します。", true)
      .addField("ワンスループ, onceloop, looponce", "現在再生中の曲を1度だけループ再生します。", true)
      .addField("シャッフル, shuffle", "キューの内容をシャッフルします。", true)
      .addField("音量, volume", "音量を調節します。1から200の間で指定します(デフォルト100)。何も引数を付けないと現在の音量を表示します。", true)
      .addField("関連動画, 関連曲, おすすめ, オススメ, related, relatedsong, r, recommend", "YouTubeから楽曲を再生終了時に、関連曲をキューに自動で追加する機能です", true)
      ,
      // プレイリスト操作系
      new discord.MessageEmbed()
      .setTitle("プレイリスト操作系")
      .addField("キュー, 再生待ち, queue, q", "キューを表示します。", true)
      .addField("検索, search, se", "曲をYouTubeで検索します。YouTubeの動画のURLを直接指定することもできます。", true)
      .addField("サウンドクラウドを検索, soundcloudを検索, searchs, ses, ss", "曲をSoundCloudで検索します", true)
      .addField("キューを検索, searchq, seq, sq", "キュー内を検索します", true)
      .addField("移動, mv, move", "曲を指定された位置から指定された位置までキュー内で移動します。2番目の曲を5番目に移動したい場合は`mv 2 5`のようにします。", true)
      .addField("最後の曲を先頭へ, movelastsongtofirst, mlstf, ml, mltf, mlf, m1", "キューの最後の曲を先頭に移動します", true)
      .addField("削除, rm, remove", "キュー内の指定された位置の曲を削除します。", true)
      .addField("全て削除, すべて削除, rmall, allrm, removeall", "キュー内の曲をすべて削除します。", true)
      .addField("leaveclean, lc", "ボイスチャンネルから離脱した人のリクエストした曲を削除して整理します", true)
      .addField("インポート, import", "指定されたメッセージに添付されたキューからインポートします。exportコマンドで出力されたファイルが添付されたメッセージのURL、あるいはキューの埋め込みのあるメッセージのURLを引数として添付してください。", true)
      .addField("エクスポート, export", "キューの内容をインポートできるようエクスポートします。", true)
      .addField("この曲で終了, end", "現在再生中の曲(再生待ちの曲)をのぞいてほかの曲をすべて削除します", true)
      .addField("study, bgm", "開発者が勝手に作った勉強用・作業用BGMのプレイリストをキューに追加します", true)
      ,
      // ユーティリティ系
      new discord.MessageEmbed()
      .setTitle("ユーティリティ系")
      .addField("リセット, reset", "サーバーの設定やデータを削除して初期化します。", true)
      .addField("アップタイム, ping, uptime", "ボットのアップタイムおよびping時間(レイテンシ)を表示します。", true)
      .addField("ログ, log, システム情報, systeminfo, sysinfo", "ホストされているサーバーやプロセスに関する技術的な情報を表示します。引数を指定して特定の内容のみ取得することもできます。", true)
      .addField("歌詞, l, lyric, lyrics", "指定された曲の歌詞を検索します。", true)
      .addField("サムネイル, thumb, thumbnail, t", "サムネイルを表示します。検索結果のオフセットを指定して検索結果のサムネイルを表示することもできます", true)
      ,
      // 一般ボット操作
      new discord.MessageEmbed()
      .setTitle("ボット操作全般")
      .addField("ヘルプ, help", "ヘルプを表示します。", true)
      .addField("command, commands, cmd", "コマンド一覧を表示します", true)
      ,
    );
    for(let i = 0; i < embed.length; i++){
      embed[i].setTitle("コマンド一覧(" + embed[i].title + ")");
      embed[i].setDescription("コマンドの一覧です。\r\n`" + (i+1) + "ページ目(" + embed.length + "ページ中)`\r\nコマンドプレフィックスは、`" + options.data[message.guild.id].PersistentPref.Prefix + "`です。");
      embed[i].setColor(getColor("COMMAND"));
    }
    const msg = await message.channel.send(embed[0]);
    const toggle = await PageToggle.init(msg, embed);
    options.EmbedPageToggle.push(toggle);
  }
}