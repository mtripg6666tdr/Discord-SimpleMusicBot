import "./dotenv";
import * as fs from "fs";
import * as http from "http";

http.createServer((req, res) => {
  if(req.url.startsWith("/?")){
    const method = req.method.toUpperCase();
  }else{
    res.writeHead(403);
    res.end();
  }
}).listen(8082);