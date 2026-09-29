(function(){
'use strict';
if('BroadcastChannel' in window){const channel=new BroadcastChannel('fliq-catalog');channel.onmessage=()=>{if(!document.hidden&&!document.getElementById('checkout-root'))location.reload();};}
const root=document.querySelector('[data-catalog-mode="collections"]')||document.querySelector('[aria-label="Browse the collection"]');
if(root){const info=window.FliqCatalog.pagination,params=new URLSearchParams(location.search);const nav=document.createElement('nav');nav.className='catalog-pagination';nav.setAttribute('aria-label','Product pages');
 const form=document.createElement('form');form.setAttribute('role','search');const input=document.createElement('input');input.type='search';input.name='q';input.value=params.get('q')||'';input.placeholder='Search pieces, sizes, colors…';input.setAttribute('aria-label','Search catalogue');const search=document.createElement('button');search.textContent='Search ↗';search.className='outline-button';form.append(input,search);form.onsubmit=e=>{e.preventDefault();params.set('q',input.value);params.delete('page');location.search=params;};nav.append(form);
 const label=document.createElement('span');label.textContent=`Page ${info.page} of ${Math.max(1,info.pages)} · ${info.total} pieces`;nav.append(label);
 for(const [text,n,disabled] of [['← Previous',info.page-1,info.page<=1],['Next →',info.page+1,info.page>=info.pages]]){const button=document.createElement('button');button.textContent=text;button.disabled=disabled;button.className='outline-button';button.onclick=()=>{params.set('page',n);location.search=params;};nav.append(button);}root.append(nav);
 for(const b of root.querySelectorAll('[data-category]')){const on=b.dataset.category===(params.get('collection')||'all');b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));}}
})();
