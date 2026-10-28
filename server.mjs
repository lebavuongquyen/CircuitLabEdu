import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const root = new URL(".", import.meta.url).pathname;
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8"};
createServer(async(req,res)=>{try{const path=decodeURIComponent((req.url||"/").split("?")[0]);const safe=normalize(path).replace(/^([.][.][/\\])+/, "").replace(/^[/\\]+/,"");const file=join(root,safe||"index.html");const data=await readFile(file);res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream","Cache-Control":"no-store"});res.end(data);}catch{res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Not found");}}).listen(Number(process.env.PORT)||4173,"0.0.0.0",()=>console.log("CircuitLab Edu running on http://localhost:"+(Number(process.env.PORT)||4173)));
