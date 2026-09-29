(function(){
  'use strict';
  const root=document.getElementById('product-page-root');
  if(!root||!window.FliqCatalog||!window.FliqStore)return;
  const {products,categories}=window.FliqCatalog;
  const byId=new Map(products.map(p=>[p.id,p]));
  const params=new URLSearchParams(location.search);
  const id=params.get('id');
  const p=byId.get(id);
  const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const heart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 4.8a5.5 5.5 0 0 0-7.8 0L12 5.5l-.7-.7a5.5 5.5 0 0 0-7.8 7.8L12 21l8.5-8.4a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  const backIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
  let storage;
  try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
  const store=window.FliqStore.createStore(products,storage);

  const colorSets={
    tees:[['Ink Black','#151515'],['Bone','#d7d0c3'],['Acid Olive','#76764f']],
    shirts:[['Midnight','#202125'],['Stone','#aaa397'],['Dust Olive','#77745f']],
    hoodies:[['Black','#181818'],['Ash','#a5a39f'],['Rust','#8f513f']],
    jackets:[['Washed Black','#292929'],['Indigo','#3f526a'],['Bison','#765743']],
    pants:[['Coal','#32302d'],['Khaki','#9a8d73'],['Olive','#66654f']],
    joggers:[['Graphite','#464646'],['Black','#171717'],['Heather','#9c9a95']],
    jeans:[['Indigo','#40546f'],['Washed Black','#414141'],['Ice Blue','#8598ae']],
    accessories:[['Black','#171717'],['Canvas','#c4b8a1'],['Signal','#ff3d00']]
  };
  const specs={
    tees:{pattern:'Minimal / graphic concept',care:'Cold wash / inside out',construction:'Heavyweight jersey'},
    shirts:{pattern:'Relaxed open silhouette',care:'Cold gentle wash',construction:'Textured woven cotton'},
    hoodies:{pattern:'Clean streetwear block',care:'Cold wash / low spin',construction:'Heavy fleece'},
    jackets:{pattern:'Structured outer layer',care:'Cold gentle wash',construction:'Washed denim'},
    pants:{pattern:'Utility street cut',care:'Cold wash',construction:'Cotton twill'},
    joggers:{pattern:'Relaxed everyday fit',care:'Cold wash',construction:'Heavy fleece'},
    jeans:{pattern:'Wide-leg denim',care:'Wash separately / cold',construction:'Washed denim'},
    accessories:{pattern:'Everyday accessory',care:'Spot clean',construction:'Canvas'}
  };

  if(!p){
    root.innerHTML='<section class="product-not-found"><p class="meta accent">FLIQ / Product</p><h1 class="display">Piece not found.</h1><p>This product link is unavailable in the current prototype catalog.</p><a class="solid-button" href="collections.html">Explore collections ↗</a></section>';
    return;
  }

  const cat=categories.find(c=>c.id===p.category);
  const related=[...products.filter(x=>x.category===p.category&&x.id!==p.id),...products.filter(x=>x.category!==p.category&&x.id!==p.id)].slice(0,4);
  const swatchFor=name=>{const known={black:'#171717',white:'#e6e1d8',olive:'#6f724e',rust:'#8f513f',blue:'#4b6280',indigo:'#40546f',grey:'#8c8c8c',gray:'#8c8c8c',beige:'#b6a58c',brown:'#765743',red:'#a53e34',orange:'#c96a32',green:'#4f6b52',pink:'#b97886',purple:'#766080'};const key=String(name).toLowerCase();for(const [k,v] of Object.entries(known))if(key.includes(k))return v;let h=0;for(const c of String(name))h=(h*31+c.charCodeAt(0))%360;return `hsl(${h} 28% 48%)`;};
  const colors=(Array.isArray(p.colors)&&p.colors.length?p.colors:(colorSets[p.category]||colorSets.tees).map(x=>x[0])).map(name=>[name,swatchFor(name)]);
  const detail=specs[p.category]||specs.tees;
  const sizeButtons=p.sizes.map(s=>`<button type="button" class="size-option" data-page-size="${esc(s)}" aria-pressed="false" ${p.stock?.[s]===0?'disabled':''}>${esc(s)}${p.stock?.[s]===0?'<small>SOLD OUT</small>':''}</button>`).join('');
  const colorButtons=colors.map(([name,hex])=>`<button type="button" class="color-option" data-page-color="${esc(name)}" aria-pressed="false"><span class="color-swatch" style="--swatch:${hex}"></span><span class="color-copy"><strong>${esc(name)}</strong><span>Select colour</span></span></button>`).join('');
  const recCards=related.map((r,i)=>`<article class="recommendation-card product-card"><div class="product-visual"><a class="product-open" href="product.html?id=${encodeURIComponent(r.id)}" aria-label="View ${esc(r.name)}"><img src="${esc(r.image)}" alt="${esc(r.name)} — representative concept image" loading="lazy"><span class="product-peek">Explore piece ↗</span></a><span class="product-number">${String(i+1).padStart(2,'0')}</span></div><div class="product-caption"><a class="product-name" href="product.html?id=${encodeURIComponent(r.id)}">${esc(r.name)}</a><span>${money(r.price)}</span></div><p class="product-spec">${esc(r.material)} / Unisex</p></article>`).join('');

  document.title=`${p.name} — FLIQ®`;
  root.innerHTML=`
    <button type="button" class="product-back-arrow" data-product-back aria-label="Go back">${backIcon}</button>
    <section class="product-shell">
      <div class="product-gallery" aria-label="${esc(p.name)} product gallery">
${p.images?.length>1?p.images.map((src,i)=>`<figure class="product-gallery-figure"><img src="${esc(src)}" alt="${esc(p.name)} — view ${i+1}" ${i?'loading="lazy"':''}><figcaption class="gallery-tag meta">${String(i+1).padStart(2,'0')} / ${i?'Detail':'Main view'}</figcaption></figure>`).join(''):`        <figure class="product-gallery-figure"><img src="${esc(p.image)}" alt="${esc(p.name)} — main product view"><figcaption class="gallery-tag meta">01 / Main view</figcaption></figure>
        <figure class="product-gallery-figure detail-crop"><img src="${esc(p.images?.[1]||p.image)}" alt="${esc(p.name)} — fabric detail crop" loading="lazy"><figcaption class="gallery-tag meta">02 / Detail</figcaption></figure>
        <figure class="product-gallery-figure detail-crop alt"><img src="${esc(p.images?.[2]||p.image)}" alt="${esc(p.name)} — silhouette detail crop" loading="lazy"><figcaption class="gallery-tag meta">03 / Fit</figcaption></figure>
`}
      </div>
      <div class="product-panel"><div class="product-panel-inner">
        <div class="product-breadcrumb meta"><a href="collections.html">Collections</a><span>/</span><span>${esc(cat?.name||p.category)}</span><span>/</span><span>${esc(p.name)}</span></div>
        <p class="product-kicker meta">FLIQ / Issue 001 / Unisex</p>
        <h1 class="product-title display">${esc(p.name)}</h1>
        <div class="product-price-wrap"><p class="product-price">${money(p.price)}</p>${p.originalPrice?`<del class="product-old-price">${money(p.originalPrice)}</del>`:''}<span class="product-price-note meta">Demo price / taxes included in prototype</span></div>
        <div class="product-rating-line"><span class="product-rating-score">4.8</span><span class="product-rating-stars" aria-label="4.8 out of 5 stars">★★★★★</span><span class="meta">Sample review preview</span></div>
        <p class="product-copy">${esc(p.description)}</p>

        <div class="product-option-block">
          <div class="product-option-head"><span>Choose colour</span><span class="meta" data-selected-color>Required</span></div>
          <div class="product-color-options" role="group" aria-label="Select colour">${colorButtons}</div>
        </div>

        <div class="product-option-block">
          <div class="product-option-head"><span>Select size</span><span class="meta">Current FLIQ size format</span></div>
          <div class="size-options" role="group" aria-label="Select size">${sizeButtons}</div>
          <p class="sizing-advice">Sizing advice: this prototype uses a relaxed / oversized streetwear fit. Choose your usual size unless the final store measurements say otherwise.</p>
        </div>

        <div class="quantity-label"><span>Quantity</span><div class="detail-quantity-stepper" role="group" aria-label="Product quantity"><button type="button" data-page-qty="-1" aria-label="Decrease quantity" disabled>−</button><span id="page-qty-value" class="detail-quantity-value" aria-live="polite">1</span><button type="button" data-page-qty="1" aria-label="Increase quantity">+</button></div></div>
        <div class="detail-actions"><button type="button" class="solid-button" data-page-add disabled>Choose colour & size</button><button type="button" class="outline-button" data-page-wish aria-label="Save ${esc(p.name)} to wishlist">${heart}</button></div>
        <button type="button" class="text-button" data-shop="cart">View cart →</button>
        <p class="product-inline-status" role="status"></p>

        <div class="delivery-check">
          <h3>Delivery</h3>
          <form class="delivery-form" data-delivery-form novalidate><input type="text" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="Enter 6-digit PIN code" aria-label="Delivery PIN code"><button type="submit">Check</button></form>
          <p class="delivery-result" data-delivery-result>Check a PIN code for a prototype delivery estimate.</p>
        </div>

        <div class="product-assurance" aria-label="Purchase information">
          <div class="assurance-row"><span class="assurance-mark">↗</span><span><strong>Delivery information</strong><span>Prototype timing is shown after a valid PIN check.</span></span></div>
          <div class="assurance-row"><span class="assurance-mark">↺</span><span><strong>All sales final</strong><span>No returns or exchanges. Online payment only.</span></span></div>
          <div class="assurance-row"><span class="assurance-mark">✓</span><span><strong>Secure checkout ready</strong><span>Razorpay TEST checkout. No real money is charged.</span></span></div>
        </div>
        <p class="prototype-note product-page-note">Demo only. Products, colours, ratings, delivery estimates and policies shown here are prototype content until confirmed by FLIQ.</p>
      </div></div>
    </section>

    <section class="product-info" aria-label="Product information">
      <article class="info-block" id="description">
        <div class="info-kicker"><span class="meta">01 / Product</span><h2 class="display">Description<span class="accent">.</span></h2></div>
        <div class="info-content"><p>${esc(p.description)}</p><dl class="detail-list"><div><dt>Material</dt><dd>${esc(p.material)}</dd></div><div><dt>Fit</dt><dd>${esc(p.attributes?.fit||'Unisex / relaxed')}</dd></div><div><dt>Construction</dt><dd>${esc(p.attributes?.fabric||detail.construction)}</dd></div><div><dt>Style</dt><dd>${esc(p.attributes?.pattern||detail.pattern)}</dd></div><div><dt>Care</dt><dd>${esc(detail.care)}</dd></div><div><dt>Product code</dt><dd>${esc(p.sku||p.id.toUpperCase())}</dd></div></dl></div>
      </article>

      <article class="info-block" id="shipping-returns">
        <div class="info-kicker"><span class="meta">02 / Service</span><h2 class="display">Shipping & policies<span class="accent">.</span></h2></div>
        <div class="info-content"><div class="shipping-grid"><div class="shipping-card"><h3>Shipment</h3><ul><li>Enter a 6-digit PIN above to preview delivery availability.</li><li>Prototype estimate: 2–5 working days after dispatch for supported Indian PIN codes.</li><li>Online payment only. Cash on delivery is not available. Final shipping terms require store approval.</li></ul></div><div class="shipping-card"><h3>All sales final</h3><ul><li>No returns or exchanges.</li><li>Online payment only. No cash on delivery.</li><li>Contact the store for exceptional payment, dispute or legally required resolutions.</li></ul><a href="/policies.html">Read store policies ↗</a></div></div><p class="shipping-disclaimer"><strong>Prototype disclaimer:</strong> The store intends all sales to be final with no returns or exchanges. Prototype delivery estimates must be replaced with confirmed courier details. Exceptional operational and legally required resolutions remain available.</p></div>
      </article>

      <article class="info-block" id="reviews">
        <div class="info-kicker"><span class="meta">03 / Community</span><h2 class="display">Reviews<span class="accent">.</span></h2></div>
        <div class="info-content"><div class="reviews-summary"><div><div class="review-score">4.8<small>/5</small></div><span class="meta">Prototype rating preview</span></div><div class="review-bars"><div class="review-bar"><span>5 ★</span><div class="review-bar-track"><span style="--rating-width:88%"></span></div><span>88%</span></div><div class="review-bar"><span>4 ★</span><div class="review-bar-track"><span style="--rating-width:9%"></span></div><span>9%</span></div><div class="review-bar"><span>3 ★</span><div class="review-bar-track"><span style="--rating-width:3%"></span></div><span>3%</span></div><div class="review-bar"><span>2 ★</span><div class="review-bar-track"><span style="--rating-width:0%"></span></div><span>0%</span></div><div class="review-bar"><span>1 ★</span><div class="review-bar-track"><span style="--rating-width:0%"></span></div><span>0%</span></div></div></div><div class="review-list"><article class="review-card"><div><span class="meta">Sample review / 01</span><div class="review-card-stars">★★★★★</div><span class="meta">Demo customer · Verified-style preview</span></div><div><h3>Strong silhouette.</h3><p>The oversized proportions and heavier fabric make the piece feel structured without losing the relaxed streetwear shape. This is sample copy for the prototype review layout, not a real customer testimonial.</p></div></article><article class="review-card"><div><span class="meta">Sample review / 02</span><div class="review-card-stars">★★★★★</div><span class="meta">Demo customer · Verified-style preview</span></div><div><h3>Easy rotation piece.</h3><p>The layout demonstrates how real buyer feedback can appear once a review system is connected. This text is intentionally marked as prototype content.</p></div></article></div></div>
      </article>

      <article class="info-block" id="questions">
        <div class="info-kicker"><span class="meta">04 / Help</span><h2 class="display">Questions<span class="accent">.</span></h2></div>
        <div class="info-content"><div class="product-qa"><div class="qa-item"><strong>Is the fit oversized?</strong><p>The prototype is presented as a relaxed / oversized unisex fit. Final garment measurements should be added when inventory data is available.</p></div><div class="qa-item"><strong>Can I check delivery before adding to cart?</strong><p>Yes. Use the PIN-code checker in the purchase panel for a demo availability response.</p></div><div class="qa-item"><strong>Are the colours confirmed stock?</strong><p>No. Colour variants shown here demonstrate the selector and purchasing framework and need to be mapped to real stock before launch.</p></div></div></div>
      </article>
    </section>

    <section class="recommendations">
      <div class="recommendations-head"><div><p class="meta accent">More from FLIQ</p><h2 class="display">You will also like<span class="accent">.</span></h2></div><span class="meta">Related pieces from the current collection</span></div>
      <div class="recommendation-grid">${recCards}</div>
    </section>

    <div class="mobile-buy-bar" aria-label="Mobile purchase bar"><span class="mobile-buy-price">${money(p.price)}</span><button type="button" data-mobile-add disabled>Choose colour & size</button></div>`;

  let selectedSize=p.sizes.length===1&&p.stock?.[p.sizes[0]]!==0?p.sizes[0]:'';
  let selectedColor='';
  let qty=1;
  const status=root.querySelector('.product-inline-status');
  const add=root.querySelector('[data-page-add]');
  const mobileAdd=root.querySelector('[data-mobile-add]');
  const wish=root.querySelector('[data-page-wish]');
  const colorLabel=root.querySelector('[data-selected-color]');

  const purchaseLabel=()=>{
    if(p.sizes.every(s=>p.stock?.[s]===0))return 'Sold out';
    if(selectedSize&&selectedColor&&selectedStock()<qty)return 'Quantity exceeds stock';
    if(!selectedColor&&!selectedSize)return 'Choose colour & size';
    if(!selectedColor)return 'Choose a colour';
    if(!selectedSize)return 'Choose a size';
    return `Add to cart — ${money(p.price*qty)}`;
  };
  const selectedStock=()=>p.variants?.find(v=>v.size===selectedSize&&v.color===selectedColor)?.quantity??0;
  const updatePurchase=()=>{
    root.querySelectorAll('[data-page-size]').forEach(b=>{const q=selectedColor?(p.variants?.find(v=>v.size===b.dataset.pageSize&&v.color===selectedColor)?.quantity||0):p.stock?.[b.dataset.pageSize];b.disabled=!q;});
    const ready=Boolean(selectedColor&&selectedSize&&selectedStock()>=qty);
    const label=purchaseLabel();
    add.disabled=!ready; add.textContent=label;
    mobileAdd.disabled=!ready; mobileAdd.textContent=ready?'Add to cart':label;
  };
  const updateWish=()=>{const saved=store.state.wishlist.includes(p.id);wish.setAttribute('aria-pressed',String(saved));wish.classList.toggle('selected',saved);wish.setAttribute('aria-label',`${saved?'Remove':'Save'} ${p.name} ${saved?'from':'to'} wishlist`);};
  const addToCart=()=>{
    if(!selectedColor||!selectedSize)return;
    if(!store.add(p.id,selectedSize,qty,selectedColor)){status.textContent='This size is sold out or your cart exceeds available stock.';return;}
    status.textContent=`Added ${qty} × ${p.name} / ${selectedColor} / ${selectedSize} to cart.`;
    add.textContent='Added ✓ · Add another';
    mobileAdd.textContent='Added ✓';
    window.dispatchEvent(new Event('fliq-store-change'));
    setTimeout(updatePurchase,1200);
  };

  if(selectedSize){const btn=root.querySelector(`[data-page-size="${CSS.escape(selectedSize)}"]`);if(btn){btn.classList.add('selected');btn.setAttribute('aria-pressed','true');}}
  updatePurchase(); updateWish();

  root.addEventListener('click',e=>{
    const back=e.target.closest('[data-product-back]');
    if(back){
      let canGoBack=false;
      try{canGoBack=Boolean(document.referrer&&new URL(document.referrer).origin===location.origin);}catch{}
      if(canGoBack&&history.length>1)history.back();else location.href='collections.html';
      return;
    }
    const color=e.target.closest('[data-page-color]');
    if(color){selectedColor=color.dataset.pageColor;root.querySelectorAll('[data-page-color]').forEach(b=>{const on=b===color;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});colorLabel.textContent=selectedColor;updatePurchase();return;}
    const size=e.target.closest('[data-page-size]');
    if(size&&!size.disabled){selectedSize=size.dataset.pageSize;root.querySelectorAll('[data-page-size]').forEach(b=>{const on=b===size;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});updatePurchase();return;}
    const q=e.target.closest('[data-page-qty]');
    if(q){qty=Math.max(1,Math.min(10,qty+Number(q.dataset.pageQty)));root.querySelector('#page-qty-value').textContent=String(qty);root.querySelector('[data-page-qty="-1"]').disabled=qty<=1;root.querySelector('[data-page-qty="1"]').disabled=qty>=10;updatePurchase();return;}
    if(e.target.closest('[data-page-add]')||e.target.closest('[data-mobile-add]')){addToCart();return;}
    if(e.target.closest('[data-page-wish]')){store.toggleWish(p.id);updateWish();status.textContent=store.state.wishlist.includes(p.id)?'Saved to your wishlist.':'Removed from your wishlist.';window.dispatchEvent(new Event('fliq-store-change'));}
  });

  const deliveryForm=root.querySelector('[data-delivery-form]');
  deliveryForm.addEventListener('submit',e=>{
    e.preventDefault();
    const input=deliveryForm.querySelector('input');
    const result=root.querySelector('[data-delivery-result]');
    const pin=input.value.trim();
    if(!/^\d{6}$/.test(pin)){result.textContent='Enter a valid 6-digit Indian PIN code.';input.focus();return;}
    result.textContent=`PIN ${pin}: prototype delivery available · estimated 2–5 working days after dispatch. Online payment only. Final courier timing requires live logistics data.`;
  });
})();
