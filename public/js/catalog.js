/* Concept catalog. No item is represented as confirmed FLIQ inventory. */
(function (root) {
  'use strict';
  const groups = [
    ['tees','T-Shirts','Heavy cotton. Easy rotation.','p-tee-black.jpg',1299,['001 Boxy Tee','001 Boxy Tee — Bone','Afterhours Tee','Offbeat Tee','Concrete Tee','Daily Uniform Tee','Citywide Tee']],
    ['shirts','Shirts','Loose cuts. No dress code.','p-shirt.jpg',1799,['Midnight Camp Shirt','Backstreet Shirt','Studio Shirt','Off-Duty Shirt','Late Shift Shirt','Open Collar Shirt','Block Party Shirt']],
    ['hoodies','Hoodies','Weight you can feel.','p-hoodie.jpg',2499,['Static Hoodie','Nightshift Hoodie','Basement Hoodie','Rooftop Hoodie','Transit Hoodie','Lowkey Hoodie','Sunday Hoodie']],
    ['jackets','Jackets','The outer layer. The whole mood.','p-jacket.jpg',2999,['Asphalt Trucker','After Dark Jacket','Warehouse Jacket','Backstage Jacket','Crosswalk Jacket','Underground Jacket','City Shell Jacket']],
    ['pants','Pants','Room to move. Pockets for everything.','p-cargo.jpg',2299,['Jugaad Cargo','Utility Cargo','District Cargo','Transit Cargo','Streetline Cargo','Workshop Cargo','Everyday Cargo']],
    ['joggers','Joggers','Off the clock. Out in the city.','p-joggers.jpg',1899,['Downtime Jogger','Night Run Jogger','Off Grid Jogger','Studio Jogger','Weekend Jogger','Slow Lane Jogger','Afterhours Jogger']],
    ['jeans','Jeans','Wide legs. Long nights.','p-jeans.jpg',2599,['Indigo Wide Jean','Railway Jean','Concrete Jean','Backstreet Jean','Rooftop Jean','City Fade Jean','No Curfew Jean']],
    ['accessories','Accessories','Small details. Full volume.','p-cap.jpg',599,['Noise Cap','Daily Tote','Low Profile Cap','City Canvas Tote','Afterhours Cap','Market Tote','Block Cap']]
  ];
  const categories = groups.map(([id,name,description]) => ({id,name,description}));
  const products = groups.flatMap(([category,,description,image,base,names]) => names.map((name,i) => ({
    id: `${category}-${i+1}`, category, name,
    price: category === 'accessories' && i%2 ? 399 : base + (i>1 ? (i%3)*100 : 0),
    image: `img/${category==='tees' && i%2 ? 'p-tee-acid.jpg' : category==='accessories' && i%2 ? 'p-tote.jpg' : image}`,
    sizes: category==='accessories' ? ['One size'] : ['S','M','L','XL','XXL'],
    material: ({tees:'240 GSM cotton concept',shirts:'Textured cotton concept',hoodies:'400 GSM fleece concept',jackets:'Washed denim concept',pants:'Cotton twill concept',joggers:'Heavyweight fleece concept',jeans:'Washed denim concept',accessories:i%2?'16oz canvas concept':'Cotton canvas concept'})[category],
    description: `${description} A unisex ${category==='accessories'?'everyday essential':'relaxed-fit concept'} for the FLIQ prototype. Product names, prices, materials and sizes are illustrative. Category photography is representative and reused across concept styles.`,
    sample: true
  })));
  const catalog = {categories,products};
  if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
  else root.FliqCatalog = catalog;
})(typeof window !== 'undefined' ? window : globalThis);
