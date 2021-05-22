export class QueueManager {
  default:string[] = [];
  LoopEnabled:boolean = false;
  QueueLoopEnabled:boolean = false;
  get length():number {
    return this.default.length;
  }

  constructor(){

  }

  AddQueue(url:string){
    this.default.push(url);
  }

  AddQueueFirst(url:string){
    this.default = [url].concat(this.default);
  }

  Next(){
    if(this.QueueLoopEnabled){
      this.default.push(this.default[0]);
    }
    this.default = this.default.slice(1, this.default.length);
  }

  RemoveAt(offset:number){
    this.default = this.default.slice(0,offset).concat(this.default.slice(offset + 1, this.default.length));
  }
}