import {randomUUID} from 'node:crypto';
const base=process.env.FLIQ_BASE||'https://fliq-commerce.vercel.app';
const body={
  items:[{id:'shirts-4',size:'S',color:'Black',quantity:1}],
  customer:{name:'FLIQ QA',email:'qa@example.com',phone:'9000000000',address:'QA address',city:'Hyderabad',state:'Telangana',pin:'500001',whatsappConsent:false,restockConsent:false},
  requestId:randomUUID()
};
const response=await fetch(base+'/__fliq/razorpay/create-order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const text=await response.text();
console.log('Razorpay live order probe:',response.status,text);
if(!response.ok)process.exit(1);
const data=JSON.parse(text);
if(!String(data.orderId||'').startsWith('order_')||!String(data.keyId||'').startsWith('rzp_test_'))throw new Error('Razorpay TEST order response is invalid');
console.log('Razorpay TEST order creation PASS');
