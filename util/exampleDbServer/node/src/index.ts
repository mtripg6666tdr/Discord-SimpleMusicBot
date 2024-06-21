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

import "./dotenv";
import * as http from "http";

import { getQueue, getStatus, setQueue, setStatus } from "./fs";
import { parseQuery } from "./util";

http.createServer((req, res) => {
  console.log(req.url);
  if(req.method === "GET" && req.url.startsWith("/?")){
    const { type, token, guildid } = parseQuery(req.url.substring(2));
    if(type && token === process.env.TOKEN && guildid){
      if(type === "j"){
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: 200,
          data: getStatus(guildid.split(",")),
        }));
      }else if(type === "queue"){
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: 200,
          data: getQueue(guildid.split(",")),
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
        const body = JSON.parse(Buffer.concat(bufs).toString("utf-8")) as { token: string, type: "j"|"queue", guildid: string, data: string };
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
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
    });
  }else{
    res.writeHead(403);
    res.end();
  }
}).listen(8082);
