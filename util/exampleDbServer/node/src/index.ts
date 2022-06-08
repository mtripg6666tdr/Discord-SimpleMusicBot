import * as fs from "fs";
import * as http from "http";

http.createServer((req, res) => {
  if(req.url.startsWith("/?")){
    const queries = Object.assign({}, ...(req.url.substring(2).split("&").map(q => q.split("=")).map(qs => ({[decodeURIComponent(qs[0])]:decodeURIComponent(qs[1])}))));
  }else{
    res.writeHead(403);
    res.end();
  }
}).listen(8082);