import * as os from "os";
import * as https from "https";
import { Client, Message } from "discord.js";
export { log, logStore } from "./logUtil";

/**
 * 合計時間(秒)からゼロ補完された分および秒を計算します。
 * @param _t 合計時間(秒)
 * @returns [ゼロ補完された分,ゼロ補完された秒]
 */
export function CalcMinSec(_t:number){
  const sec = _t % 60;
  const min = (_t - sec) / 60;
  return [AddZero(min.toString(), 2), AddZero(sec.toString(), 2)];
}

/**
 * 指定された文字列を指定された桁数になるまでゼロ補完します。
 * @param str 補完する文字列
 * @param length 補完後の長さ
 * @returns 保管された文字列
 */
export function AddZero(str:string, length:number){
  if(str.length >= length) return str;
  while(str.length < length){
    str = "0" + str;
  }
  return str;
}

// Returns hour, min, sec and millisec from total millisec
/**
 * 合計時間(ミリ秒)から時間,分,秒,ミリ秒を計算します。
 * @param date 合計時間(ミリ秒)
 * @returns [時間,分,秒,ミリ秒]
 */
export function CalcTime(date:number):number[]{
  const millisec = date % 1000;
  var ato = (date - millisec) / 1000;
  const sec = ato % 60;
  ato = (ato - sec) / 60;
  const min = ato % 60;
  const hour = (ato - min) / 60;
  return [hour, min, sec, millisec];
}

/**
 * メモリ使用情報
 */
type MemoryUsageInfo = {free:number,total:number,used:number,usage:number};

/**
 * メモリ使用情報を取得します
 * @returns メモリ使用情報
 */
export function GetMemInfo():MemoryUsageInfo{
  var memory = {} as MemoryUsageInfo;
  memory.free = GetMBytes(os.freemem());
  memory.total = GetMBytes(os.totalmem());
  memory.used = memory.total - memory.free;
  memory.usage = GetPercentage(memory.used, memory.total);
  return memory;
}

/**
 * 指定されたバイト数をメガバイトに変換します
 * @param bytes 指定されたバイト
 * @returns 返還後のメガバイト数
 */
export function GetMBytes(bytes:number) {
  return Math.round(bytes / 1024/*KB*/ / 1024/*MB*/ * 100) / 100;
}

/**
 * パーセンテージを計算します
 * @param part 計算対象の量
 * @param total 合計量
 * @returns 計算後のパーセンテージ
 */
export function GetPercentage(part:number, total:number){
  return Math.round(part / total * 100 * 100) / 100;
}

/**
 * 文字列をBase64エンコードします
 * @param txt エンコードする文字列
 * @returns Base64エンコードされた文字列
 */
export function btoa(txt:string){
  return Buffer.from(txt).toString("base64");
}

/**
 * 指定されたURLからテキストデータをダウンロードします
 * @param url URL
 * @returns ダウンロードされたテキストデータ
 */
export function DownloadText(url:string):Promise<string>{
  return new Promise((resolve,reject)=>{
    https.get(url, res => {
      var data = "";
      res.on("data", chunk =>{
        data += chunk;
      });
      res.on("end", ()=>{
        resolve(data);
      });
      res.on("error", reject);
    }).on("error", reject);
  })
}

/**
 * ローオーディオファイルのURLであるかどうかをURLの末尾の拡張子から判断します
 * @param str 検査対象のURL
 * @returns ローオーディオファイルのURLであるならばtrue、それ以外の場合にはfalse
 */
export function isAvailableRawAudioURL(str:string){
const exts = [".mp3",".wav",".wma",".mov",".mp4"];
return exts.filter(ext => str.endsWith(ext)).length > 0;
}

/**
 * おそらくDiscord側のAPIの仕様変更により、discord.jsのMessage.suppressEmbeds()が動作しなくなったため代替としてREST APIを叩きます
 * @param msg suppressEmbedsしたいメッセージ
 * @param client supressEmbedsするクライアント
 * @param token ボットのトークン
 * @returns supressEmbedsされたメッセージ
 */
export function suppressMessageEmbeds(msg:Message, client:Client, token:string):Promise<Message>{
  return new Promise((resolve, reject)=>{
    const req = https.request({
      protocol: "https:",
      host: "discord.com",
      path: "/api/channels/" + msg.channel.id + "/messages/" + msg.id,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Discord Bot",
        "Authorization": "Bot " + token
      }
    }, (res) => {
      var data = "";
      res.on("data", (chunk)=> data += chunk);
      res.on("end", ()=>{
        if(res.statusCode === 200){
          resolve(new Message(client, JSON.parse(data), msg.channel));
        }else{
          reject();
        }
      });
      res.on("error", reject);
    });
    req.end(JSON.stringify({
      // SUPPRESS_EMBEDS
      flags: 1<<2
    }));
  });
}

/**
 * HTMLエンティティをエンコードまたはデコードします。
 * Ref: https://qiita.com/ka215/items/ace36f55c3ad1297de81
 * @param text 処理対象の文字列
 * @param proc 処理内容
 * @returns 処理された文字列
 */
export function htmlEntities( text:string, proc:"encode"|"decode" ) {
  var entities = [
    ['amp', '&'],
    ['apos', '\''],
    ['lt', '<'],
    ['gt', '>'],
  ];

  for ( var i=0, max=entities.length; i<max; i++ ) {
    if ( 'encode' === proc ) {
      text = text.replace(new RegExp( entities[i][1], 'g' ), "&"+entities[i][0]+';' ).replace( '"', '&quot;' );
    } else {
      text = text.replace( '&quot;', '"' ).replace(new RegExp( '&'+entities[i][0]+';', 'g' ), entities[i][1] );
    }
  }
  return text;
}