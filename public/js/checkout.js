(async function(){
  const root=document.getElementById('checkout-root'),products=window.FliqCatalog.products,byId=new Map(products.map(p=>[p.id,p]));
  const store=window.FliqStore.createStore(products,localStorage),money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let busy=false,shippingFee=0,attempt=null;
  let requestId=crypto.randomUUID();
  const recoveryKey='fliq-checkout-recovery-v2';
  try{sessionStorage.removeItem('fliq-checkout-recovery');}catch{}
  try{attempt=JSON.parse(sessionStorage.getItem(recoveryKey)||'null');}catch{}
  const clearRecovery=()=>{attempt=null;requestId=crypto.randomUUID();try{sessionStorage.removeItem(recoveryKey);}catch{}};
  const api=async(path,body)=>{const r=await fetch('/api/'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'Request failed');return data;};
  const razorpayApi=async(path,body)=>{const r=await fetch('/__fliq/razorpay/'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'});let data={};try{data=await r.json();}catch{}if(!r.ok)throw Error(data.error||('Razorpay '+path+' failed'));return data;};
  try{const r=await fetch('/api/store-settings',{cache:'no-store'});if(r.ok){const s=await r.json();shippingFee=Number(s?.shipping?.flatFee||0);}}catch{}
  function finish(order){
    clearRecovery();
    if(order.refund_required){root.innerHTML='<h1 class="display">PAYMENT RECEIVED.</h1><p>Your payment needs an owner review because stock changed. Do not pay again.</p><p>'+esc(order.id)+'</p>';return;}
    store.clearCart();window.dispatchEvent(new Event('fliq-store-change'));
    const itemRows=(order.items||[]).map(x=>`<div class="confirmation-item"><img src="${esc(x.image||'')}" alt=""><div><strong>${esc(x.name)}</strong><span>${esc(x.color||'Default')} / ${esc(x.size)} / QTY ${x.quantity}</span></div><b>${money(x.price*x.quantity/100)}</b></div>`).join('');
    root.innerHTML=`<section class="order-confirmation"><p class="meta accent">FLIQ / ORDER CONFIRMED</p><h1 class="display confirmation-hero">ORDER CONFIRMED.<br><span class="accent">WE’RE GETTING STREET-READY FOR YOU.</span></h1><div class="confirmation-grid"><div><div class="confirmation-card"><span class="meta">ORDER ID · ${new Date(order.created_at).toLocaleString('en-IN')}</span><h2>${esc(order.id)}</h2><div class="confirmation-status"><span>PAID</span><span>${esc(order.status)}</span></div></div><div class="confirmation-card"><span class="meta">YOUR DROP</span>${itemRows}<div class="confirmation-total"><span>Subtotal ${money(order.subtotal/100)}<br>Shipping ${money(order.shipping/100)}<br>TOTAL PAID</span><strong>${money(order.amount/100)}</strong></div></div></div><aside><div class="confirmation-card"><span class="meta">DELIVERY</span><h3>${esc(order.expected_delivery||'3–5 business days')}</h3><p>${esc(order.customer?.name||'')}<br>${esc(order.customer?.phone||'')}<br>${esc(order.customer?.email||'')}<br>${esc(order.customer?.address||'')}<br>${esc(order.customer?.city||'')}, ${esc(order.customer?.state||'')} ${esc(order.customer?.pin||'')}</p></div><div class="confirmation-actions"><a class="solid-button" href="/track?id=${encodeURIComponent(order.id)}#token=${encodeURIComponent(order.tracking_token)}">TRACK ORDER ↗</a><a class="outline-button" href="/collections">CONTINUE SHOPPING</a></div><p class="meta confirmation-note">Razorpay TEST payment verified. No real money was charged in TEST mode.</p></aside></div></section>`;
  }
  if(attempt){try{const recovered=await api('checkout/recover',attempt);if(recovered.order){finish(recovered.order);return;}}catch{}}
  const items=store.state.cart;
  if(!items.length&&attempt){root.innerHTML='<h1 class="display">CHECK YOUR PAYMENT.</h1><p role="status">Your previous checkout is saved. Check its status before placing another order.</p><button class="solid-button" id="recover-empty">CHECK PAYMENT / RECOVER ORDER</button>';root.querySelector('#recover-empty').onclick=async()=>{const status=root.querySelector('[role=status]');try{const result=await api('checkout/recover',attempt);if(result.order)finish(result.order);else status.textContent='No captured payment found yet ('+result.state+'). Contact the store if payment was debited. Reference: '+attempt.id;}catch(e){status.textContent=e.message+' Your checkout reference is '+attempt.id+'. Do not pay again.';}};return;}
  if(!items.length){root.innerHTML='<p class="meta accent">FLIQ / Checkout</p><h1 class="display">Your rotation<br>is empty.</h1><a class="solid-button" href="/collections">Explore collections ↗</a>';return;}
  const calculatedAmount=()=>items.reduce((sum,x)=>{const p=byId.get(x.id);return sum+Math.round(Number(p.price)*100)*Number(x.quantity||1);},0)+Math.round(shippingFee*100);
  root.innerHTML=`<p class="meta accent">FLIQ / RAZORPAY TEST CHECKOUT</p><h1 class="display">ONE LAST STEP<span class="accent">.</span></h1><div class="checkout-columns"><section><h2 class="display">01 / YOUR DETAILS</h2><form id="payment-form" class="checkout-fields" autocomplete="off"><label class="wide">Full name<input name="name" maxlength="150" required autocomplete="off"></label><label>Email<input name="email" type="email" maxlength="200" required autocomplete="off"></label><label>Phone<input name="phone" type="tel" pattern="[+0-9 -]{10,16}" maxlength="16" required autocomplete="off"></label><label class="wide">Street address<input name="address" maxlength="400" required autocomplete="off"></label><label>City<input name="city" maxlength="100" required autocomplete="off"></label><label>State<input name="state" maxlength="100" required autocomplete="off"></label><label>PIN code<input name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="off"></label><p class="wide checkout-mode"><strong>RAZORPAY TEST MODE</strong> · Test card/UPI only; no real money is charged.<br>Order and stock are updated only after Razorpay verifies the test payment.</p><label class="wide"><span><input type="checkbox" name="whatsappConsent"> Send order updates and opted-in drop announcements through WhatsApp. Optional; untick to decline.</span></label><label class="wide"><span><input type="checkbox" name="restockConsent"> Include restock alerts when I opt into WhatsApp.</span></label><button id="razorpay-pay" class="solid-button full-width" type="button">Pay securely with Razorpay Test ↗</button></form><p class="checkout-status" role="status" aria-live="polite"></p><button type="button" id="recover-payment" class="outline-button">CHECK PAYMENT / RECOVER ORDER</button></section><aside class="checkout-summary-box"><p class="meta accent">02 / YOUR ROTATION</p><h2 class="display">THE GOOD STUFF.</h2>${items.map(x=>{const p=byId.get(x.id);return `<div class="checkout-row"><img src="${esc(p.image)}" alt="${esc(p.name)}"><div>${esc(p.name)}<small>${esc(x.size)} / ${esc(x.color||'')} / QTY ${x.quantity}</small></div><span>${money(p.price*x.quantity)}</span></div>`;}).join('')}<div class="checkout-total"><span>Total</span><strong>${money(calculatedAmount()/100)}</strong></div><p class="checkout-mode">INR · Shipping ${money(shippingFee)}<br>Stock is deducted only after Razorpay test payment is verified.</p></aside></div>`;
  const form=root.querySelector('#payment-form'),button=root.querySelector('#razorpay-pay'),status=root.querySelector('[role=status]');
  const say=msg=>status.textContent=msg;
  form.addEventListener('submit',e=>e.preventDefault());
  if(attempt){try{const saved=await api('checkout/recover',attempt);if(saved.customer)for(const [name,value] of Object.entries(saved.customer)){const field=form.elements[name];if(field){if(field.type==='checkbox')field.checked=Boolean(value);else field.value=value;field.disabled=true;}}}catch{say('Your previous checkout must be checked before another payment.');}}
  root.querySelector('#recover-payment').onclick=async()=>{if(!attempt){say('No checkout to recover in this tab.');return;}try{say('Checking captured payment…');const result=await api('checkout/recover',attempt);if(result.order)finish(result.order);else say('No captured payment yet. Your checkout is '+result.state+'.');}catch(e){say(e.message+' Your payment can still be recovered; do not pay again.');}};
  let razorpayLoadPromise;
  const loadRazorpay=()=>razorpayLoadPromise||(razorpayLoadPromise=new Promise((resolve,reject)=>{if(typeof window.Razorpay==='function')return resolve();const timeout=setTimeout(()=>{razorpayLoadPromise=null;reject(Error('Razorpay Checkout timed out. Check your connection and retry.'));},15000);const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.async=true;s.onload=()=>{clearTimeout(timeout);if(typeof window.Razorpay==='function')resolve();else{razorpayLoadPromise=null;reject(Error('Razorpay Checkout script loaded but did not initialize.'));}};s.onerror=()=>{clearTimeout(timeout);razorpayLoadPromise=null;reject(Error('Could not load Razorpay Checkout. Turn off browser Shields/ad-blocking for this store and reload.'));};document.head.appendChild(s);}));
  loadRazorpay().then(()=>say('Razorpay Checkout SDK ready. Fill your details and click Pay.')).catch(err=>say(err.message));

  button.addEventListener('click',async()=>{
    if(busy)return;
    if(!form.reportValidity())return;
    busy=true;button.disabled=true;
    try{
      const customer=Object.fromEntries(new FormData(form));customer.whatsappConsent=form.elements.whatsappConsent.checked;customer.restockConsent=form.elements.restockConsent.checked;
      if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
      say('Creating Razorpay TEST order…');
      await loadRazorpay();
      let rpOrder;
      if(attempt){
        const prior=await api('checkout/recover',attempt);
        if(prior.order){finish(prior.order);return;}
        if(!prior.checkout)throw Error('This checkout expired or needs owner review. Do not pay again if payment was debited. Reference: '+attempt.id);
        rpOrder=prior.checkout;Object.assign(customer,prior.customer);
      }else rpOrder=await razorpayApi('create-order',{items,customer,requestId});
      attempt={id:rpOrder.id,token:rpOrder.token};
      try{sessionStorage.setItem(recoveryKey,JSON.stringify(attempt));}catch{throw Error('Enable session storage before paying so your order can be recovered. No payment has been started.');}
      if(!rpOrder?.orderId||!rpOrder?.keyId)throw Error('Razorpay TEST order creation returned an invalid response.');
      const razorpay=new window.Razorpay({
        key:rpOrder.keyId,amount:rpOrder.amount,currency:rpOrder.currency||'INR',name:'FLIQ UNISEX CLOTHING',description:'FLIQ TEST checkout',order_id:rpOrder.orderId,
        prefill:{name:customer.name,email:customer.email,contact:customer.phone},
        theme:{},
        modal:{ondismiss:()=>{busy=false;button.disabled=false;say('Checkout closed. If payment completed, use Check payment before retrying.');api('checkout/failure',{...attempt,event:'closed'}).catch(()=>{});}},
        handler:async response=>{
          try{
            say('Verifying Razorpay TEST payment…');
            const verified=await razorpayApi('verify-payment',{...response,...attempt});
            if(!verified?.verified||!verified.order)throw Error('Payment is awaiting confirmation. Do not pay again. Use Check payment.');
            finish(verified.order);
          }catch(err){busy=false;button.disabled=false;say(err.message||String(err));}
        }
      });
      razorpay.on('payment.failed',response=>{busy=false;button.disabled=false;say(response?.error?.description||'Razorpay test payment failed. Try again.');api('checkout/failure',{...attempt,event:'failed'}).catch(()=>{});});
      say('Opening Razorpay TEST Checkout…');
      razorpay.open();
      setTimeout(()=>{if(busy&&!document.querySelector('iframe[src*="razorpay"], .razorpay-container'))say('Razorpay was asked to open but the browser blocked the checkout window. Disable Shields/ad-blocking for this store and retry.');},2500);
    }catch(err){busy=false;button.disabled=false;say(err.message||String(err));}
  });
})();
