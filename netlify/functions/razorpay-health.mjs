export default async () => {
  const key = process.env.RAZORPAY_KEY_ID || 'rzp_test_ThRmg1xY8t79Qg';
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return new Response(JSON.stringify({
    ok: Boolean(key && secret),
    mode: key.startsWith('rzp_test_') ? 'test' : 'unknown',
    keyConfigured: Boolean(key),
    secretConfigured: Boolean(secret)
  }), {
    status: key && secret ? 200 : 503,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
};
