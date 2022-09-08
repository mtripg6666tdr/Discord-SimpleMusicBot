/*
 * Copyright 2021-2022 mtripg6666tdr
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

import type { DataType } from "../botBase";

import { http, https } from "follow-redirects";

import { LogEmitter } from "../Structure";
import Util from "../Util";

const MIME_JSON = "application/json";

export class BackUpper extends LogEmitter {
  private _queueModifiedGuilds:string[] = [];
  private _previousStatuses:{[guildId:string]:string} = {};
  private get data(){
    return this.getData();
  }

  /**
   * 変更済みとしてマークされたキューを持つサーバーの一覧を返します
   */
  get queueModifiedGuilds():Readonly<string[]>{
    return this._queueModifiedGuilds;
  }

  /**
   * バックアップが実行可能な設定がされているかを示します。
   */
  get backuppable(){
    return !!(process.env.GAS_TOKEN && process.env.GAS_URL);
  }

  constructor(private readonly getData:(()=>DataType)){
    super();
    this.setTag("Backup");
  }

  /**
   * 今変更済みキューがあるとしてマークされているサーバーをリセットして、すべてマークを解除します。
   */
  resetModifiedGuilds(){
    this._queueModifiedGuilds = [];
  }

  /**
   * 指定したサーバーIDのキューを、変更済みとしてマークします  
   * マークされたサーバーのキューは、次回のティックにバックアップが試行されます
   */
  addModifiedGuilds(guildId:string){
    if(!this._queueModifiedGuilds.includes(guildId)) this._queueModifiedGuilds.push(guildId);
  }
  
  /**
   * 接続ステータスやキューを含む全データをサーバーにバックアップします
   */
  backupData():Promise<any>|void{
    if(this.backuppable){
      return this.backupQueue().then(() => this.backupStatus());
    }
  }

  /**
   * キューをサーバーにバックアップします
   */
  async backupQueue(){
    try{
      const queue = this._queueModifiedGuilds.map(id => ({
        guildid: id,
        queue: JSON.stringify(this.data[id].exportQueue())
      }));
      if(queue.length > 0){
        this.Log("Backing up modified queue...");
        if(await this.backupQueueData(queue)){
          this._queueModifiedGuilds = [];
        }else{
          this.Log("Something went wrong while backing up queue", "warn");
        }
      }else{
        this.Log("No modified queue found, skipping");
      }
    }
    catch(e){
      this.Log(e, "error");
    }
  }

  /**
   * 接続ステータス等をサーバーにバックアップします
   */
  async backupStatus(){
    try{
      // 参加ステータスの送信
      const speaking = [] as {guildid:string, value:string}[];
      const currentStatuses = {} as {[guildId:string]:string};
      Object.keys(this.data).forEach(id => {
        const currentStatus = this.data[id].exportStatus();
        if(!this._previousStatuses[id] || this._previousStatuses[id] !== currentStatus){
          speaking.push({
            guildid: id,
            value: currentStatus,
          });
          currentStatuses[id] = currentStatus;
        }
      });
      if(speaking.length > 0){
        this.Log("Backing up modified status..");
        if(await this.backupStatusData(speaking)){
          this._previousStatuses = currentStatuses;
        }else{
          this.Log("Something went wrong while backing up statuses", "warn");
        }
      }else{
        this.Log("No modified status found, skipping");
      }
    }
    catch(e){
      this.Log(e, "warn");
    }
  }

  /**
   * ステータスデータをサーバーから取得する
   */
  async getStatusFromServer(guildids:string[]){
    if(this.backuppable){
      const t = Util.time.timer.start("GetIsSpeking");
      try{
        const result = await this.requestHttp("GET", process.env.GAS_URL, {
          token: process.env.GAS_TOKEN,
          guildid: guildids.join(","),
          type: "j"
        } as requestBody, MIME_JSON);
        if(result.status === 200){
          return result.data as {[guildid:string]:string};
        }else{
          return null;
        }
      }
      catch(er){
        this.Log(er, "error");
        this.Log("Status restoring failed!", "warn");
        return null;
      }
      finally{
        t.end();
      }
    }else{
      return null;
    }
  }

  /**
   * キューのデータをサーバーから取得する
   */
  async getQueueDataFromServer(guildids:string[]){
    if(this.backuppable){
      const t = Util.time.timer.start("GetQueueData");
      try{
        const result = await this.requestHttp("GET", process.env.GAS_URL, {
          token: process.env.GAS_TOKEN,
          guildid: guildids.join(","),
          type: "queue"
        } as requestBody, MIME_JSON);
        if(result.status === 200){
          return result.data as {[guildid:string]:string};
        }else return null;
      }
      catch(er){
        this.Log(er, "error");
        this.Log("Queue restoring failed!", "warn");
        return null;
      }
      finally{
        t.end();
      }
    }else{
      return null;
    }
  }

  /**
   * ステータス情報をサーバーへバックアップする
   */
  private async backupStatusData(data:{guildid:string, value:string}[]){
    if(this.backuppable){
      const t = Util.time.timer.start("backupStatusData");
      const ids = data.map(d => d.guildid).join(",");
      const rawData = {} as {[key:string]:string};
      data.forEach(d => rawData[d.guildid] = d.value);
      try{
        const result = await this.requestHttp("POST", process.env.GAS_URL, {
          token: process.env.GAS_TOKEN,
          guildid: ids,
          data: JSON.stringify(rawData),
          type: "j"
        } as requestBody, MIME_JSON);
        if(result.status === 200){
          return true;
        }else{
          return false;
        }
      }
      catch(er){
        this.Log(er, "error");
        this.Log("Status backup failed!", "warn");
        return false;
      }
      finally{
        t.end();
      }
    }else{
      return false;
    }
  }

  /**
   * キューのデータをサーバーへバックアップする
   */
  private async backupQueueData(data:{guildid:string, queue:string}[]){
    if(this.backuppable){
      const t = Util.time.timer.start("SetQueueData");
      const ids = data.map(d => d.guildid).join(",");
      const rawData = {} as {[guildid:string]:string};
      data.forEach(d => rawData[d.guildid] = encodeURIComponent(d.queue));
      try{
        const result = await this.requestHttp("POST", process.env.GAS_URL, {
          token: process.env.GAS_TOKEN,
          guildid: ids,
          data: JSON.stringify(rawData),
          type: "queue"
        } as requestBody, MIME_JSON);
        return result.status === 200;
      }
      catch(er){
        this.Log(er, "error");
        this.Log("Queue backup failed!", "warn");
        return false;
      }
      finally{
        t.end();
      }
    }else{
      return false;
    }
  }

  /**
   * HTTPでデータをバックアップするユーティリティメソッド
   */
  private async requestHttp(method:"GET"|"POST", url:string, data?:requestBody, mimeType?:string){
    return new Promise<postResult>((resolve, reject) => {
      if(method === "GET"){
        url += "?" + (Object.keys(data) as (keyof requestBody)[]).map(k => encodeURIComponent(k) + "=" + encodeURIComponent(data[k])).join("&");
      }
      const durl = new URL(url);
      const opt = {
        protocol: durl.protocol,
        hostname: durl.hostname,
        port: durl.port,
        path: durl.pathname + durl.search,
        method: method,
      } as {[key:string]:any};
      if(mimeType){
        opt.headers = {
          "Content-Type": mimeType
        };
      }
      const httpLibs = {
        "http:": http,
        "https:": https,
      } as {[proto:string]:(typeof http|typeof https)};
      const req = httpLibs[durl.protocol]
        .request(opt, (res) => {
          const bufs = [] as Buffer[];
          res.on("data", chunk => bufs.push(chunk));
          res.on("end", ()=> {
            try{
              const parsed = JSON.parse(Buffer.concat(bufs).toString("utf-8")) as postResult;
              if(parsed.data) Object.keys(parsed.data).forEach(k => parsed.data[k] = decodeURIComponent(parsed.data[k]));
              resolve(parsed);
            }
            catch(e){
              reject(e);
            }
          });
          res.on("error", ()=>reject());
        })
        .on("error", reject)
      ;
      if(method === "POST"){
        req.end(JSON.stringify(data));
      }else{
        req.end();
      }
    });
  }
}

type getResult = {
  status: 200|404,
};
type postResult = getResult & {
  data:any,
};
type requestBody = {
  token:string,
  guildid:string,
  data?:any,
  type:"queue"|"j",
};
