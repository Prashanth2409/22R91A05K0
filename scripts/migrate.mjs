import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {seed} from '../server/model.mjs';
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL securely in the shell before migrating.');
const p=new pg.Pool({connectionString:process.env.DATABASE_URL});
try{await p.query(await readFile(new URL('../database/001.sql',import.meta.url),'utf8'));await p.query('INSERT INTO fliq_state(id,data) VALUES(1,$1) ON CONFLICT(id) DO NOTHING',[JSON.stringify(seed())]);await p.query(await readFile(new URL('../database/002.sql',import.meta.url),'utf8'));console.log('Migration completed. Existing business data preserved.');}finally{await p.end();}
