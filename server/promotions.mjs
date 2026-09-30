import {fail,id,now} from './model.mjs';
export const promoCode=value=>String(value||'').trim().toUpperCase();
export function promotion(input,d,old={}){
 const p={...old,id:old.id||id('promo'),code:promoCode(input.code),type:input.type,scope:input.scope,value:Number(input.value),minCart:Number(input.minCart||0),maxCap:input.maxCap===''||input.maxCap==null?null:Number(input.maxCap),active:input.active===true,targets:input.targets||[],startsAt:input.startsAt||null,endsAt:input.endsAt||null,usageLimit:input.usageLimit===''||input.usageLimit==null?null:Number(input.usageLimit),perCustomerLimit:input.perCustomerLimit===''||input.perCustomerLimit==null?null:Number(input.perCustomerLimit),updated_at:now()};
 if(!/^[A-Z0-9_-]{3,40}$/.test(p.code)||!['percent','fixed'].includes(p.type)||!['order','product','category'].includes(p.scope))fail('Choose a valid code, discount type and scope.');
 if((d.promotions||[]).some(x=>x.id!==p.id&&x.code===p.code))fail('Promo code already exists.',409);
 if(!Number.isFinite(p.value)||p.value<=0||p.value>(p.type==='percent'?100:1000000)||!Number.isFinite(p.minCart)||p.minCart<0||p.minCart>1000000||p.maxCap!==null&&(!Number.isFinite(p.maxCap)||p.maxCap<=0||p.maxCap>1000000))fail('Invalid discount, minimum cart or cap.');
 for(const k of ['usageLimit','perCustomerLimit'])if(p[k]!==null&&(!Number.isSafeInteger(p[k])||p[k]<1))fail('Usage limits must be positive whole numbers.');
 for(const k of ['startsAt','endsAt'])if(p[k]&&!Number.isFinite(Date.parse(p[k])))fail('Invalid promotion date.');
 if(p.startsAt&&p.endsAt&&Date.parse(p.endsAt)<=Date.parse(p.startsAt))fail('End date must follow start date.');
 if(!Array.isArray(p.targets)||p.targets.length>100||p.scope!=='order'&&(!p.targets.length||p.targets.some(t=>!(p.scope==='product'?d.products:d.categories).some(x=>x.id===t))))fail('Select valid scope targets.');
 return p;
}
export function discountQuote(d,items,code,email='',exclude){
 const subtotal=items.reduce((n,x)=>n+x.price*x.quantity,0),shipping=Math.round(Number(d.settings.shipping.flatFee||0)*100);
 const result={subtotal,shipping,discount:0,amount:subtotal+shipping,promoId:null,promoCode:null};
 if(!promoCode(code))return result;
 const p=(d.promotions||[]).find(x=>x.code===promoCode(code)&&!x.deleted);
 const t=Date.now();if(!p||!p.active||p.startsAt&&Date.parse(p.startsAt)>t||p.endsAt&&Date.parse(p.endsAt)<=t)fail('Promo code is unavailable.');
 if(subtotal<Math.round(p.minCart*100))fail('Cart does not meet the promo minimum.');
 const used=d.attempts.filter(a=>a.id!==exclude&&a.promoId===p.id&&(a.state==='paid'||a.expires>t&&!['failed','creation_failed'].includes(a.state)));
 if(p.usageLimit!==null&&used.length>=p.usageLimit)fail('Promo usage limit reached.',409);
 if(p.perCustomerLimit!==null&&used.filter(a=>a.customer.email.toLowerCase()===email.toLowerCase()).length>=p.perCustomerLimit)fail('Your promo usage limit has been reached.',409);
 const eligible=items.filter(x=>p.scope==='order'||p.scope==='product'&&p.targets.includes(x.product_id)||p.scope==='category'&&x.collections.some(c=>(p.targets.includes(c)||d.categories.some(category=>category.id===c&&p.targets.includes(category.parentId))))).reduce((n,x)=>n+x.price*x.quantity,0);
 if(!eligible)fail('Promo does not apply to these products.');
 const discount=Math.min(eligible,p.type==='percent'?Math.floor(eligible*p.value/100):Math.round(p.value*100),p.maxCap===null?Infinity:Math.round(p.maxCap*100));
 if(subtotal+shipping-discount<100)fail('Discounted payment must be at least INR 1.');
 return {...result,discount,amount:subtotal+shipping-discount,promoId:p.id,promoCode:p.code,promoLimits:{usageLimit:p.usageLimit,perCustomerLimit:p.perCustomerLimit}};
}
