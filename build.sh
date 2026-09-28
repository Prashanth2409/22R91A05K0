#!/usr/bin/env bash
set -euo pipefail

BASE="https://fliqclothing.netlify.app"
rm -rf .site
mkdir -p .site/css .site/js .site/img

FILES=(
  index.html about.html admin.html checkout.html collections.html contact.html policies.html product.html import-template.csv
  css/admin.css css/commerce.css css/experience.css css/hero.css css/product.css css/refinement.css css/styles.css
  js/admin-operations.js js/admin.js js/bootstrap.js js/catalog.js js/checkout.js js/live-catalog.js js/local-demo-api.js js/main.js js/product-page.js js/shop.js js/store.js
  img/about.jpg img/hero.jpg img/look-1.jpg img/look-2.jpg img/look-3.jpg img/p-cap.jpg img/p-cargo.jpg img/p-hoodie.jpg img/p-jacket.jpg img/p-jeans.jpg img/p-joggers.jpg img/p-shirt.jpg img/p-tee-acid.jpg img/p-tee-black.jpg img/p-tote.jpg img/statement-bg-v2.png img/statement-crosswalk.png
)

for file in "${FILES[@]}"; do
  echo "Fetching $file"
  curl --retry 3 --retry-delay 1 -fsSL "$BASE/$file" -o ".site/$file"
done

cat > .site/_redirects <<'EOF'
/admin /admin.html 200
/collections /collections.html 200
/product /product.html 200
/about /about.html 200
/contact /contact.html 200
/checkout /checkout.html 200
/policies /policies.html 200
EOF

# Prevent native form reload if payment preparation fails; checkout is handled entirely by JS.
sed -i 's/type="submit">Pay securely with Razorpay Test/type="button">Pay securely with Razorpay Test/' .site/js/checkout.js
sed -i "s/form.addEventListener('submit',async e=>{/button.addEventListener('click',async e=>{if(!form.reportValidity())return;/" .site/js/checkout.js

# Make stale browser caches less likely while testing.
cat > .site/_headers <<'EOF'
/*.html
  Cache-Control: no-cache, no-store, must-revalidate
/js/*
  Cache-Control: no-cache
EOF

echo "FLIQ site prepared for Netlify Git deploy."
