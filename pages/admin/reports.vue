<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const { data: session } = await useFetch<any>('/api/admin/auth/session')
if (session.value?.user?.role !== 'super_admin') throw createError({ statusCode: 403, statusMessage: 'Akses ditolak' })
const { data: report, error } = await useFetch<any>('/api/admin/reports/financial')
const formatPrice = (value: number) => new Intl.NumberFormat('id-ID').format(value)
</script>
<template><div class="admin-page"><div class="admin-page-heading"><div><p class="eyebrow">Finance</p><h1>Laporan.</h1></div></div><p v-if="error" class="checkout-error">Laporan gagal dimuat.</p><section v-else class="admin-panel"><div class="summary-items"><div class="summary-item"><span>Omzet tercatat</span><strong>Rp {{ formatPrice((report?.totals?.product_revenue || 0) + (report?.totals?.delivery_revenue || 0)) }}</strong></div><div class="summary-item"><span>HPP</span><strong>Rp {{ formatPrice(Math.abs(report?.totals?.cogs || 0)) }}</strong></div><div class="summary-item"><span>Laba kotor</span><strong>Rp {{ formatPrice(((report?.totals?.product_revenue || 0) + (report?.totals?.delivery_revenue || 0)) - (Math.abs(report?.totals?.cogs || 0))) }}</strong></div></div></section></div></template>
