#!/usr/bin/env bash
set -euo pipefail

BASE="https://poetic-tartufo-ca76cb.netlify.app"
rm -rf .site
mkdir -p .site/css .site/js .site/img

fetch_required() {
  local remote="$1"
  local out="$2"
  echo "Fetching $remote -> $out"
  curl --retry 4 --retry-delay 1 -fsSL "$BASE/$remote" -o ".site/$out"
}

PAGES=(
  index.html about.html admin.html checkout.html collections.html contact.html policies.html product.html
)
for file in "${PAGES[@]}"; do
  fetch_required "$file" "$file"
done

CORE_FILES=(
  css/admin.css css/commerce.css css/experience.css css/hero.css css/product.css css/refinement.css css/styles.css
  js/admin-operations.js js/admin.js js/bootstrap.js js/catalog.js js/checkout.js js/live-catalog.js js/local-demo-api.js js/main.js js/product-page.js js/shop.js js/store.js
)
for file in "${CORE_FILES[@]}"; do
  fetch_required "$file" "$file"
done

OPTIONAL_FILES=(
  import-template.csv
  img/about.webp img/hero.webp img/look-1.webp img/look-2.webp img/look-3.webp
  img/p-cap.webp img/p-cargo.webp img/p-hoodie.webp img/p-jacket.webp img/p-jeans.webp img/p-joggers.webp img/p-shirt.webp img/p-tee-acid.webp img/p-tee-black.webp img/p-tote.webp
  img/statement-bg-v2.webp img/statement-crosswalk.webp
)
for file in "${OPTIONAL_FILES[@]}"; do
  echo "Fetching optional $file"
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
