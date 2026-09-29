import pg from 'pg';
import {seed,fail} from './model.mjs';
import {readList,projectChanges} from './queries.mjs';
// All business mutations run inside this boundary. Provider adapters never store
// orders in browser storage; payments, variants and audit commit together.
export function memoryStore(initial=seed()){
 let data=structuredClone(initial),queue=Promise.resolve();
 return {kind:'isolated-test',async transaction(fn){const work=queue.then(async()=>{const draft=structuredClone(data);const result=await fn(draft);data=draft;return result;});queue=work.catch(()=>{});return work;},async read(fn){await queue;return fn(structuredClone(data));}};
}
export function postgresStore(connectionString,injectedPool){
 const pool=injectedPool||new pg.Pool({connectionString,max:3,connectionTimeoutMillis:8000,statement_timeout:15000});
 return {kind:'postgres',
 async transaction(fn){const c=await pool.connect();try{await c.query('BEGIN');const r=await c.query('SELECT data FROM fliq_state WHERE id=1 FOR UPDATE');if(!r.rows.length)fail('Run npm run db:migrate before using the store.',503);const d=r.rows[0].data,before=structuredClone(d);const out=await fn(d);await projectChanges(c,before,d);await c.query('UPDATE fliq_state SET data=$1,updated_at=now() WHERE id=1',[JSON.stringify(d)]);await c.query('COMMIT');return out;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}},
 async read(fn){const r=await pool.query('SELECT data FROM fliq_state WHERE id=1');if(!r.rows.length)fail('Database is not initialized.',503);return fn(r.rows[0].data);},
 async readParts(keys,fn){const r=await pool.query('SELECT key,value FROM fliq_state,jsonb_each(data) WHERE id=1 AND key=ANY($1::text[])',[keys]);return fn(Object.fromEntries(r.rows.map(x=>[x.key,x.value])));},
 list:(kind,sp,admin,categories)=>readList(pool,kind,sp,admin,categories),
 async selectedProducts(ids){return (await pool.query('SELECT data FROM fliq_products WHERE id=ANY($1::text[])',[ids.slice(0,101)])).rows.map(x=>x.data);},
 async putImage(id,type,bytes){await pool.query('INSERT INTO fliq_images(id,mime,bytes) VALUES($1,$2,$3)',[id,type,bytes]);},
 async image(id){return (await pool.query('SELECT mime,bytes FROM fliq_images WHERE id=$1',[id])).rows[0];},close:()=>pool.end()};
}
let deployedStore;
export function configuredStore(env){if(!env.DATABASE_URL)fail('Shared database is not configured. Set DATABASE_URL and run the migration. Browser-only orders are disabled.',503);return deployedStore??=postgresStore(env.DATABASE_URL);}
