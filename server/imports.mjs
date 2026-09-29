import {fail,product,id,audit,imageURL} from './model.mjs';
// Bounded CSV state machine: quoted newlines/escaped quotes, no executable formulas.
export function csvRows(csv){
 if(typeof csv!=='string'||Buffer.byteLength(csv)>2000000)fail('CSV must be under 2 MB.');
 const text=csv.replace(/^\uFEFF/,''),rows=[];let row=[],field='',quoted=false,closed=false;
 const cell=()=>{row.push(field.trim());field='';closed=false;};
 const record=()=>{cell();if(row.some(x=>x!==''))rows.push(row);row=[];if(rows.length>501)fail('Import 1–500 rows per batch.');};
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
  if(c===','){cell();continue;}if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;record();continue;}
  if(c==='"'){if(field.trim()||closed)fail('CSV has a misplaced quote.');field='';quoted=true;continue;}
  if(closed){if(!/\s/.test(c))fail('Unexpected text after CSV quote.');}else field+=c;
 }
 if(quoted)fail('CSV has an unclosed quoted field.');if(field||row.length||closed)record();
 const headers=rows.shift()||[];if(!headers.length||headers.some(h=>!h||['__proto__','constructor','prototype'].includes(h))||new Set(headers).size!==headers.length)fail('CSV headers must be unique, nonempty field names.');
 return rows.map(values=>{if(values.length!==headers.length)fail('CSV column count does not match its header.');return Object.fromEntries(headers.map((h,i)=>[h,values[i]]));});
}
export function importRows(d,rows,commit,actor){
 if(!Array.isArray(rows)||!rows.length||rows.length>500)fail('Import 1–500 rows per batch.');const errors=[],normalized=[],seen=new Set();let creates=0,updates=0;
 rows.forEach((raw,i)=>{const canonical=k=>{k=k.trim().replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' ');return ({name:'product name',productname:'product name',colour:'colors',color:'colors',colours:'colors',totalstock:'total stock',collection:'category'})[k]||k.replace(/^image\s*url\s*(\d)$/,'image url $1');};const r=Object.fromEntries(Object.entries(raw).map(([k,v])=>[canonical(k),v])),row=i+2;try{
  if(r['size quantities']){let stock;try{stock=JSON.parse(r['size quantities']);}catch{fail('sizeQuantities must contain valid JSON.');}for(const [size,quantity] of Object.entries(stock))r['size '+size]=quantity;delete r['size quantities'];}
  if(r.images&&!r['image url 1'])String(r.images).split('|').slice(0,4).forEach((url,i)=>r['image url '+(i+1)]=url.trim());
  const name=String(r['product name']||'').trim(),category=String(r.category||'').trim(),price=Number(r.price),colors=String(r.colors||'Default').split(',').map(c=>c.trim()).filter(Boolean);if(!name||!category||!Number.isFinite(price)||price<=0)fail('Product Name, Category and a positive Price are required.');
  const sku=String(r.sku||'').trim(),key=(sku||name+'|'+category).toLowerCase();if(seen.has(key))fail('Duplicate product in this import.');seen.add(key);
  const stock={};for(const [k,v] of Object.entries(r))if(k.startsWith('size ')){const size=k.slice(5).toUpperCase(),q=String(v).trim()===''?0:Number(v);if(!Number.isSafeInteger(q)||q<0)fail(`Size ${size} stock must be a nonnegative whole number.`);stock[size]=q;}
  if(!Object.keys(stock).length)fail('At least one Size column is required.');const total=Object.values(stock).reduce((a,b)=>a+b,0);if(String(r['total stock']??'').trim()!==''&&Number(r['total stock'])!==total)fail(`Total Stock must equal calculated size stock (${total}).`);
  const images=[1,2,3,4].map(n=>String(r['image url '+n]||'').trim()).filter(Boolean);if(images.some(s=>!imageURL(s)))fail('Image URL must use HTTPS.');
  const existing=sku?d.products.find(p=>p.sku.toLowerCase()===sku.toLowerCase()):d.products.find(p=>p.name.toLowerCase()===name.toLowerCase()&&d.categories.some(c=>c.id===p.category&&c.name.toLowerCase()===category.toLowerCase()));
  // Sheet quantities are size totals, never multiplied by number of colors.
  // Assign to first color; other colors start at zero until owner allocates them.
  const variants=colors.flatMap((color,index)=>Object.entries(stock).map(([size,quantity])=>({color,size,quantity:index===0?quantity:0})));
  normalized.push({name,category,price,description:String(r.description||name),images,variants,sku:sku||existing?.sku||'FLIQ-'+id().slice(3,15).toUpperCase(),existingId:existing?.id,row,colors,total});existing?updates++:creates++;
 }catch(e){errors.push({row,message:e.message});}});
 if(commit&&!errors.length){for(const n of normalized){let c=d.categories.find(c=>c.name.toLowerCase()===n.category.toLowerCase());if(!c){c={id:id('category'),name:n.category,description:'',hidden:false,position:d.categories.length};d.categories.push(c);}const old=d.products.find(p=>p.id===n.existingId);const p=product({...n,category:c.id,collections:[...new Set([...(old?.collections||[]),c.id])],status:old?.status||'draft',authorizedToSell:old?.authorizedToSell||false},old,d);if(old)Object.assign(old,p);else d.products.unshift(p);}audit(d,actor,'catalog.import',String(normalized.length));}
 return {errors,valid:normalized.length,creates,updates,imported:commit&&!errors.length?normalized.length:0,preview:normalized.slice(0,20),warning:'Size totals are assigned to the first color; other colors start at zero. New products are drafts until legal authorization and stock allocation are reviewed.'};
}
export async function sheetRows(link,fetcher=fetch){let u;try{u=new URL(link);}catch{fail('Enter a Google Sheets URL.');}const match=u.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)\//);if(u.protocol!=='https:'||u.hostname!=='docs.google.com'||!match)fail('Use an HTTPS docs.google.com/spreadsheets/d/ link.');const gid=u.searchParams.get('gid')||new URLSearchParams(u.hash.slice(1)).get('gid')||'0';if(!/^\d+$/.test(gid))fail('Invalid sheet tab.');const response=await fetcher(`https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`,{signal:AbortSignal.timeout(10000)});if(!response.ok)fail('The sheet could not be read. Make this catalogue sheet viewable by link or use CSV.',502);if(Number(response.headers.get('content-length'))>2000000)fail('Sheet exceeds 2 MB.');const reader=response.body.getReader();let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000){await reader.cancel();fail('Sheet exceeds 2 MB.');}chunks.push(value);}const text=Buffer.concat(chunks).toString('utf8');if(/^\s*</.test(text))fail('Google returned an access page instead of CSV.');return csvRows(text);}
