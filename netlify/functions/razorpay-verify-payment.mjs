import api from './api.mjs';
export default request=>api(new Request(new URL('/api/checkout/verify',request.url),request));
