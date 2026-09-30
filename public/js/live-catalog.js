(function(){if('BroadcastChannel'in window){const c=new BroadcastChannel('fliq-catalog');c.onmessage=()=>{if(!document.hidden&&!document.getElementById('checkout-root'))location.reload();};}})();
