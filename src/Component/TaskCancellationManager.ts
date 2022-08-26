/**
 * 長時間かかると予想されるタスクのキャンセル操作のサポートを補助するクラス
 */
export class TaskCancellationManager {
  private _cancelled = false;
  private _message = "";

  /**
   * キャンセルが要求されたかどうかを取得します
   */
  get Cancelled(){
    return this._cancelled;
  }

  /**
   * キャンセル時に渡されたメッセージを取得します
   */
  get Message(){
    return this._message;
  }

  /**
   * タスクのキャンセルを要求します
   * @param message キャンセルの原因を表すメッセージ等の文字列
   */
  cancel(message?:string){
    if(this._cancelled){
      return false;
    }else{
      this._cancelled = true;
      if(message) this._message = message;
      return true;
    }
  }
}
