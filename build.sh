#!/usr/bin/env bash
set -euo pipefail

BASE="https://fliqclothing.netlify.app"
rm -rf .site
mkdir -p .site/css .site/js .site/img

fetch_required() {
  local url="$1"
  local out="$2"
  echo "Fetching $url -> $out"
  curl --retry 3 --retry-delay 1 -fsSL "$BASE$url" -o ".site/$out"
}

# Fetch pages through the routes that are known to work on the live demo.
fetch_required "/" "index.html"
fetch_required "/about" "about.html"
fetch_required "/admin" "admin.html"
fetch_required "/checkout" "checkout.html"
fetch_required "/collections" "collections.html"
fetch_required "/contact" "contact.html"
fetch_required "/policies" "policies.html"
fetch_required "/product" "product.html"

CORE_FILES=(
  css/admin.css css/commerce.css css/experience.css css/hero.css css/product.css css/refinement.css css/styles.css
  js/admin-operations.js js/admin.js js/bootstrap.js js/catalog.js js/checkout.js js/live-catalog.js js/local-demo-api.js js/main.js js/product-page.js js/shop.js js/store.js
)

for file in "${CORE_FILES[@]}"; do
  fetch_required "/$file" "$file"
done

# Optional demo assets should never make the whole Netlify build fail.
OPTIONAL_FILES=(
  import-template.csv
  img/about.webp img/hero.webp img/look-1.webp img/look-2.webp img/look-3.webp
  img/p-cap.webp img/p-cargo.webp img/p-hoodie.webp img/p-jacket.webp img/p-jeans.webp img/p-joggers.webp img/p-shirt.webp img/p-tee-acid.webp img/p-tee-black.webp img/p-tote.webp
  img/statement-bg-v2.webp img/statement-crosswalk.webp
)

for file in "${OPTIONAL_FILES[@]}"; do
  echo "Fetching optional /$file"
  curl --retry 2 --retry-delay 1 -fsSL "$BASE/$file" -o ".site/$file" || {
    echo "Warning: optional asset missing: $file"
    rm -f ".site/$file"
  }
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

cat > .site/_headers <<'EOF'
/*.html
  Cache-Control: no-cache, no-store, must-revalidate
/js/*
  Cache-Control: no-cache
EOF

echo "FLIQ site prepared for Netlify Git deploy."
