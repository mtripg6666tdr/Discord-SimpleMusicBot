import { Util } from "../Util";

export abstract class LogEmitter {
  private tag:string = "";
  private guildId:string = "";
  /**
   * ログに使用するタグを設定します
   * @param tag タグ
   */
  SetTag(tag:string){
    this.tag = tag;
  }
  
  /**
   * ログに使用するサーバーIDを設定します（存在する場合）
   * @param id id
   */
  SetGuildId(id:string){
    this.guildId = id;
  }

  /**
   * ログを出力します
   * @param message メッセージ
   */
  Log(message:string, level?:"log"|"warn"|"error"){
    if(this.tag === "") throw new Error("Tag has not been specified");
    Util.logger.log(`[${this.tag}${this.guildId !== "" ? `/${this.guildId}` : ""}]${message}`, level);
  }
}