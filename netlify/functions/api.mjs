import {configuredStore} from '../../server/storage.mjs';
import {createAPI} from '../../server/api.mjs';
export function environment(){return Object.fromEntries(['DATABASE_URL','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET','FLIQ_DEMO_ACCESS','SITE_URL','WABA_ACCESS_TOKEN','WABA_PHONE_NUMBER_ID','WABA_TEMPLATE_NAME','WABA_STATUS_TEMPLATE_NAME','WABA_TEMPLATE_LANG','WABA_GRAPH_VERSION','WABA_APP_SECRET','WABA_VERIFY_TOKEN'].map(key=>[key,Netlify.env.get(key)]));}
export default async request=>{try{const env=environment();return await createAPI(configuredStore(env),env)(request);}catch{return new Response(JSON.stringify({error:'Configure DATABASE_URL and run the database migration before using shared checkout/Admin.'}),{status:503,headers:{'content-type':'application/json','cache-control':'no-store'}});}};
export const config={path:'/api/*'};
