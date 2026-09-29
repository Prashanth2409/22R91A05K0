import {environment} from './api.mjs';
import {configuredStore} from '../../server/storage.mjs';
import {deliver} from '../../server/messaging.mjs';
export default async()=>{const env=environment();if(!env.DATABASE_URL)return Response.json({pending:'database configuration'});const store=configuredStore(env);const keys=await store.read(d=>d.whatsappLogs.filter(x=>x.status==='pending').slice(0,5).map(x=>x.id));for(const key of keys)await deliver(store,env,key);return Response.json({processed:keys.length});};
export const config={schedule:'*/5 * * * *'};
