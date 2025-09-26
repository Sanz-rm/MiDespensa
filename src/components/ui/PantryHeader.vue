<!-- PantryHeader.vue -->
<template>
  <header class="banner" role="banner">
    <img class="logo" src="@/assets/img/logo-mi-despensa.png" :alt="alt" />
    <h1 class="title">{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
type Props = {
  title?: string
  logo?: string
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'MI DESPENSA',
  alt: 'Logo Mi Despensa'
})

const { title, alt } = props
</script>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #2ea15d;
  color: #fff;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
  box-shadow: 0 2px 6px rgba(0,0,0,.12);
}

.logo {
  width: 84px;
  height: 84px;
  display: block;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: .4px;
  text-transform: uppercase;
  line-height: 1;
}

/* Responsive */
@media (min-width: 420px) {
  .banner { padding: 16px 22px; }
  .logo { width: 38px; height: 38px; }
  .title { font-size: 22px; }
}
</style>
