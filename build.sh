#!/usr/bin/env bash
set -euo pipefail

rm -rf .site /tmp/fliq-site.zip
mkdir -p .site

cat \
  bundle.parts/c00 \
  bundle.parts/c01 \
  bundle.parts/c02 \
  bundle.parts/c03 \
  bundle.parts/c04 \
  bundle.parts/c05 \
  bundle.parts/c06 \
  bundle.parts/c07 \
  bundle.parts/c08 \
  bundle.parts/c09 \
  bundle.parts/c10 \
  | base64 -d > /tmp/fliq-site.zip

unzip -q /tmp/fliq-site.zip -d .site

test -f .site/index.html
test -f .site/admin.html
test -f .site/checkout.html
test -f .site/netlify/functions/razorpay-create-order.mjs
test -f .site/netlify/functions/razorpay-verify-payment.mjs

echo "FLIQ bundle extracted successfully."
