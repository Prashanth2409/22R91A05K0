import {build} from 'esbuild-wasm';
import {mkdir} from 'node:fs/promises';
await mkdir('.netlify/bundle-check',{recursive:true});
await build({entryPoints:['api','razorpay-create-order','razorpay-verify-payment','razorpay-health','message-worker'].map(n=>'netlify/functions/'+n+'.mjs'),outdir:'.netlify/bundle-check',bundle:true,outExtension:{'.js':'.mjs'},platform:'node',target:'node22',format:'esm',external:['pg-native'],banner:{js:"import {createRequire as fliqCreateRequire} from 'node:module'; const require = fliqCreateRequire(import.meta.url);"},logLevel:'warning'});
console.log('All five Netlify function entry points bundled successfully.');

const {default:handler}=await import('../.netlify/bundle-check/api.mjs');
globalThis.Netlify={env:{get:()=>undefined}};
const response=await handler(new Request('https://fliq.test/api/health'));
if(response.status!==503)throw Error('Unconfigured deployment must fail closed.');
console.log('Bundled API runtime smoke check passed.');
