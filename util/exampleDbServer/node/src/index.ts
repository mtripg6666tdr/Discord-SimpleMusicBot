import "./dotenv";
import * as http from "http";
import { parseQuery } from "./util";
import { getQueue, getStatus, setQueue, setStatus } from "./fs";

http.createServer((req, res) => {
  console.log(req.url);
  if(req.method === "GET" && req.url.startsWith("/?")){
    const { type, token, guildid } = parseQuery(req.url.substring(2));
    if(type && token === process.env.TOKEN && guildid){
      if(type === "j"){
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
          status: 200,
          data: getStatus(guildid.split(","))
        }));
      }else if(type === "queue"){
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
          status: 200,
          data: getQueue(guildid.split(","))
        }));
      }else{
        res.writeHead(400);
        res.end();
      }
    }else{
      res.writeHead(400);
      res.end();
    }
  }else if(req.method === "POST" && req.url === "/"){
    const bufs = [] as Buffer[];
    req.on("data", chunk => bufs.push(chunk));
    req.on("end", () => {
      try{
        const body = JSON.parse(Buffer.concat(bufs).toString("utf-8")) as {token:string, type:"j"|"queue", guildid:string, data:string};
        if(body.token !== process.env.TOKEN) throw "";
        if(body.type === "j"){
          setStatus(JSON.parse(body.data));
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 200,
          }));
        }else if(body.type === "queue"){
          setQueue(JSON.parse(body.data));
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 200,
          }));
        }else{
          res.writeHead(400);
          res.end(JSON.stringify({
            status: 400,
          }));
        }
      }
      catch(e){
        res.writeHead(400);
        res.end(JSON.stringify({
          status: 400,
        }));
      }
    })
  }else{
    res.writeHead(403);
    res.end();
  }
}).listen(8082);