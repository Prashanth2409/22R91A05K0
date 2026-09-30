import {randomUUID, randomBytes, createHash, scryptSync, timingSafeEqual} from 'node:crypto';
import catalog from '../public/js/catalog.js';
export const now=()=>new Date().toISOString();
export const id=(prefix='id')=>`${prefix}-${randomUUID()}`;
export const token=()=>randomBytes(32).toString('hex');
export const digest=x=>createHash('sha256').update(String(x)).digest('hex');
export const stages=['Received / Paid','Processing','Packed','Dispatched','Out for Delivery','Delivered','Cancelled'];
export function fail(message,status=400){throw Object.assign(new Error(message),{status});}
export function hashPassword(value){const salt=token();return `${salt}:${scryptSync(value,salt,32).toString('hex')}`;}
export function passwordMatches(value,stored){const [salt,hash]=String(stored).split(':');if(!salt||!hash)return false;const actual=scryptSync(String(value),salt,32);const expected=Buffer.from(hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
export function audit(d,actor,action,entity){d.revision++;d.audit.unshift({id:id('audit'),actor,action,entity,created_at:now()});}
export const publicStaff=({id,email,username,role,active})=>({id,email,username,role,active});
export function seed(){
 const d={revision:1,categories:catalog.categories.map((c,i)=>({...c,hidden:false,position:i})),products:catalog.products.map((p,i)=>({...p,sku:`FLIQ-${i+1}`,images:p.images||[p.image],tags:['unisex'],colors:['Black'],stock:Object.fromEntries(p.sizes.map(s=>[s,8])),variants:p.sizes.map(size=>({size,color:'Black',quantity:8})),collections:[p.category],status:'published',authorizedToSell:true,version:1,updated_at:now(),attributes:{}})),orders:[],attempts:[],audit:[],staff:[],sessions:[],loginAttempts:[],whatsappLogs:[],broadcasts:[],issues:[],settings:{store:{name:'FLIQ UNISEX CLOTHING',email:'',phone:'',address:'Hyderabad, Telangana',businessDetails:'Owner preview. Concept catalogue.',currency:'INR'},shipping:{courier:'',service:'Standard',flatFee:0,estimate:'3–5 business days'},policies:{text:'Online payment only. No COD. All sales final. No returns or exchanges.',additional:''}}};
 for(const [username,role] of [['admin','owner'],['inventory','inventory'],['orders','fulfillment']])d.staff.push({id:id('staff'),username,email:username,role,active:true,passwordHash:hashPassword('admin'),demo:true});
 return d;
}
export function quantities(p){p.stock={};for(const v of p.variants||[])p.stock[v.size]=(p.stock[v.size]||0)+v.quantity;p.sizes=Object.keys(p.stock);p.colors=[...new Set((p.variants||[]).map(v=>v.color))];return p;}
export function state(p){return p.status==='archived'?'Archived':p.status==='draft'?'Draft':p.variants.every(v=>v.quantity===0)?'Out of Stock':'Active';}
export function visible(p,d){return p.status==='published'&&p.authorizedToSell&&(p.collections||[]).some(c=>d.categories.some(x=>x.id===c&&!x.hidden&&(!x.parentId||d.categories.some(parent=>parent.id===x.parentId&&!parent.hidden))));}
export function imageURL(s){return typeof s==='string'&&s.length<2048&&(/^\/?img\/[\w./-]+$/.test(s)||/^\/api\/images\/[a-f0-9-]+$/.test(s)||/^https:\/\//.test(s));}
export function product(input,existing,d){
 const p={...existing};
 for(const k of ['name','description','sku','material'])p[k]=String(input[k]??p[k]??'').trim();
 if(!p.name||p.name.length>150||!p.description||p.description.length>10000||!p.sku||p.sku.length>100)fail('Name, description and unique SKU are required.');
 if(d.products.some(x=>x.id!==p.id&&x.sku.toLowerCase()===p.sku.toLowerCase()))fail('SKU already exists.',409);
 p.price=Number(input.price??p.price);if(!Number.isFinite(p.price)||p.price<=0||p.price>1000000)fail('Price must be positive and below ₹1,000,000.');p.price=Math.round(p.price*100)/100;
 p.originalPrice=input.originalPrice?Number(input.originalPrice):null;if(p.originalPrice!==null&&(!Number.isFinite(p.originalPrice)||p.originalPrice<p.price))fail('Original price must be at least the selling price.');
 p.status=input.status==='active'?'published':input.status??p.status??'draft';if(!['draft','published','archived'].includes(p.status))fail('Invalid product state.');
 p.authorizedToSell=input.authorizedToSell??p.authorizedToSell??false;if(p.status==='published'&&p.authorizedToSell!==true)fail('Confirm legal authorization before publishing.');
 for(const k of ['images','tags','collections']){p[k]=input[k]??p[k]??[];if(!Array.isArray(p[k])||p[k].some(x=>typeof x!=='string'||x.length>2048))fail(`Invalid ${k}`);}
 if(p.images.length>12||p.images.some(x=>!imageURL(x)))fail('Images must use HTTPS or uploaded image paths.');
 if(!p.collections.length||p.collections.some(c=>!d.categories.some(x=>x.id===c)))fail('Choose an existing category or collection.');
 p.image=p.images[0]||'';p.category=input.category||p.category||p.collections[0];if(!p.collections.includes(p.category))p.category=p.collections[0];
 p.attributes=input.attributes??p.attributes??{};if(!p.attributes||Array.isArray(p.attributes)||typeof p.attributes!=='object'||JSON.stringify(p.attributes).length>5000)fail('Invalid custom attributes.');
 let vs=input.variants;
 if(!vs){const colors=input.colors||p.colors||['Default'];if(colors.length!==1&&input.stock)fail('Use the color / size variant matrix for products with multiple colors.');vs=input.stock?Object.entries(input.stock).map(([size,quantity])=>({size,color:colors[0]||'Default',quantity})):p.variants;}
 if(!Array.isArray(vs)||!vs.length||vs.length>250)fail('Provide 1–250 size/color variants.');
 const keys=new Set();p.variants=vs.map(v=>{const size=String(v.size||'').trim(),color=String(v.color||'').trim(),quantity=Number(v.quantity);if(!size||!color||size.length>80||color.length>80||!Number.isSafeInteger(quantity)||quantity<0||quantity>1000000)fail('Every variant needs size, color and a nonnegative whole stock quantity.');const k=JSON.stringify([size,color]);if(keys.has(k))fail('Duplicate color / size variant.');keys.add(k);return {size,color,quantity};});
 p.position=Number(input.position??p.position??0);if(!Number.isSafeInteger(p.position)||p.position<0)fail('Product order must be a nonnegative integer.');
 p.id=p.id||id('product');p.version=(p.version||0)+1;p.updated_at=now();return quantities(p);
}
export function paginate(items,sp){const page=Math.max(1,Math.min(100000,Math.floor(Number(sp.get('page'))||1))),limit=Math.max(1,Math.min(100,Math.floor(Number(sp.get('limit'))||24)));return {items:items.slice((page-1)*limit,page*limit),total:items.length,page,limit,pages:Math.ceil(items.length/limit)};}
export function customers(d){const map=new Map();for(const o of d.orders){const key=o.customer.email.toLowerCase();let c=map.get(key)||{...o.customer,id:digest(key),order_count:0,spent:0,last_order:o.created_at,consent:false};c.order_count++;if(o.payment_status==='paid'&&!o.refund_required)c.spent+=o.amount;if(o.created_at>=c.last_order)c.consent=o.customer.whatsappConsent===true;c.last_order=c.last_order>o.created_at?c.last_order:o.created_at;map.set(key,c);}return [...map.values()];}
export function delivery(estimate){const nums=String(estimate).match(/\d+/g)?.map(Number)||[3,5];const start=new Date(),end=new Date();const add=(date,n)=>{for(let i=0;i<n;){date.setUTCDate(date.getUTCDate()+1);if(![0,6].includes(date.getUTCDay()))i++;}return date.toISOString().slice(0,10);};return `${add(start,Math.min(nums[0]||3,60))} – ${add(end,Math.min(Math.max(nums[0]||3,nums[1]||5),60))}`;}
