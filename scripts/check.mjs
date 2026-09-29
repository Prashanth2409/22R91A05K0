import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
async function files(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(path.join(dir,x.name)):[path.join(dir,x.name)]))).flat();}
const list=(await Promise.all(['public','server','netlify','scripts','tests'].map(files))).flat();
for(const file of list){if(/\.(m?js)$/.test(file)){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status)throw Error(file+'\n'+r.stderr);}if(file.startsWith('public')&&/\.(js|html)$/.test(file)){const text=await readFile(file,'utf8');if(/RAZORPAY_KEY_SECRET|local-demo-api\.js|completeRazorpayOrder/.test(text))throw Error('Private/backend-only code in public bundle: '+file);}}
console.log(`Static syntax and public-boundary checks passed (${list.length} files).`);
