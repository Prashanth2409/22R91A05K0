const TEST_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_ThRmg1xY8t79Qg';

const reply = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

export default async (request) => {
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return reply({ error: 'Razorpay test secret is not configured in Netlify Environment Variables.' }, 503);

  try {
    const body = await request.json();
    const amount = Math.round(Number(body.amount));
    if (!Number.isInteger(amount) || amount < 100) return reply({ error: 'Invalid payment amount.' }, 400);

    const receipt = String(body.receipt || `fliq_${Date.now()}`).slice(0, 40);
    const notes = Object.fromEntries(Object.entries(body.notes || {}).slice(0, 15).map(([k, v]) => [String(k).slice(0, 256), String(v).slice(0, 256)]));
    const auth = Buffer.from(`${TEST_KEY_ID}:${secret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt, notes })
    });
    const data = await response.json();
    if (!response.ok) return reply({ error: data?.error?.description || 'Razorpay could not create a test order.' }, response.status);

    return reply({ id: data.id, amount: data.amount, currency: data.currency, keyId: TEST_KEY_ID });
  } catch (error) {
    return reply({ error: error?.message || 'Could not create Razorpay order.' }, 500);
  }
};
