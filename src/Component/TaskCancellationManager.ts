export class TaskCancellationManager {
  private _cancelled = false;
  private _message = "";
  constructor(){
    //
  }

  get Cancelled(){
    return this._cancelled;
  }

  get Message(){
    return this._message;
  }

  Cancel(message?:string){
    this._cancelled = true;
    if(message) this._message = message;
  }
}