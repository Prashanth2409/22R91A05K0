(function () {
  'use strict';
  const {products,categories}=window.FliqCatalog;
  const listing=products.filter(p=>window.FliqCatalog.listingIds.includes(p.id));
  let storage;
  try {storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
  const store=window.FliqStore.createStore(products,storage);
  const byId=new Map(products.map(p=>[p.id,p]));
  const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const heart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 4.8a5.5 5.5 0 0 0-7.8 0L12 5.5l-.7-.7a5.5 5.5 0 0 0-7.8 7.8L12 21l8.5-8.4a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const notice='Prototype catalog · Sample products & prices · Representative imagery';
  let view='cart',activeId=null,selectedSize='',origin='catalog',opener=null,toastTimer;
  const dialog=document.createElement('dialog');
  dialog.className='shop-dialog'; dialog.id='shop-dialog'; dialog.setAttribute('aria-labelledby','shop-title');
  document.body.append(dialog);
  const toast=document.createElement('div');toast.className='shop-toast';toast.setAttribute('role','status');document.body.append(toast);
  function announce(text){let target=toast;if(dialog.open){target=dialog.querySelector('.dialog-status');if(!target){target=document.createElement('div');target.className='shop-toast dialog-status';target.setAttribute('role','status');dialog.append(target);}}target.textContent=text;target.classList.add('shown');clearTimeout(toastTimer);toastTimer=setTimeout(()=>target.classList.remove('shown'),3500);}
  function saveNotice(){if(!store.persistent)announce('Browser storage is unavailable. Your selections will last for this visit.');}
  function sync(){
    document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=store.count());
    document.querySelectorAll('[data-wish-count]').forEach(e=>e.textContent=store.state.wishlist.length);
    document.querySelectorAll('[data-wish]').forEach(e=>{const saved=store.state.wishlist.includes(e.dataset.wish);e.setAttribute('aria-pressed',String(saved));e.setAttribute('aria-label',`${saved?'Remove':'Save'} ${byId.get(e.dataset.wish).name} ${saved?'from':'to'} wishlist`);});
    saveNotice();
  }
  function card(p,i){return `<article class="product-card"><div class="product-visual"><a class="product-open" data-product="${p.id}" href="product.html?id=${encodeURIComponent(p.id)}" aria-label="View ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)} — representative concept image" width="800" height="1000" loading="lazy" decoding="async" draggable="false"><span class="product-peek">Explore piece ↗</span></a><span class="product-number">${String(i+1).padStart(2,'0')}</span><button class="wish-button" data-wish="${p.id}" aria-label="Save ${esc(p.name)} to wishlist" aria-pressed="false">${heart}</button></div><div class="product-caption"><a data-product="${p.id}" href="product.html?id=${encodeURIComponent(p.id)}" class="product-name">${esc(p.name)}</a><span>${money(p.price)}</span></div><p class="product-spec">${esc(p.material)} / Unisex</p></article>`;}
  document.querySelectorAll('[data-catalog]').forEach(root=>{
    const mode=root.dataset.catalogMode||'full';
    if(mode==='drop'){
      const latestIds=['jackets-1','hoodies-1','tees-1','pants-1','jeans-1','shirts-1'];
      const latest=listing.slice(0,6);
      root.innerHTML=`<div class="catalog-intro"><span class="meta">${notice}</span><span class="meta">Latest / hottest drop · 06 pieces</span></div><section class="product-lane drop-lane" aria-labelledby="lane-latest"><div class="lane-heading"><div class="lane-title"><span class="lane-index">01 /</span><h3 class="display" id="lane-latest">Latest Drops</h3><span class="lane-count">${String(latest.length).padStart(2,'0')} pieces</span></div><div class="lane-aside"><p>Fresh into the rotation. The newest pieces from Issue 001.</p><div class="lane-controls"><button data-lane-step="-1" aria-label="Previous latest drops">←</button><button data-lane-step="1" aria-label="Next latest drops">→</button></div></div></div><div class="product-track" tabindex="0" role="region" aria-label="Latest drop products; swipe, drag, or use arrow keys">${latest.map(card).join('')}</div><div class="lane-bottom"><span class="meta">FLIQ / The Drop</span><div class="lane-progress" aria-hidden="true"><span></span></div><span class="meta lane-position">01 — ${String(latest.length).padStart(2,'0')}</span></div></section>`;
    }else{
      root.innerHTML=`<div class="catalog-intro"><span class="meta">${notice}</span><span class="meta">Swipe / drag to explore ↔</span></div><div class="category-tabs" role="group" aria-label="Filter collections"><button class="active" data-category="all" aria-pressed="true">All pieces</button>${categories.map(c=>`<button data-category="${c.id}" aria-pressed="false">${esc(c.name)}</button>`).join('')}</div><div class="catalog-lanes">${categories.filter(c=>listing.some(p=>p.collections.includes(c.id))).map((c,i)=>`<section class="product-lane" data-lane="${c.id}" aria-labelledby="lane-${c.id}"><div class="lane-heading"><div class="lane-title"><span class="lane-index">${String(i+1).padStart(2,'0')} /</span><h3 class="display" id="lane-${c.id}">${esc(c.name)}</h3><span class="lane-count">${listing.filter(p=>p.collections.includes(c.id)).length} pieces</span></div><div class="lane-aside"><p>${esc(c.description)}</p><div class="lane-controls"><button data-lane-step="-1" aria-label="Previous ${esc(c.name)}">←</button><button data-lane-step="1" aria-label="Next ${esc(c.name)}">→</button></div></div></div><div class="product-track" tabindex="0" role="region" aria-label="${esc(c.name)} products; swipe, drag, or use arrow keys">${listing.filter(p=>p.collections.includes(c.id)).map(card).join('')}</div><div class="lane-bottom"><span class="meta">FLIQ / Issue 001</span><div class="lane-progress" aria-hidden="true"><span></span></div><span class="meta lane-position">01 — ${listing.filter(p=>p.collections.includes(c.id)).length}</span></div></section>`).join('')}</div>`;
      root.addEventListener('click',e=>{const button=e.target.closest('[data-category]');if(!button)return;const next=new URLSearchParams(location.search);next.delete('page');if(button.dataset.category==='all')next.delete('collection');else next.set('collection',button.dataset.category);location.search=next;return;root.querySelectorAll('[data-category]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});root.querySelectorAll('[data-lane]').forEach(lane=>lane.hidden=button.dataset.category!=='all'&&lane.dataset.lane!==button.dataset.category);});
    }
  });
  // Native touch scrolling stays untouched. Desktop wheel is captured only over a lane
  // while it can travel in that direction; at either end, normal page scrolling resumes.
  document.querySelectorAll('.product-track').forEach(track=>{
    let target=0,raf=0,drag=null,suppress=false;
    const max=()=>Math.max(0,track.scrollWidth-track.clientWidth);
    const clamp=x=>Math.max(0,Math.min(max(),x));
    function animate(){const d=target-track.scrollLeft;if(Math.abs(d)<.7){track.scrollLeft=target;raf=0;track.classList.remove('is-scrolling');return;}track.scrollLeft+=d*.18;raf=requestAnimationFrame(animate);}
    function move(delta){track.classList.add('is-scrolling');target=clamp((raf?target:track.scrollLeft)+delta);if(reduced){track.scrollLeft=target;track.classList.remove('is-scrolling');return;}if(!raf)raf=requestAnimationFrame(animate);}
    function progress(){const span=track.parentElement.querySelector('.lane-progress span');const total=track.querySelectorAll('.product-card').length;const cardWidth=track.querySelector('.product-card')?.getBoundingClientRect().width||1;const fraction=max()?track.scrollLeft/max():0;span.style.transform=`translateX(${fraction*300}%)`;track.parentElement.querySelector('.lane-position').textContent=`${String(Math.min(total,Math.floor(track.scrollLeft/(cardWidth+16))+1)).padStart(2,'0')} — ${String(total).padStart(2,'0')}`;const buttons=track.parentElement.querySelectorAll('[data-lane-step]');if(buttons[0])buttons[0].disabled=track.scrollLeft<2;if(buttons[1])buttons[1].disabled=track.scrollLeft>max()-2;}
    track.addEventListener('scroll',progress,{passive:true});progress();
    track.addEventListener('wheel',e=>{
      if(e.ctrlKey||!matchMedia('(hover: hover) and (pointer: fine)').matches||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
      const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?track.clientWidth:1);
      const position=raf?target:track.scrollLeft;
      if((delta<0&&position<=1)||(delta>0&&position>=max()-1))return;
      e.preventDefault();move(delta);
    },{passive:false});
    track.addEventListener('keydown',e=>{if(e.target!==track)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move((e.key==='ArrowRight'?1:-1)*track.clientWidth*.65);}});
    track.parentElement.querySelectorAll('[data-lane-step]').forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.laneStep)*track.clientWidth*.7)));
    track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('.wish-button'))return;cancelAnimationFrame(raf);raf=0;drag={x:e.clientX,start:track.scrollLeft,id:e.pointerId,moved:false};suppress=false;});
    track.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>6){drag.moved=true;track.classList.add('dragging');track.setPointerCapture(drag.id);}if(drag.moved){track.scrollLeft=drag.start-dx;e.preventDefault();}});
    function release(){if(!drag)return;suppress=drag.moved;track.classList.remove('dragging');if(track.hasPointerCapture(drag.id))track.releasePointerCapture(drag.id);drag=null;}
    track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
    track.addEventListener('pointerleave',()=>{if(drag&&!drag.moved)drag=null;});
    track.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopPropagation();suppress=false;}},true);
    new ResizeObserver(progress).observe(track);
  });
  function chrome(title,body,back){return `<div class="dialog-top"><button class="text-button" data-action="${back||'close'}">${back?'← Back':'← Continue browsing'}</button><button class="dialog-close" data-action="close" aria-label="Close shopping panel">✕</button></div><div class="dialog-body"><p class="meta accent">FLIQ / Prototype store</p><h2 id="shop-title" class="display" tabindex="-1">${title}</h2>${body}</div>`;}
  function renderProduct(){
    const p=byId.get(activeId);const options=p.sizes.map(s=>`<button class="size-option ${s===selectedSize?'selected':''}" data-size="${esc(s)}" aria-pressed="${s===selectedSize}">${esc(s)}</button>`).join('');
    return chrome('The details.',`<div class="product-detail"><div class="detail-photo"><img src="${esc(p.image)}" alt="${esc(p.name)} — representative concept image"><span class="meta">Representative concept image</span></div><div class="detail-info"><p class="meta">${categories.find(c=>c.id===p.category).name} / Unisex</p><h3 class="display">${esc(p.name)}</h3><p class="detail-price">${money(p.price)}</p><p class="detail-description">${esc(p.description)}</p><div class="size-heading"><span>Select size</span><span class="meta">Relaxed / oversized</span></div><div class="size-options" role="group" aria-label="Select size">${options}</div><div class="quantity-label"><span>Quantity</span><div class="detail-quantity-stepper" role="group" aria-label="Product quantity"><button type="button" data-detail-quantity="-1" aria-label="Decrease quantity" disabled>−</button><span class="detail-quantity-value" id="detail-quantity-value" aria-live="polite">1</span><button type="button" data-detail-quantity="1" aria-label="Increase quantity">+</button><input id="detail-quantity" type="hidden" value="1"></div></div><div class="detail-actions"><button class="solid-button" data-action="add-product" ${selectedSize?'':'disabled'}>${selectedSize?'Add to cart — '+money(p.price):'Choose a size'}</button><button class="outline-button" data-wish="${p.id}" aria-pressed="false" aria-label="Save to wishlist">${heart}</button></div><button class="text-button" data-action="cart">View cart →</button><details><summary>Fabric & fit concept</summary><p>${esc(p.material)}. Sample sizing S–XXL unless marked one size. Final measurements, composition, care and availability will be confirmed by the store.</p></details><p class="prototype-note">Demo only. This is not confirmed inventory. No real purchases or payments.</p></div></div>`,origin==='wishlist'?'wishlist':null);
  }
  function renderWishlist(){const items=store.state.wishlist.map(id=>byId.get(id));return chrome(`Saved pieces <span class="accent">(${items.length})</span>`,items.length?`<p class="panel-lede">Your next rotation, on standby.</p><div class="saved-list">${items.map(p=>`<article class="saved-item"><button data-product="${p.id}" aria-label="View ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></button><div><button class="product-name" data-product="${p.id}">${esc(p.name)}</button><p>${money(p.price)}</p><label class="meta" for="saved-size-${p.id}">Size</label><select id="saved-size-${p.id}">${p.sizes.length>1?'<option value="">Choose size</option>':''}${p.sizes.map(s=>`<option ${p.stock?.[s]===0?'disabled':''}>${esc(s)}</option>`).join('')}</select><label class="meta" for="saved-color-${p.id}">Color</label><select id="saved-color-${p.id}"><option value="">Choose color</option>${p.colors.map(c=>`<option>${esc(c)}</option>`).join('')}</select><div class="saved-actions"><button class="solid-button" data-saved-add="${p.id}">Add to cart</button><button class="text-button" data-wish="${p.id}" aria-pressed="true">Remove</button></div></div></article>`).join('')}</div><button class="outline-button" data-action="cart">View cart →</button>`:empty('Nothing saved. Yet.','Tap the heart on a piece to build your rotation.'));}
  function empty(title,copy){return `<div class="empty-state"><span class="empty-mark" aria-hidden="true">↗</span><h3 class="display">${title}</h3><p>${copy}</p><button class="solid-button" data-action="close">Keep exploring</button></div>`;}
  function cartRows(editable){return store.state.cart.map((item,i)=>{const p=byId.get(item.id);const variant=item.color?` / Colour ${esc(item.color)}`:'';return `<article class="cart-item"><button data-product="${p.id}" aria-label="View ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}"></button><div><button class="product-name" data-product="${p.id}">${esc(p.name)}</button><p class="meta">Size ${esc(item.size)}${variant} / ${money(p.price)} each</p>${editable?`<div class="quantity-stepper"><button data-quantity="${i}" data-delta="-1" aria-label="Decrease ${esc(p.name)} quantity" ${item.quantity<=1?'disabled':''}>−</button><span aria-live="polite">${item.quantity}</span><button data-quantity="${i}" data-delta="1" aria-label="Increase ${esc(p.name)} quantity" ${item.quantity>=10?'disabled':''}>+</button></div><button class="text-button remove-item" data-remove="${i}">Remove</button>`:`<p>Quantity ${item.quantity}</p>`}</div><strong>${money(p.price*item.quantity)}</strong></article>`;}).join('');}
  function totals(){return `<div class="order-totals"><div><span>Subtotal</span><strong>${money(store.subtotal())}</strong></div><div><span>Shipping</span><span>Calculated at checkout</span></div><div class="total"><span>Items total</span><strong>${money(store.subtotal())}</strong></div></div>`;}
  function renderCart(){return chrome(`Your rotation <span class="accent">(${store.count()})</span>`,store.count()?`<p class="panel-lede">Good pieces. All in one place.</p><div class="cart-list">${cartRows(true)}</div>${totals()}<p class="prototype-note">Prototype cart. Products, pricing and shipping are illustrative.</p><button class="solid-button full-width" data-action="checkout">Proceed to checkout ↗</button><button class="text-button" data-action="close">Continue shopping</button>`:empty('Your cart is empty.','Find something that feels like you.'));}
  function render(focus=true){
    const markup=view==='product'?renderProduct():view==='wishlist'?renderWishlist():renderCart();
    dialog.innerHTML=markup.replace(/<button(?![^>]*type=)/g,'<button type="button"');dialog.dataset.view=view;dialog.scrollTop=0;sync();if(focus)dialog.querySelector('#shop-title').focus({preventScroll:true});
  }
  function open(next,id){
    if(!dialog.open){opener=document.activeElement;dialog.showModal();document.body.classList.add('shop-open');}
    if(next==='product'){origin=view==='wishlist'?'wishlist':'catalog';activeId=id;selectedSize=byId.get(id).sizes.length===1?'One size':'';}
    view=next;render();
  }
  function close(){dialog.close();}
  dialog.addEventListener('close',()=>{document.body.classList.remove('shop-open');if(opener?.isConnected)opener.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  document.addEventListener('click',e=>{
    const wish=e.target.closest('[data-wish]');
    if(wish){const id=wish.dataset.wish;store.toggleWish(id);const saved=store.state.wishlist.includes(id);sync();announce(saved?'Saved to your wishlist.':'Removed from your wishlist.');if(view==='wishlist'&&dialog.open)render();return;}
    const product=e.target.closest('[data-product]');if(product){if(product.tagName==='A')return;location.href='product.html?id='+encodeURIComponent(product.dataset.product);return;}
    const toolbar=e.target.closest('[data-shop]');if(toolbar){open(toolbar.dataset.shop);return;}
    const size=e.target.closest('[data-size]');if(size){selectedSize=size.dataset.size;dialog.querySelectorAll('[data-size]').forEach(b=>{b.classList.toggle('selected',b===size);b.setAttribute('aria-pressed',String(b===size));});const add=dialog.querySelector('[data-action="add-product"]');add.disabled=false;add.textContent='Add to cart — '+money(byId.get(activeId).price);return;}
    const saved=e.target.closest('[data-saved-add]');if(saved){const select=dialog.querySelector('#saved-size-'+saved.dataset.savedAdd);if(!select.value){select.focus();announce('Choose a size before adding to cart.');return;}const color=dialog.querySelector('#saved-color-'+saved.dataset.savedAdd);if(!color.value){color.focus();announce('Choose a color.');return;}if(!store.add(saved.dataset.savedAdd,select.value,1,color.value)){announce('This size is sold out or your cart exceeds stock.');return;}sync();announce('Added to cart.');return;}
    const detailQty=e.target.closest('[data-detail-quantity]');if(detailQty){const input=dialog.querySelector('#detail-quantity');const value=dialog.querySelector('#detail-quantity-value');if(!input||!value)return;const next=Math.max(1,Math.min(10,Number(input.value)+Number(detailQty.dataset.detailQuantity)));input.value=String(next);value.textContent=String(next);const minus=dialog.querySelector('[data-detail-quantity="-1"]');const plus=dialog.querySelector('[data-detail-quantity="1"]');if(minus)minus.disabled=next<=1;if(plus)plus.disabled=next>=10;return;}
    const qty=e.target.closest('[data-quantity]');if(qty){const item=store.state.cart[Number(qty.dataset.quantity)];const oldScroll=dialog.scrollTop;store.setQuantity(item.id,item.size,item.quantity+Number(qty.dataset.delta),item.color||'');render(false);dialog.scrollTop=oldScroll;const control=dialog.querySelector(`[data-quantity="${qty.dataset.quantity}"][data-delta="${qty.dataset.delta}"]`);(control?.disabled?dialog.querySelector('#shop-title'):control)?.focus({preventScroll:true});return;}
    const remove=e.target.closest('[data-remove]');if(remove){const item=store.state.cart[Number(remove.dataset.remove)];store.remove(item.id,item.size,item.color||'');render();return;}
    const action=e.target.closest('[data-action]')?.dataset.action;
    if(action==='close')close();
    else if(action==='checkout'){location.href='/checkout.html';}
    else if(['cart','wishlist'].includes(action)){if(action==='checkout'&&!store.count())return;view=action;render();}
    else if(action==='add-product'){
      const input=dialog.querySelector('#detail-quantity');
      if(store.add(activeId,selectedSize,input.value)){sync();announce('Added to cart — '+byId.get(activeId).name);dialog.querySelector('[data-action="add-product"]').textContent='Added ✓ · Add another';}
    }
  });
  addEventListener('storage',()=>{store.reload();sync();if(dialog.open&&['cart','wishlist','checkout'].includes(view))render();});
  addEventListener('fliq-store-change',()=>{store.reload();sync();if(dialog.open&&['cart','wishlist','checkout'].includes(view))render(false);});
  sync();
})();
