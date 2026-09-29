import {access} from 'node:fs/promises';
import './check.mjs';
for(const route of ['index','admin','checkout','product','collections','track','about','contact','policies'])await access('public/'+route+'.html');
for(const f of ['api','razorpay-create-order','razorpay-verify-payment'])await access('netlify/functions/'+f+'.mjs');
console.log('FLIQ production build validated. Publish public/; deploy netlify/functions/ with dependencies.');
