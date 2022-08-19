import type { CommandMessage } from "../Component/CommandMessage";

export type SearchPanel = {
  /**
   * 検索窓のメッセージを保存します
   */
  Msg: {
    /**
     * 検索窓のメッセージID
     */
    id: string,
    /**
     * 検索窓のチャンネルID
     */
    chId: string,
    /**
     * 検索したユーザーのID
     */
    userId: string,
    /**
     * 検索者のユーザー名
     */
    userName: string,
    /**
     * 検索が要求されたときのメッセージ
     */
    commandMessage: CommandMessage,
  },
  /**
   * 検索窓の内容を保存します
   */
  Opts: {[num:number]: VideoInfo},
};

type VideoInfo = {
  url:string,
  title:string,
  duration:string,
  thumbnail:string,
};
