import {id,now,fail,audit} from './model.mjs';
export const shippingFlow={Packed:['Ready'],Ready:['Pickup'],Pickup:['In Transit'],'In Transit':['OFD','NDR'],OFD:['Delivered','NDR'],NDR:['In Transit','OFD','RTO'],Delivered:[],RTO:[]};
export function mockShiprocket(){return {name:'MOCK_SHIPROCKET',create(order){const ref=id('shipment'),date=new Date(Date.now()+5*86400000).toISOString().slice(0,10);return {id:ref,provider:'MOCK_SHIPROCKET',awb:'MOCK'+ref.replace(/\D/g,'').padEnd(12,'0').slice(0,12),courier:'FLIQ Mock Express',eta:date,status:'Packed',mock:true,events:[{status:'Packed',at:now(),note:'Simulation: shipment packed.'}]};},advance(shipment,status,note){if(!shippingFlow[shipment.status]?.includes(status))fail('Invalid shipping transition.',409);return {...shipment,status,events:[{status,at:now(),note},...shipment.events]};}};}
// Real adapter must implement create(order) and advance(shipment,status,note).
// Unsupported provider fails closed; never silently simulates a live shipment.
export function shippingProvider(env={},adapters={}){const name=env.SHIPPING_PROVIDER||'MOCK_SHIPROCKET';const provider=adapters[name]||(name==='MOCK_SHIPROCKET'?mockShiprocket():null);if(!provider)fail('Shipping provider is not configured.',503);return provider;}
export async function updateShipment(d,order,input,user,env){
 if(order.payment_status!=='paid'||order.refund_required||['Cancelled','Delivered'].includes(order.status))fail('Shipment requires a paid, fulfillable order.',409);
 const provider=shippingProvider(env);
 if(!order.shipment){if(!['Processing','Packed'].includes(order.status))fail('Process the order before creating a shipment.',409);order.shipment=await provider.create(order);}
 else if(input.status){if(order.shipment.provider!==provider.name)fail('Use the provider that created this shipment.',409);const note=String(input.note||'').trim().slice(0,500);if(['NDR','RTO'].includes(input.status)&&!note)fail('Add a reason for NDR or RTO.');order.shipment=await provider.advance(order.shipment,input.status,note||'Simulation: '+input.status);}
 order.status=order.shipment.status;order.courier=order.shipment.courier;order.tracking_id=order.shipment.awb;order.expected_delivery=order.shipment.eta;order.updated_at=now();
 if(['Pickup','In Transit','OFD','Delivered','NDR','RTO'].includes(order.status))order.dispatch_date ||= now().slice(0,10);
 order.history.unshift({status:order.status,event:'shipping.updated',note:order.shipment.events[0].note,actor:user.email,created_at:now()});audit(d,user.email,'shipping.updated',order.id);if(order.customer.whatsappConsent)d.whatsappLogs.unshift({id:id('wa'),type:'order-status',orderId:order.id,statusValue:order.status,phone:order.customer.phone,status:'pending',created_at:now()});return order;
}
