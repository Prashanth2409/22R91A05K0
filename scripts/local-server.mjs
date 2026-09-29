// Explicit local QA adapter. Never imported by Netlify.
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {memoryStore} from '../server/storage.mjs';
import {createAPI} from '../server/api.mjs';
import {seed} from '../server/model.mjs';
await mkdir('.local',{recursive:true});let initial;try{initial=JSON.parse(await readFile('.local/state.json','utf8'));}catch{initial=seed();}
const db=memoryStore(initial),trans=db.transaction;db.transaction=async f=>{const out=await trans(f);await db.read(d=>writeFile('.local/state.json',JSON.stringify(d)));return out;};
const api=createAPI(db,{...process.env,FLIQ_DEMO_ACCESS:'true'});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.csv':'text/csv'};
createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:4173');if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/__fliq/')){const chunks=[];for await(const c of req)chunks.push(c);if(url.pathname==='/__fliq/razorpay/create-order')url.pathname='/api/checkout';if(url.pathname==='/__fliq/razorpay/verify-payment')url.pathname='/api/checkout/verify';const r=await api(new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}));res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));return;}let name=decodeURIComponent(url.pathname);if(name==='/')name='/index.html';else if(!path.extname(name))name+='.html';const file=path.resolve('public','.'+name);if(!file.startsWith(path.resolve('public')+path.sep))throw Error();const content=await readFile(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local QA adapter http://127.0.0.1:4173 (not production storage)'));
