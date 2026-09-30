(async function(){
 try{const r=await fetch('/api/store-settings',{cache:'no-store'});if(!r.ok)return;const {store,home}=await r.json();
 const media=document.querySelector('.hero-media');if(media&&home?.heroVideoUrl&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const video=document.createElement('video');video.className='hero-background';video.muted=true;video.loop=true;video.playsInline=true;video.autoplay=true;video.preload='metadata';video.src=home.heroVideoUrl;video.onerror=()=>video.remove();media.append(video);video.play().catch(()=>video.remove());}
 for(const node of document.querySelectorAll('[data-store-address]'))if(store.address)node.textContent=store.address;
 if(store.phone){const phone=store.phone.replace(/\D/g,'');for(const link of document.querySelectorAll('a[href^="https://wa.me/"]'))link.href='https://wa.me/'+phone;const form=document.querySelector('#dm-form');if(form)form.dataset.wa=phone;}
 const footer=document.querySelector('.footer-grid');if(footer&&(store.email||store.phone)){const node=document.createElement('div'),heading=document.createElement('h3');heading.textContent='Store support';node.append(heading);for(const value of [store.name,store.email,store.phone]){const p=document.createElement('p');p.textContent=value||'';node.append(p);}footer.append(node);}
 }catch{/* Existing static contact content stays visible during a network failure. */}
})();
