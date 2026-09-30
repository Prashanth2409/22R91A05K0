// Dedicated isolated browser regression server. Never imported by deployment code.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {seed} from '../server/model.mjs';
import {memoryStore} from '../server/storage.mjs';
import {createAPI} from '../server/api.mjs';
import {paymentFixture,fixtureSDK} from '../tests/fixtures/payment-provider.mjs';
import {promotion} from '../server/promotions.mjs';
const env={FLIQ_DEMO_ACCESS:'true',RAZORPAY_KEY_ID:'rzp_test_fixture',RAZORPAY_KEY_SECRET:'fixture'},provider=paymentFixture(env.RAZORPAY_KEY_SECRET),initial=seed();
initial.settings.home={latestDropIds:initial.products.slice(0,6).map(x=>x.id),heroVideoUrl:''};initial.promotions=[promotion({code:'QA10',type:'percent',value:10,scope:'order',active:true},initial)];const store=memoryStore(initial),api=createAPI(store,env,provider);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png'};
createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:4174'),chunks=[];for await(const c of req)chunks.push(c);const raw=Buffer.concat(chunks);if(url.pathname==='/__qa/sdk.js'){res.setHeader('content-type','text/javascript');return res.end(fixtureSDK);}if(url.pathname==='/__qa/capture'){res.setHeader('content-type','application/json');return res.end(JSON.stringify(provider.capture(JSON.parse(raw).orderId)));}if(url.pathname==='/__qa/state'){res.setHeader('content-type','application/json');return res.end(JSON.stringify(await store.read(d=>({orders:d.orders.map(o=>({id:o.id,amount:o.amount,discount:o.discount,status:o.status})),stock:d.products[0].variants[0].quantity}))));}
 if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/__fliq/')){if(url.pathname==='/__fliq/razorpay/create-order')url.pathname='/api/checkout';if(url.pathname==='/__fliq/razorpay/verify-payment')url.pathname='/api/checkout/verify';const r=await api(new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:raw}));res.writeHead(r.status,Object.fromEntries(r.headers));return res.end(Buffer.from(await r.arrayBuffer()));}
 let name=decodeURIComponent(url.pathname);if(name==='/')name='/index.html';else if(!path.extname(name))name+='.html';const file=path.resolve('public','.'+name);if(!file.startsWith(path.resolve('public')+path.sep))throw Error();let data=await readFile(file);if(file.endsWith('.html'))data=Buffer.from(data.toString().replace('</head>','<script src="/__qa/sdk.js"></script></head>'));res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(500);res.end('QA request failed');}}).listen(4174,'127.0.0.1',()=>console.log('Isolated QA http://127.0.0.1:4174'));
