<script setup>
import { ref } from 'vue';
import ProcessScheduler from './components/ProcessScheduler.vue'
import MemoryAllocator from './components/MemoryAllocator.vue'

// Custom logo icon
const ICON_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
  <rect x="9" y="9" width="6" height="6"></rect>
  <line x1="9" y1="2" x2="9" y2="4"></line>
  <line x1="15" y1="2" x2="15" y2="4"></line>
  <line x1="9" y1="20" x2="9" y2="22"></line>
  <line x1="15" y1="20" x2="15" y2="22"></line>
  <line x1="20" y1="9" x2="22" y2="9"></line>
  <line x1="20" y1="14" x2="22" y2="14"></line>
  <line x1="2" y1="9" x2="4" y2="9"></line>
  <line x1="2" y1="14" x2="4" y2="14"></line>
</svg>`;

// Active component
const activeComponent = ref('process-scheduler');
</script>

<template>
  <header>
    <div class="logo-container">
      <div class="logo-icon" v-html="ICON_LOGO"></div>
      <h1 class="title">OS SimVis</h1>
    </div>
    <div class="subtitle">操作系统模拟可视化</div>
  </header>

  <nav class="component-nav">
    <button
      @click="activeComponent = 'process-scheduler'"
      :class="{ active: activeComponent === 'process-scheduler' }"
      class="nav-button"
    >
      进程调度可视化
    </button>
    <button
      @click="activeComponent = 'memory-allocator'"
      :class="{ active: activeComponent === 'memory-allocator' }"
      class="nav-button"
    >
      内存分配可视化
    </button>
  </nav>

  <main>
    <ProcessScheduler v-if="activeComponent === 'process-scheduler'" />
    <MemoryAllocator v-if="activeComponent === 'memory-allocator'" />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 2rem 0;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary), var(--color-primary-light));
  color: white;
  border-radius: 0 0 var(--card-border-radius) var(--card-border-radius);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 60%);
  z-index: 1;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  z-index: 2;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-right: 1rem;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: var(--shadow-sm);
  color: white;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 1.25rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  z-index: 2;
}

.component-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.nav-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-background-soft);
  border: none;
  border-radius: var(--button-border-radius);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-button:hover {
  background-color: var(--color-background-mute);
  transform: translateY(-2px);
}

.nav-button.active {
  background-color: var(--color-primary);
  color: white;
}

main {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 1024px) {
  header {
    margin-bottom: 3rem;
  }

  .logo-icon {
    width: 80px;
    height: 80px;
  }

  .title {
    font-size: 3rem;
  }

  .subtitle {
    font-size: 1.5rem;
  }
}
</style>
