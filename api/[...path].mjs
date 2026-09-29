import {configuredStore} from '../server/storage.mjs';
import {createAPI} from '../server/api.mjs';

const keys=[
 'DATABASE_URL','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET',
 'FLIQ_DEMO_ACCESS','SITE_URL','WABA_ACCESS_TOKEN','WABA_PHONE_NUMBER_ID',
 'WABA_TEMPLATE_NAME','WABA_STATUS_TEMPLATE_NAME','WABA_TEMPLATE_LANG',
 'WABA_GRAPH_VERSION','WABA_APP_SECRET','WABA_VERIFY_TOKEN'
];

const environment=()=>Object.fromEntries(keys.map(key=>[key,process.env[key]]));

async function handle(request){
 try{
  const env=environment();
  return await createAPI(configuredStore(env),env)(request);
 }catch(error){
  console.error('FLIQ Vercel API bootstrap error',error?.message||error);
  return new Response(JSON.stringify({error:'Configure DATABASE_URL and production environment variables before using shared checkout/Admin.'}),{
   status:503,
   headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
  });
 }
}

export const runtime='nodejs';
export const maxDuration=15;
export default {fetch:handle};
