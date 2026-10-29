<script setup lang="ts">
import { Boxes, LayoutDashboard, LogOut, Menu, Package, Settings, UsersRound, X } from '@lucide/vue'

const route = useRoute()
const menuOpen = ref(false)
const { data: session } = await useFetch<any>('/api/admin/auth/session')
const logout = async () => { await $fetch('/api/admin/auth/logout', { method: 'POST' }); await navigateTo('/admin/login') }
const links = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard },
  { label: 'Produk', to: '/admin/products', icon: Boxes },
  { label: 'Pesanan', to: '/admin/orders', icon: Package },
  { label: 'Pelanggan', to: '/admin/customers', icon: UsersRound },
  { label: 'Refund', to: '/admin/refunds', icon: Package },
]
const superAdminLinks = [{ label: 'Voucher', to: '/admin/vouchers', icon: Settings }, { label: 'Laporan', to: '/admin/reports', icon: Package }]
const closeMenu = () => { menuOpen.value = false }
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar" :class="{ 'is-open': menuOpen }">
      <div class="admin-brand"><span class="wordmark">EQUINE</span><span>Admin</span></div>
      <nav class="admin-nav" aria-label="Navigasi admin">
<NuxtLink v-for="link in links" :key="link.to" :to="link.to" :class="{ 'is-active': route.path === link.to }" @click="closeMenu"><component :is="link.icon" :size="17" :stroke-width="1.6" />{{ link.label }}</NuxtLink>
       </nav>
       <nav v-if="session?.user?.role === 'super_admin'" class="admin-nav" aria-label="Pengaturan bisnis"><NuxtLink v-for="link in superAdminLinks" :key="link.to" :to="link.to" :class="{ 'is-active': route.path === link.to }" @click="closeMenu"><component :is="link.icon" :size="17" :stroke-width="1.6" />{{ link.label }}</NuxtLink></nav>
      <div class="admin-sidebar-bottom"><button type="button" @click="logout"><LogOut :size="17" :stroke-width="1.6" />Logout</button><NuxtLink to="/" @click="closeMenu">Lihat toko</NuxtLink><NuxtLink to="/admin/settings" @click="closeMenu"><Settings :size="17" :stroke-width="1.6" />Pengaturan</NuxtLink></div>
    </aside>
    <div class="admin-main">
      <header class="admin-topbar"><button class="admin-menu-toggle" :aria-label="menuOpen ? 'Tutup menu admin' : 'Buka menu admin'" @click="menuOpen = !menuOpen"><X v-if="menuOpen" :size="20" :stroke-width="1.6" /><Menu v-else :size="20" :stroke-width="1.6" /></button><div><p class="eyebrow">Equine Official</p><strong>Store admin</strong></div><span class="admin-user">Preview</span></header>
      <main class="admin-content"><slot /></main>
    </div>
  </div>
</template>
