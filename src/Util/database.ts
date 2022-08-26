import { http, https } from "follow-redirects";

const MIME_JSON = "application/json";
export abstract class DatabaseAPI {
  private constructor(){}

  static async SetIsSpeaking(data:{guildid:string, value:string}[]){
    if(this.CanOperate){
      const ids = data.map(d => d.guildid).join(",");
      const rawData = {} as {[key:string]:string};
      data.forEach(d => rawData[d.guildid] = d.value);
      try{
        const result = await this.HttpRequest("POST", process.env.GAS_URL, {
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
      catch{
        return false;
      }
    }else{
      return false;
    }
  }

  static async GetIsSpeaking(guildids:string[]){
    if(this.CanOperate){
      try{
        const result = await this.HttpRequest("GET", process.env.GAS_URL, {
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
      catch{
        return null;
      }
    }else{
      return null;
    }
  }

  static async SetQueueData(data:{guildid:string, queue:string}[]){
    if(this.CanOperate){
      const ids = data.map(d => d.guildid).join(",");
      const rawData = {} as {[guildid:string]:string};
      data.forEach(d => rawData[d.guildid] = encodeURIComponent(d.queue));
      try{
        const result = await this.HttpRequest("POST", process.env.GAS_URL, {
          token: process.env.GAS_TOKEN,
          guildid: ids,
          data: JSON.stringify(rawData),
          type: "queue"
        } as requestBody, MIME_JSON);
        return result.status === 200;
      }
      catch{
        return false;
      }
    }else{
      return false;
    }
  }

  static async GetQueueData(guildids:string[]){
    if(this.CanOperate){
      try{
        const result = await this.HttpRequest("GET", process.env.GAS_URL, {
          token: process.env.GAS_TOKEN,
          guildid: guildids.join(","),
          type: "queue"
        } as requestBody, MIME_JSON);
        if(result.status === 200){
          return result.data as {[guildid:string]:string};
        }else return null;
      }
      catch(e){
        return null;
      }
    }else{
      return null;
    }
  }

  static get CanOperate(){
    return Boolean(process.env.GAS_TOKEN && process.env.GAS_URL);
  }

  static async HttpRequest(method:"GET"|"POST", url:string, data?:requestBody, mimeType?:string){
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
      const req = httpLibs[durl.protocol].request(opt, (res) => {
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
      });
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
