import {randomUUID} from 'node:crypto';
const areas=new Set(['frontend','api','payment','admin','shipping']);
let windowStart=0,sent=0,blockedUntil=0;
// An allowlist replaces raw exceptions, URLs, headers and payloads entirely.
export function safeEvent(area,status){return {event_id:randomUUID().replaceAll('-',''),timestamp:Date.now()/1000,platform:'javascript',level:'error',message:'FLIQ operation failed',tags:{area:areas.has(area)?area:'api',status:String(Number(status)||500)}};}
export async function reportError(env,area,status,fetcher=fetch){
 if(!env.SENTRY_DSN)return false;
 const time=Date.now();if(time<blockedUntil)return false;if(time-windowStart>60000){windowStart=time;sent=0;}if(sent++>=30)return false;
 try{const dsn=new URL(env.SENTRY_DSN);if(dsn.protocol!=='https:'||!dsn.username||!/^\/\d+$/.test(dsn.pathname))return false;const event=safeEvent(area,status);const endpoint=`${dsn.origin}/api${dsn.pathname}/envelope/?sentry_key=${encodeURIComponent(dsn.username)}&sentry_version=7`;const body=JSON.stringify({event_id:event.event_id,dsn:env.SENTRY_DSN})+'\n'+JSON.stringify({type:'event'})+'\n'+JSON.stringify(event);const r=await fetcher(endpoint,{method:'POST',headers:{'content-type':'application/x-sentry-envelope'},body,signal:AbortSignal.timeout(1000)});if(r.status===429)blockedUntil=Date.now()+Math.min(3600,Math.max(60,Number(r.headers?.get('retry-after'))||60))*1000;return r.ok;}catch{return false;}
}
