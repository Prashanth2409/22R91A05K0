const keys=[
  'SENTRY_DSN','SHIPPING_PROVIDER','DATABASE_URL','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET',
  'FLIQ_DEMO_ACCESS','SITE_URL','WABA_ACCESS_TOKEN','WABA_PHONE_NUMBER_ID',
  'WABA_TEMPLATE_NAME','WABA_STATUS_TEMPLATE_NAME','WABA_TEMPLATE_LANG',
  'WABA_GRAPH_VERSION','WABA_APP_SECRET','WABA_VERIFY_TOKEN'
];

let modulesPromise;
function modules(){
  return modulesPromise ||= Promise.all([
    import('../server/storage.mjs'),
    import('../server/api.mjs')
  ]).then(([storage,api])=>({configuredStore:storage.configuredStore,createAPI:api.createAPI}));
}

function cleanEnv(value){
  if(value===undefined||value===null)return value;
  let text=String(value).trim();
  if((text.startsWith('"')&&text.endsWith('"'))||(text.startsWith("'")&&text.endsWith("'")))text=text.slice(1,-1).trim();
  return text;
}
const environment=()=>Object.fromEntries(keys.map(key=>[key,cleanEnv(process.env[key])]));

async function requestBody(req){
  if(['GET','HEAD'].includes(req.method||'GET'))return null;
  if(req.body!==undefined&&req.body!==null){
    if(Buffer.isBuffer(req.body))return req.body;
    if(typeof req.body==='string')return Buffer.from(req.body);
    return Buffer.from(JSON.stringify(req.body));
  }
  const chunks=[];
  for await(const chunk of req)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function requestHeaders(req){
  const headers=new Headers();
  for(const [key,value] of Object.entries(req.headers||{})){
    if(value===undefined)continue;
    headers.set(key,Array.isArray(value)?value.join(', '):String(value));
  }
  headers.delete('content-length');
  if(!headers.has('x-nf-client-connection-ip')){
    const forwarded=String(headers.get('x-forwarded-for')||headers.get('x-real-ip')||headers.get('x-vercel-forwarded-for')||'').split(',')[0].trim();
    if(forwarded)headers.set('x-nf-client-connection-ip',forwarded);
  }
  return headers;
}

function requestUrl(req){
  const proto=String(req.headers?.['x-forwarded-proto']||'https').split(',')[0].trim()||'https';
  const host=String(req.headers?.host||'localhost');
  const url=new URL(req.url||'/',`${proto}://${host}`);
  const mapped=url.searchParams.get('__fliq_path');
  if(mapped){
    url.searchParams.delete('__fliq_path');
    url.pathname='/api/'+String(mapped).replace(/^\/+/, '');
  }
  return url;
}

function sendNodeResponse(res,response){
  res.statusCode=response.status;
  response.headers.forEach((value,key)=>res.setHeader(key,value));
  return response.arrayBuffer().then(buffer=>res.end(Buffer.from(buffer)));
}

module.exports=async function handler(req,res){
  try{
    const {configuredStore,createAPI}=await modules();
    const env=environment();
    const url=requestUrl(req);
    const body=await requestBody(req);
    const init={method:req.method||'GET',headers:requestHeaders(req),redirect:'manual'};
    if(body&&body.length)init.body=body;
    const request=new Request(url.toString(),init);
    const store=configuredStore(env);

    let response;
    if(url.pathname==='/api/health'){
      const snapshot=await store.read(d=>({revision:d.revision,products:Array.isArray(d.products)?d.products.length:0,orders:Array.isArray(d.orders)?d.orders.length:0}));
      response=new Response(JSON.stringify({
        ok:true,
        database:'connected',
        paymentConfigured:Boolean(env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')&&env.RAZORPAY_KEY_SECRET),
        region:process.env.VERCEL_REGION||null,
        ...snapshot
      }),{
        status:200,
        headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
      });
    }else if(url.pathname==='/api/payment-health'){
      if(!env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')||!env.RAZORPAY_KEY_SECRET){
        response=new Response(JSON.stringify({ok:false,error:'Razorpay TEST credentials are not configured.'}),{status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
      }else{
        let providerResponse;
        try{
          providerResponse=await fetch('https://api.razorpay.com/v1/payments?count=1',{
            method:'GET',
            signal:AbortSignal.timeout(10000),
            headers:{authorization:'Basic '+Buffer.from(env.RAZORPAY_KEY_ID+':'+env.RAZORPAY_KEY_SECRET).toString('base64')}
          });
          let providerData={};
          try{providerData=await providerResponse.json();}catch{}
          if(providerResponse.ok){
            response=new Response(JSON.stringify({ok:true,mode:'test',provider:'razorpay'}),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
          }else{
            response=new Response(JSON.stringify({ok:false,provider:'razorpay',status:providerResponse.status,code:providerData?.error?.code||'',description:providerData?.error?.description||'Razorpay rejected the configured TEST credentials.'}),{status:502,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
          }
        }catch(error){
          response=new Response(JSON.stringify({ok:false,provider:'razorpay',error:'connection_failed',description:String(error?.message||error)}),{status:502,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
        }
      }
    }else{
      response=await createAPI(store,env)(request);
    }
    await sendNodeResponse(res,response);
  }catch(error){
    try{const {reportError}=await import('../server/telemetry.mjs');await reportError(environment(),'api',503);}catch{}
    console.error('FLIQ API bootstrap failed');
    res.statusCode=503;
    res.setHeader('content-type','application/json; charset=utf-8');
    res.setHeader('cache-control','no-store');
    res.end(JSON.stringify({error:'FLIQ cloud API is unavailable.'}));
  }
};
