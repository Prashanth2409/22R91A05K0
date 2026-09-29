/* Fetch bounded live catalog data before starting the original FLIQ modules. */
(async function(){
  'use strict';
  const params=new URLSearchParams(location.search),query=new URLSearchParams();
  if(document.querySelector('[data-catalog-mode="drop"]')){query.set('featured','1');query.set('limit','6');}
  for(const key of ['collection','page','q'])if(params.has(key))query.set(key,params.get(key));
  if(params.has('id'))query.set('product',params.get('id'));
  let stored;try{stored=JSON.parse(localStorage.getItem('fliq-shop-v1')||'{}');}catch{stored={};}
  const ids=[...(stored.cart||[]).map(x=>x.id),...(stored.wishlist||[])];query.set('cart',[...new Set(ids)].slice(0,100).join(','));
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.append(s);});
  try{
    const response=await fetch('/api/catalog?'+query,{cache:'no-store'});if(!response.ok)throw Error('Catalog unavailable');window.FliqCatalog=await response.json();
    await load('/js/store-settings.js');await load('/js/store.js');await load('/js/shop.js');if(document.getElementById('product-page-root'))await load('/js/product-page.js');await load('/js/main.js');
    await load('/js/live-catalog.js');if(document.getElementById('policies-root')){const response=await fetch('/api/store-settings');if(response.ok){const settings=await response.json();const details=document.getElementById('policy-details');for(const value of [settings.policies.additional,settings.store.businessDetails,settings.store.email,settings.store.phone,settings.store.address,settings.shipping.estimate])if(value){const paragraph=document.createElement('p');paragraph.textContent=value;details.append(paragraph);}}}if(document.getElementById('checkout-root'))await load('/js/checkout.js');
  }catch(e){document.getElementById('loader')?.remove();document.body.classList.add('loaded');const box=document.createElement('div');box.className='commerce-error';box.setAttribute('role','alert');box.textContent='FLIQ cloud service could not load. Check the Netlify deploy/database status, then reload this page.';document.querySelector('main')?.prepend(box);}
})();
