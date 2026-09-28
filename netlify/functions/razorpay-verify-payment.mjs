import { createHmac, timingSafeEqual } from 'node:crypto';

const reply = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

export default async (request) => {
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return reply({ error: 'Razorpay test secret is not configured in Netlify Environment Variables.' }, 503);

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(Boolean)) {
      return reply({ error: 'Incomplete Razorpay payment response.' }, 400);
    }

    const expected = createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    const supplied = String(razorpay_signature);
    const valid = expected.length === supplied.length && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
    if (!valid) return reply({ verified: false, error: 'Payment signature verification failed.' }, 400);

    return reply({ verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
  } catch (error) {
    return reply({ error: error?.message || 'Could not verify Razorpay payment.' }, 500);
  }
};
