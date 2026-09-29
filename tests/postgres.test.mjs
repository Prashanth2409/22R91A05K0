import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {seed,product} from '../server/model.mjs';
import {postgresStore} from '../server/storage.mjs';
test('real PostgreSQL SQL: migration, indexed paging, transaction rollback and image persistence',async()=>{
 const db=new PGlite();await db.exec(await readFile(new URL('../database/001.sql',import.meta.url),'utf8'));
 await db.query('INSERT INTO fliq_state(id,data) VALUES(1,$1)',[JSON.stringify(seed())]);
 await db.exec(await readFile(new URL('../database/002.sql',import.meta.url),'utf8'));
 const pool={query:(...args)=>db.query(...args),async connect(){return {query:(...args)=>db.query(...args),release(){}};},end:()=>db.close()};
 const store=postgresStore('',pool);
 try{
  const list=await store.list('products',new URLSearchParams('limit=5&page=2'),false,['tees','shirts','hoodies','jackets','pants','joggers','jeans','accessories']);assert.equal(list.items.length,5);assert.equal(list.total,56);
  const search=await store.list('products',new URLSearchParams('q=Boxy'),true);assert.ok(search.total>0);
  const col=await store.list('products',new URLSearchParams('collection=tees'),false,['tees']);assert.equal(col.total,7);
  const first=col.items[1].id;await store.transaction(d=>{d.products.find(p=>p.id===first).collectionPositions={tees:0};});assert.equal((await store.list('products',new URLSearchParams('collection=tees'),true)).items[0].id,first);
  const id=list.items[0].id;await assert.rejects(store.transaction(d=>{d.products.find(p=>p.id===id).price=1;throw Error('rollback');}));assert.notEqual((await store.selectedProducts([id]))[0].price,1);
  await store.transaction(d=>{d.products.find(p=>p.id===id).price=123;});assert.equal((await store.selectedProducts([id]))[0].price,123);
  assert.ok((await store.readParts(['settings'],d=>d)).settings.store.name);assert.equal((await store.readParts(['settings'],d=>d)).products,undefined);
  const img='c573d3cb-4a3c-4050-9542-7c3a390a760c';await store.putImage(img,'image/png',Buffer.from([1,2,3]));assert.equal((await store.image(img)).bytes.length,3);
  const indexes=await db.query("SELECT indexname FROM pg_indexes WHERE tablename IN ('fliq_orders','fliq_products')");assert.ok(indexes.rows.some(r=>r.indexname==='fliq_orders_payment_unique'));
 }finally{await store.close();}
});
