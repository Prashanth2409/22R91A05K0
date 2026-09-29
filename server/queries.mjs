import {state} from './model.mjs';
export function buildListQuery(kind,sp,admin=true,visibleCategories=[]){
 const values=[],where=[],add=(sql,value)=>{values.push(value);where.push(sql.replace(/\?(?!\|)/,`$${values.length}`));};
 const terms=(sp.get('q')||'').match(/[\p{L}\p{N}]+/gu);if(terms?.length)add("search @@ to_tsquery('simple',?)",terms.map(t=>t+':*').join(' & '));
 if(kind==='products'){
  if(!admin){where.push("data->>'status'='published' AND data->>'authorizedToSell'='true'");add("(data->'collections') ?| ?::text[]",visibleCategories);}
  if(sp.get('collection'))add("(data->'collections') @> ?::jsonb",JSON.stringify([sp.get('collection')]));
  const status=sp.get('status');if(status){if(status==='active'||status==='out_of_stock'){where.push("data->>'status'='published'");where.push(`${status==='out_of_stock'?'NOT ':''}EXISTS(SELECT 1 FROM jsonb_array_elements(data->'variants') v WHERE (v->>'quantity')::int>0)`);}else add("data->>'status'=?",status);}
  if(sp.get('stock'))where.push(`EXISTS(SELECT 1 FROM jsonb_array_elements(data->'variants') v WHERE (v->>'quantity')::int ${sp.get('stock')==='out'?'=0':'BETWEEN 1 AND 5'})`);
 }else{
  for(const [param,key] of [['status','status'],['payment','payment_status']])if(sp.get(param))add(`data->>'${key}'=?`,sp.get(param));
  if(sp.get('from'))add("data->>'created_at'>=?",sp.get('from'));
  if(sp.get('to'))add("substring(data->>'created_at',1,10)<=?",sp.get('to'));
 }
 const page=Math.max(1,Math.min(100000,Math.floor(Number(sp.get('page'))||1))),limit=Math.max(1,Math.min(100,Math.floor(Number(sp.get('limit'))||24)));
 let order=kind==='products'?"data->>'updated_at' DESC,id":sp.get('sort')==='oldest'?"data->>'created_at' ASC,id":sp.get('sort')==='highest'?"(data->>'amount')::bigint DESC,id":sp.get('sort')==='lowest'?"(data->>'amount')::bigint ASC,id":"data->>'created_at' DESC,id";
 const countValues=[...values];
 if(kind==='products'&&sp.get('collection')){values.push(sp.get('collection'));order=`COALESCE((data->'collectionPositions'->>$${values.length})::int,1000000000),`+order;}
 const table=kind==='products'?'fliq_products':'fliq_orders',predicate=where.length?' WHERE '+where.join(' AND '):'';
 return {count:`SELECT count(*)::int AS total FROM ${table}${predicate}`,sql:`SELECT data FROM ${table}${predicate} ORDER BY ${order} LIMIT $${values.length+1} OFFSET $${values.length+2}`,values,countValues,page,limit};
}
export async function readList(pool,kind,sp,admin=true,categories=[]){const q=buildListQuery(kind,sp,admin,categories);const count=await pool.query(q.count,q.countValues),r=await pool.query(q.sql,[...q.values,q.limit,(q.page-1)*q.limit]);return {items:r.rows.map(r=>kind==='products'?{...r.data,state:state(r.data)}:r.data),total:count.rows[0].total,page:q.page,limit:q.limit,pages:Math.ceil(count.rows[0].total/q.limit)};}
export async function projectChanges(client,before,after){for(const [key,table] of [['products','fliq_products'],['orders','fliq_orders']]){const old=new Map(before[key].map(x=>[x.id,JSON.stringify(x)]));for(const row of after[key])if(old.get(row.id)!==JSON.stringify(row))await client.query(`INSERT INTO ${table}(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data`,[row.id,JSON.stringify(row)]);}}
