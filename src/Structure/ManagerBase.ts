import type { GuildDataContainer } from "./GuildDataContainer";

import { LogEmitter } from "../Structure";

/**
 * すべてのマネージャークラスの基底クラスです
 */
export abstract class ManagerBase extends LogEmitter {
  // 親ノード
  protected info:GuildDataContainer = null;

  /**
   * 親となるGuildVoiceInfoをセットする関数（一回のみ呼び出せます）
   * @param data 親のGuildVoiceInfo
   */
  SetData(data:GuildDataContainer){
    if(this.info) throw new Error("すでに設定されています");
    this.info = data;
    this.SetGuildId(this.info.GuildID);
  }
}
