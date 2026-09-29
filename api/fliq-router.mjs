import {configuredStore} from '../server/storage.mjs';
import {createAPI} from '../server/api.mjs';

const keys=[
  'DATABASE_URL','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET',
  'FLIQ_DEMO_ACCESS','SITE_URL','WABA_ACCESS_TOKEN','WABA_PHONE_NUMBER_ID',
  'WABA_TEMPLATE_NAME','WABA_STATUS_TEMPLATE_NAME','WABA_TEMPLATE_LANG',
  'WABA_GRAPH_VERSION','WABA_APP_SECRET','WABA_VERIFY_TOKEN'
];

const environment=()=>Object.fromEntries(keys.map(key=>[key,process.env[key]]));
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

async function normalizeRequest(request){
  const url=new URL(request.url);
  const mapped=url.searchParams.get('__fliq_path');
  if(mapped){
    url.searchParams.delete('__fliq_path');
    url.pathname='/api/'+String(mapped).replace(/^\/+/, '');
  }
  const headers=new Headers(request.headers);
  if(!headers.has('x-nf-client-connection-ip')){
    const forwarded=headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || headers.get('x-vercel-forwarded-for');
    if(forwarded)headers.set('x-nf-client-connection-ip',String(forwarded).split(',')[0].trim());
  }
  const init={method:request.method,headers,redirect:'manual'};
  if(!['GET','HEAD'].includes(request.method))init.body=await request.arrayBuffer();
  return new Request(url.toString(),init);
}

async function handle(request){
  try{
    const env=environment();
    const normalized=await normalizeRequest(request);
    const pathname=new URL(normalized.url).pathname;
    const store=configuredStore(env);

    if(pathname==='/api/health'){
      const snapshot=await store.read(d=>({revision:d.revision,products:Array.isArray(d.products)?d.products.length:0,orders:Array.isArray(d.orders)?d.orders.length:0}));
      return json({ok:true,database:'connected',region:process.env.VERCEL_REGION||null,...snapshot});
    }

    return await createAPI(store,env)(normalized);
  }catch(error){
    console.error('FLIQ Vercel API bootstrap error',error?.stack||error?.message||error);
    return json({error:'FLIQ cloud API is unavailable.',detail:process.env.NODE_ENV==='production'?undefined:String(error?.message||error)},503);
  }
}

export const maxDuration=15;
export default {fetch:handle};
