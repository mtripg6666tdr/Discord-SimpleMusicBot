import { GuildDataContainer } from "../definition";

/**
 * すべてのマネージャークラスの基底クラスです
 */
export abstract class ManagerBase{
  // 親ノード
  protected info:GuildDataContainer = null;
  /**
   * 親となるGuildVoiceInfoをセットする関数（一回のみ呼び出せます）
   * @param data 親のGuildVoiceInfo
   */
  SetData(data:GuildDataContainer){
    if(this.info) throw "すでに設定されています";
    this.info = data;
  }
}