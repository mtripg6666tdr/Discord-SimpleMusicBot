import { GuildVoiceInfo } from "../definition";

/**
 * すべてのマネージャークラスの基底クラスです
 */
export abstract class ManagerBase{
  // 親ノード
  protected info:GuildVoiceInfo = null;
  /**
   * 親となるGuildVoiceInfoをセットする関数（一回のみ呼び出せます）
   * @param data 親のGuildVoiceInfo
   */
  SetData(data:GuildVoiceInfo){
    if(this.info) throw "すでに設定されています";
    this.info = data;
  }
}