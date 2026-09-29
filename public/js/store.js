/* Small, dependency-free state model; also exercised by Node's built-in tests. */
(function (root) {
  'use strict';
  function createStore(products,storage) {
    const key='fliq-shop-v1', byId=new Map(products.map(p=>[p.id,p]));
    let state={wishlist:[],cart:[]}, persistent=true;
    const quantity=n=>Math.max(1,Math.min(10,Math.floor(Number(n)||1)));
    const colorValue=value=>typeof value==='string'?value.trim():'';
    function normalize(data) {
      const clean={wishlist:[],cart:[]};
      if (!data || typeof data!=='object') return clean;
      clean.wishlist=[...new Set(Array.isArray(data.wishlist)?data.wishlist.filter(id=>byId.has(id)):[])];
      for (const item of Array.isArray(data.cart)?data.cart:[]) {
        if (!item || !byId.get(item.id)?.sizes.includes(item.size)) continue;
        const color=colorValue(item.color);
        const existing=clean.cart.find(x=>x.id===item.id&&x.size===item.size&&x.color===color);
        if (existing) existing.quantity=quantity(existing.quantity+quantity(item.quantity));
        else clean.cart.push({id:item.id,size:item.size,color,quantity:quantity(item.quantity)});
      }
      return clean;
    }
    try { state=normalize(JSON.parse(storage.getItem(key))); } catch { /* corrupt or unavailable storage starts clean */ }
    function save() { try {storage.setItem(key,JSON.stringify(state));} catch {persistent=false;} }
    return {
      get state(){return JSON.parse(JSON.stringify(state));}, get persistent(){return persistent;},
      toggleWish(id){if(!byId.has(id))return;state.wishlist=state.wishlist.includes(id)?state.wishlist.filter(x=>x!==id):[...state.wishlist,id];save();},
      add(id,size,n=1,color=''){if(!byId.get(id)?.sizes.includes(size))return false;const product=byId.get(id);if(product.variants&&!product.variants.some(v=>v.size===size&&v.color===colorValue(color)))return false;const total=state.cart.filter(x=>x.id===id&&x.size===size&&x.color===colorValue(color)).reduce((sum,x)=>sum+x.quantity,0);if(product.stock&&total+quantity(n)>(product.variants?.find(v=>v.size===size&&v.color===colorValue(color))?.quantity??product.stock[size]))return false;const variant=colorValue(color);const row=state.cart.find(x=>x.id===id&&x.size===size&&x.color===variant);if(row)row.quantity=quantity(row.quantity+quantity(n));else state.cart.push({id,size,color:variant,quantity:quantity(n)});save();return true;},
      setQuantity(id,size,n,color=''){const variant=colorValue(color);const row=state.cart.find(x=>x.id===id&&x.size===size&&x.color===variant);if(row){const product=byId.get(id), other=state.cart.filter(x=>x.id===id&&x.size===size&&x.color===variant&&x!==row).reduce((sum,x)=>sum+x.quantity,0);if(product.stock&&other+quantity(n)>(product.variants?.find(v=>v.size===size&&v.color===colorValue(color))?.quantity??product.stock[size]))return false;row.quantity=quantity(n);save();return true;}},
      remove(id,size,color=''){const variant=colorValue(color);state.cart=state.cart.filter(x=>!(x.id===id&&x.size===size&&x.color===variant));save();},
      subtotal(){return state.cart.reduce((sum,x)=>sum+byId.get(x.id).price*x.quantity,0);},
      count(){return state.cart.reduce((sum,x)=>sum+x.quantity,0);},
      reload(){try {state=normalize(JSON.parse(storage.getItem(key)));}catch{}},
      clearCart(){state.cart=[];save();}
    };
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createStore};
  else root.FliqStore={createStore};
})(typeof window!=='undefined'?window:globalThis);
