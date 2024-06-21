/*
 * Copyright 2021-2024 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * 長時間かかると予想されるタスクのキャンセル操作のサポートを補助するクラス
 */
export class TaskCancellationManager {
  private _cancelled = false;
  private _message = "";

  /**
   * キャンセルが要求されたかどうかを取得します
   */
  get cancelled(){
    return this._cancelled;
  }

  /**
   * キャンセル時に渡されたメッセージを取得します
   */
  get message(){
    return this._message;
  }

  /**
   * タスクのキャンセルを要求します
   * @param message キャンセルの原因を表すメッセージ等の文字列
   */
  cancel(message?: string){
    if(this._cancelled){
      return false;
    }else{
      this._cancelled = true;
      if(message) this._message = message;
      return true;
    }
  }
}
