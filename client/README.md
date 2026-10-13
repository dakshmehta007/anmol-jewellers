# Anmol Jewellers (MERN)

client/ is the React frontend (Vite). server/ (Express + MongoDB) comes next.

    cd client
    npm install
    npm run dev

## What to edit (all in client/src/data/)
- site.js: shop name, logo path, address, phone, email, GSTIN, hours, developer name, hero panels, showroom photos
- catalog.js: metals, jewellery types, designs. The top of the file explains how to add a new type or metal in one line.

## Images (put in client/public/images/)
- logo.png: your AJ logo (transparent PNG). Until it exists a monogram shows. If the logo is dark, set logoBadge: true in site.js.
- hero/, showroom/, products/gold/ring-1.jpg ... then reference as "/images/products/gold/ring-1.jpg"

Routes: /  /collection/:metal  /collection/:metal/:type  /login  /signup
