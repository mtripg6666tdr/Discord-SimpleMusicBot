import type { GuildDataContainer } from "./GuildDataContainer";

import { LogEmitter } from "../Structure";

/**
 * すべてのマネージャークラスの基底クラスです
 */
export abstract class ManagerBase extends LogEmitter {
  // 親ノード
  protected server:GuildDataContainer = null;

  /**
   * 親となるGuildVoiceInfoをセットする関数（一回のみ呼び出せます）
   * @param data 親のGuildVoiceInfo
   */
  setBinding(data:GuildDataContainer){
    if(this.server) throw new Error("すでに設定されています");
    this.server = data;
    this.SetGuildId(this.server.guildID);
  }
}
