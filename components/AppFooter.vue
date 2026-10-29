<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="wordmark">EQUINE</span>
        <p>Workwear pants untuk hari yang panjang.</p>
      </div>
      <div class="footer-links">
        <div>
          <p class="footer-label">Shop</p>
          <NuxtLink to="/products">Semua produk</NuxtLink>
          <NuxtLink to="/products?category=Carpenter">Carpenter</NuxtLink>
          <NuxtLink to="/products?category=Cargo">Cargo</NuxtLink>
        </div>
        <div>
          <p class="footer-label">Bantuan</p>
          <NuxtLink to="/size-guide">Size guide</NuxtLink>
          <NuxtLink to="/shipping">Pengiriman</NuxtLink>
          <NuxtLink to="/returns">Retur</NuxtLink>
        </div>
      </div>
    </div>
    <div class="footer-bottom"><span>© {{ new Date().getFullYear() }} Equine</span><span>Katalog diselaraskan dari snapshot toko Equine.</span></div>
  </footer>
</template>
