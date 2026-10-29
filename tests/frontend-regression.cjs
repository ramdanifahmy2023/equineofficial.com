const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3020';
const output = process.env.AUDIT_OUTPUT || '/tmp/equine-frontend-regression';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
  const results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const go = async route => { await page.goto(base + route, { waitUntil: 'networkidle' }); };
    const pass = name => { results.push({ name, pass: true }); console.log('PASS', name); };
    const checkOverlay = async () => {
      assert.equal(await page.locator('dialog[open]').count(), 1);
      assert(await page.evaluate(() => !!document.activeElement.closest('dialog[open]')));
      assert(await page.evaluate(() => document.body.classList.contains('is-overlay-open')));
      for (const key of ['Shift+Tab', ...Array(14).fill('Tab')]) {
        await page.keyboard.press(key);
        assert(await page.evaluate(() => !!document.activeElement.closest('dialog[open]')), 'Focus escaped overlay');
      }
    };

    await go('/');
    await page.locator('.product-card .wishlist-button').first().click();
    assert.equal(await page.locator('.header-count').innerText(), '1');
    await page.locator('.product-card .buy-link').first().click();
    await page.waitForURL('**/products/carpenter-king-marsoto');
    assert.equal(await page.locator('.purchase-button').isDisabled(), true);
    assert.equal(await page.locator('.cart-count').innerText(), '0');
    pass('Beranda: wishlist dapat diklik, pilih varian tidak menambah ukuran otomatis');

    await page.locator('.size-option').filter({ hasText: /^32$/ }).click();
    await page.getByRole('button', { name: 'Pilih warna Mocca', exact: true }).click();
    await page.locator('.purchase-button').click();
    await checkOverlay();
    await page.locator('.modal-confirm').click();
    await checkOverlay();
    assert.match(await page.locator('.drawer-items').innerText(), /Mocca \/ 32/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal(await page.evaluate(() => document.body.classList.contains('is-overlay-open')), false);
    pass('Modal ke keranjang: varian benar, fokus terkurung, scroll terkunci, Escape menutup');

    await page.getByRole('button', { name: 'Perbesar foto produk' }).click();
    await checkOverlay();
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Perbesar foto produk');
    pass('Zoom: fokus kembali ke tombol pembuka');

    await go('/products');
    assert.equal(await page.locator('option').filter({ hasText: /^Terbaru$/ }).count(), 0);
    await page.getByLabel('Urutkan produk').selectOption('Harga terendah');
    const prices = await page.locator('.product-price').allTextContents();
    const numbers = prices.map(value => Number(value.replace(/\D/g, '')));
    assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
    await page.locator('.product-card .buy-link').first().click();
    await page.waitForURL('**/products/cargo-army-ripstop');
    assert.equal(await page.locator('.purchase-button').isDisabled(), true);
    assert.equal(await page.locator('.cart-count').innerText(), '1');
    pass('Katalog: sort harga berfungsi, opsi tanpa data dihapus, varian tetap wajib');

    await go('/wishlist');
    await page.locator('.product-card .buy-link').click();
    await page.waitForURL('**/products/carpenter-king-marsoto');
    assert.equal(await page.locator('.purchase-button').isDisabled(), true);
    await go('/wishlist');
    await page.locator('.product-card .wishlist-button').click();
    await page.locator('.wishlist-empty').waitFor();
    pass('Wishlist: pilih varian dan hapus melalui kartu berfungsi');

    await go('/checkout');
    await page.locator('input[type=email]').fill('audit@example.test');
    await page.locator('input[type=tel]').fill('081234567890');
    await page.locator('input[autocomplete=name]').fill('Contoh Audit');
    await page.locator('textarea').fill('Alamat contoh');
    await page.locator('input[type=search]').fill('Kebayoran');
    await page.locator('.destination-list button').click();
    await page.locator('input[autocomplete=postal-code]').fill('12120');
    await page.locator('input[value=jnt-ez]').check();
    await page.locator('input[value=bri_va]').check();
    await page.locator('.checkout-submit').click();
    await page.waitForURL('**/payment/**');
    const invoiceUrl = page.url();
    await page.locator('.payment-summary').waitFor();
    const summary = await page.locator('.payment-summary').innerText();
    assert.match(summary, /277\.500/);
    assert.match(await page.locator('.payment-card-head').innerText(), /BRI/);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.payment-summary').innerText(), summary);
    assert.match(await page.locator('.payment-card-head').innerText(), /BRI/);
    pass('Invoice: metode BRI, J&T, alamat, varian dan Rp277.500 bertahan setelah refresh');

    await page.getByRole('button', { name: 'Berhasil', exact: true }).click();
    assert.match(await page.locator('h1').innerText(), /Simulasi pembayaran berhasil/);
    assert.equal(await page.locator('.payment-summary').innerText(), summary);
    assert.equal(await page.locator('.cart-count').innerText(), '1');
    await page.reload({ waitUntil: 'networkidle' });
    assert.match(await page.locator('h1').innerText(), /Simulasi pembayaran berhasil/);
    for (const label of ['Gagal', 'Kedaluwarsa', 'Menunggu']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.getByRole('button', { name: label, exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.payment-summary').innerText(), summary);
    }
    await page.goto(invoiceUrl.replace('?preview=1', ''), { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.payment-sandbox-controls').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Saya sudah membayar', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Buka keranjang', exact: true }).click();
    await page.getByRole('button', { name: 'Tambah jumlah', exact: true }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.payment-summary').innerText(), summary);
    pass('Simulasi: semua status tersimpan; invoice terpisah dari cart; kontrol manual hanya di preview');

    await go('/admin/products');
    await page.getByLabel('Cari produk admin').fill('Carpenter Pants King Marsoto');
    assert.match(await page.locator('.admin-table tbody').innerText(), /14/);
    pass('Pembayaran berhasil: stok varian berkurang sekali pada admin mock');

    const orderNumber = invoiceUrl.match(/\/payment\/([^?]+)/)[1];
    await go('/admin/orders');
    await page.getByLabel('Cari pesanan admin').fill(decodeURIComponent(orderNumber));
    assert.match(await page.locator('.admin-table tbody').innerText(), /Contoh Audit/);
    assert.match(await page.locator('.admin-table tbody').innerText(), /Menunggu pembayaran/);
    await page.getByRole('button', { name: 'Detail', exact: true }).click();
    const drawerText = await page.locator('.admin-order-drawer').innerText();
    assert.match(drawerText, /Kebayoran Baru/);
    assert.match(drawerText, /Mocca \/ 32/);
    assert.match(drawerText, /J&T EZ/);
    await page.keyboard.press('Escape');
    pass('Admin order: checkout preview masuk daftar dan detail operasional');

    await page.getByLabel('Cari pesanan admin').fill('EQ-84218872');
    await page.getByRole('button', { name: 'Detail', exact: true }).click();
    await page.getByLabel('Update status').selectOption('Dikirim');
    await page.getByRole('button', { name: 'Simpan status', exact: true }).click();
    assert.match(await page.locator('[role=alert]').innerText(), /Nomor resi diperlukan/);
    await page.getByLabel('Nomor resi').fill('JNE-AUDIT-001');
    await page.getByLabel('Catatan internal').fill('Paket siap diserahkan ke kurir.');
    await page.getByRole('button', { name: 'Simpan status', exact: true }).click();
    assert.match(await page.locator('.admin-save-note').innerText(), /fulfillment diperbarui/);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByLabel('Cari pesanan admin').fill('EQ-84218872');
    await page.getByRole('button', { name: 'Detail', exact: true }).click();
    assert.equal(await page.getByLabel('Nomor resi').inputValue(), 'JNE-AUDIT-001');
    assert.equal(await page.getByLabel('Catatan internal').inputValue(), 'Paket siap diserahkan ke kurir.');
    await page.keyboard.press('Escape');
    pass('Fulfillment admin: resi wajib, catatan dan status bertahan setelah refresh');

    await page.getByLabel('Cari pesanan admin').fill('EQ-84218872');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
    const csvPath = await (await download).path();
    const csv = fs.readFileSync(csvPath, 'utf8');
    assert.match(csv, /Order ID/);
    assert.match(csv, /EQ-84218872/);
    assert.doesNotMatch(csv, /EQ-84219104/);
    pass('Admin orders: export CSV mengikuti hasil filter aktif');

    await go('/admin/customers');
    await page.getByLabel('Cari pelanggan admin').fill('Contoh Audit');
    assert.match(await page.locator('.admin-table tbody').innerText(), /Contoh Audit/);
    await page.getByRole('button', { name: 'Detail', exact: true }).click();
    assert.match(await page.locator('.admin-order-drawer').innerText(), /audit@example\.test/);
    await page.keyboard.press('Escape');
    pass('Admin customers: profil, kontak, total dan riwayat order tampil');

    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(output, 'payment-mobile.png'), fullPage: true });
    await go('/payment/tidak-ada');
    assert.match(await page.locator('h1').innerText(), /tidak ditemukan/);
    assert.equal(await page.locator('.payment-summary').count(), 0);
    pass('Invoice mobile dan nomor order tidak ditemukan');

    await page.setViewportSize({ width: 1440, height: 900 });
    await go('/admin/settings');
    await page.locator('input[type=text]').first().fill('AUDIT PREVIEW');
    await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
    assert.match(await page.locator('.admin-save-note').innerText(), /tersimpan/);
    await page.getByRole('link', { name: 'Produk', exact: true }).click();
    await page.getByRole('link', { name: 'Pengaturan', exact: true }).click();
    assert.equal(await page.locator('input[type=text]').first().inputValue(), 'AUDIT PREVIEW');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('input[type=text]').first().inputValue(), 'AUDIT PREVIEW');
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage blocked') } });
    await page.locator('input[type=text]').first().fill('UNSAVED');
    await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
    assert.match(await page.locator('[role=alert]').innerText(), /belum tersimpan/);
    assert.equal(await page.locator('.admin-save-note').count(), 0);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('input[type=text]').first().inputValue(), 'AUDIT PREVIEW');
    pass('Settings: simpan, navigasi, refresh, dan gagal penyimpanan memberi hasil jujur');

    await go('/admin/products');
    await page.getByRole('button', { name: 'Tambah produk', exact: true }).click();
    await checkOverlay();
    await page.locator('input[placeholder="SKU"]').first().fill('AUDIT-001');
    await page.locator('input[placeholder="Harga"]').first().fill('199000');
    const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    await page.locator('input[type=file]').setInputFiles([
      { name: 'audit-product.png', mimeType: 'image/png', buffer: onePixelPng },
      { name: 'audit-product.mp4', mimeType: 'video/mp4', buffer: Buffer.from('audit-video') },
    ]);
    await page.locator('.admin-media-card').nth(1).waitFor();
    assert.match(await page.locator('.admin-media-editor').innerText(), /audit-product\.png/);
    assert.match(await page.locator('.admin-media-editor').innerText(), /audit-product\.mp4/);
    pass('Admin produk: varian wajib dan upload gambar/video tampil sebagai preview');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog[open]').count(), 0);
    const productCount = await page.locator('.admin-product-table tbody tr').count();
    await page.getByRole('button', { name: 'Duplikat', exact: true }).first().click();
    assert.equal(await page.locator('.admin-product-table tbody tr').count(), productCount + 1);
    assert.match(await page.locator('.admin-product-table tbody tr').first().innerText(), /copy[\s\S]*Draft/);
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Hapus', exact: true }).first().click();
    assert.equal(await page.locator('.admin-product-table tbody tr').count(), productCount);
    pass('Admin produk: duplikat selalu Draft dan draft dapat dihapus dengan konfirmasi');
    await go('/admin/orders');
    await page.getByRole('button', { name: 'Detail', exact: true }).first().click();
    await checkOverlay();
    await page.keyboard.press('Escape');
    pass('Modal produk admin dan drawer pesanan: fokus dan scroll');

    await go('/');
    assert.equal(await page.locator('.service-strip, .about-band').count(), 0);
    assert.match(await page.locator('.home-hero').innerText(), /Celana kerja/);
    assert.equal(await page.locator('.category-tile').count(), 3);
    await go('/products/cargo-pants-premium');
    assert.match(await page.locator('.accordion-content').innerText(), /38/);
    assert.match(await page.locator('.accordion-content').innerText(), /belum tersedia/);
    await go('/products/cargo-pants-lapangan');
    assert.equal(await page.locator('.size-option:not([disabled])').count(), 0);
    assert.equal(await page.locator('.purchase-button').isDisabled(), true);
    pass('Produk sold out: semua ukuran nonaktif dan CTA terkunci');
    await go('/size-guide');
    assert.match(await page.locator('.info-content').innerText(), /belum tersedia/);
    pass('Size guide: semua nomor ukuran tampil dan keterbatasan data dinyatakan');

    const luminance = rgb => rgb.slice(0, 3).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
    const contrast = (a, b) => { const values = [luminance(a), luminance(b)].sort((x, y) => x - y); return (values[1] + .05) / (values[0] + .05); };
    await go('/products');
    const colors = await page.locator('.product-price, .buy-link').evaluateAll(nodes => nodes.slice(0, 2).map(node => ({ foreground: getComputedStyle(node).color.match(/[\d.]+/g).map(Number), background: getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g).map(Number) })));
    colors.forEach(color => assert(contrast(color.foreground, color.background) >= 4.5));
    await go('/products/carpenter-king-marsoto');
    await page.locator('.size-option').first().click();
    await page.waitForTimeout(250);
    const cta = await page.locator('.purchase-button').evaluate(node => ({ foreground: getComputedStyle(node).color.match(/[\d.]+/g).map(Number), background: getComputedStyle(node).backgroundColor.match(/[\d.]+/g).map(Number) }));
    assert(contrast(cta.foreground, cta.background) >= 4.5, JSON.stringify(cta));
    pass('Kontras harga, pilih varian, dan CTA minimal 4.5:1');

    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/', '/products', '/products/carpenter-king-marsoto', '/wishlist', '/checkout', '/payment/tidak-ada', '/size-guide', '/shipping', '/returns', '/admin', '/admin/products', '/admin/orders', '/admin/customers', '/admin/settings']) {
        await go(route);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow ${route} ${width}`);
      }
    }
    assert.deepEqual(errors, []);
    pass('13 rute desktop/mobile: tanpa overflow halaman dan tanpa exception JavaScript');
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
