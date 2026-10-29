const { chromium } = require('/home/ubuntu/Sites/CloakBrowser/js/node_modules/playwright-core');
const fs = require('fs');
const out = '/tmp/equine-audit-20260905';
fs.mkdirSync(out, { recursive: true });
(async () => {
 const browser = await chromium.launch({executablePath:'/home/ubuntu/.cloakbrowser/chromium-146.0.7680.177.5/chrome',headless:true,args:['--no-sandbox']});
 const context = await browser.newContext();
 const page = await context.newPage();
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const go=async path=>{await page.goto('http://127.0.0.1:3020'+path);await page.waitForTimeout(250)};
 const result={routes:[],errors};
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/','/products','/products/carpenter-king-marsoto','/wishlist','/checkout','/payment/EQ-audit','/size-guide','/shipping','/returns','/admin','/admin/products','/admin/orders','/admin/settings']){
   const response=await page.goto('http://127.0.0.1:3020'+route);await page.waitForTimeout(180);
   result.routes.push({width,route,status:response.status(),...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src'))}))});
  }
 }
 await go('/');
 result.homeWishlist = await page.locator('.product-card .wishlist-button').first().evaluate(e=>{const r=e.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {position:getComputedStyle(e).position,coveredBy:top?.tagName,clickable:e===top||e.contains(top)}});
 await page.locator('.product-card .wishlist-button').first().scrollIntoViewIfNeeded();
 try {await page.locator('.product-card .wishlist-button').first().click({timeout:1500});result.homeWishlist.click='ok'}catch(e){result.homeWishlist.click='blocked';}
 await page.screenshot({path:out+'/home-products.png'});
 await go('/products');
 await page.locator('.buy-link').first().click();
 result.quickBuy = await page.evaluate(()=>JSON.parse(localStorage.getItem('equine-cart')));
 result.drawerFocus = await page.evaluate(()=>({active:document.activeElement?.outerHTML,inside:!!document.activeElement?.closest('.cart-drawer')}));
 await page.keyboard.press('Tab');
 result.drawerTab=await page.evaluate(()=>({active:document.activeElement?.outerHTML,inside:!!document.activeElement?.closest('.cart-drawer')}));
 await page.keyboard.press('Escape');
 await go('/checkout');
 await page.locator('input[type=email]').fill('audit@example.test');
 await page.locator('input[type=tel]').fill('081234567890');
 await page.locator('input[autocomplete=name]').fill('Audit Lokal');
 await page.locator('textarea').fill('Alamat simulasi audit lokal');
 await page.locator('input[type=search]').fill('Kebayoran');
 await page.locator('.destination-list button').click();
 await page.locator('input[autocomplete=postal-code]').fill('12120');
 await page.locator('input[value=jnt-ez]').check();
 await page.locator('input[value=bri_va]').check();
 await page.locator('.checkout-submit').click();
 await page.waitForURL('**/payment/**');
 result.paymentBefore={url:page.url(),summary:await page.locator('.payment-summary').innerText(),method:await page.locator('.payment-card-head').innerText()};
 await page.reload();await page.waitForTimeout(300);
 result.paymentReload={summary:await page.locator('.payment-summary').innerText(),method:await page.locator('.payment-card-head').innerText()};
 await page.getByRole('button',{name:'Saya sudah membayar',exact:true}).click();
 result.paymentSuccess={heading:await page.locator('h1').innerText(),summary:await page.locator('.payment-summary').innerText(),cart:await page.evaluate(()=>localStorage.getItem('equine-cart'))};
 await page.reload();await page.waitForTimeout(300);
 result.successReload={heading:await page.locator('h1').innerText(),summary:await page.locator('.payment-summary').innerText()};
 await go('/admin/settings');
 await page.locator('input[type=text]').first().fill('AUDIT STORE');
 await page.getByRole('button',{name:'Simpan pengaturan'}).click();
 result.settingsSave=await page.locator('.admin-save-note').innerText();
 await page.getByRole('link',{name:'Produk',exact:true}).click();
 await page.getByRole('link',{name:'Pengaturan',exact:true}).click();
 result.settingsAfterNavigation=await page.locator('input[type=text]').first().inputValue();
 await go('/products');
 result.defaultSort=await page.locator('.product-name').allTextContents();
 await page.locator('select').selectOption('Terbaru');
 result.newestSort=await page.locator('.product-name').allTextContents();
 result.colors=await page.locator('.product-price,.buy-link').evaluateAll(els=>els.slice(0,2).map(e=>({text:e.textContent,color:getComputedStyle(e).color,background:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(e).fontSize})));
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:out+'/catalog-mobile.png',fullPage:true});
 fs.writeFileSync(out+'/results.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
