<!-- src/App.vue -->
<template>
  <v-app>
    <!-- ДИАЛОГ АВТОРИЗАЦИИ -->
    <v-dialog v-model="showAuthDialog" max-width="360" persistent>
      <v-card class="auth-basic-card">
        <v-card-text class="pa-4 text-center">
          <v-icon size="32" color="grey-darken-1" class="mb-2">ri-lock-line</v-icon>
          <p class="text-h6 font-weight-medium mb-1">Войти</p>
          <p class="text-caption text-grey mb-4">KPI Калькулятор</p>
          
          <v-text-field
            v-model="authLogin"
            label="Имя пользователя"
            variant="outlined"
            density="compact"
            class="mb-3"
            autofocus
            @keyup.enter="doAuth"
          ></v-text-field>
          
          <v-text-field
            v-model="authPassword"
            label="Пароль"
            type="password"
            variant="outlined"
            density="compact"
            class="mb-3"
            @keyup.enter="doAuth"
          ></v-text-field>
          
          <v-alert
            v-if="authError"
            type="error"
            variant="tonal"
            density="compact"
            closable
            class="mb-3"
            @click:close="authError = ''"
          >
            {{ authError }}
          </v-alert>
          
          <div class="d-flex justify-end gap-2">
            <v-btn color="primary" size="small" @click="doAuth">Войти</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <div :style="{ filter: showAuthDialog ? 'blur(5px)' : 'none', transition: 'filter 0.3s' }">
      <!-- Боковое меню: десктоп (мышь/трекпад) -->
      <v-navigation-drawer 
        v-if="!isMobile"
        permanent 
        class="sidebar"
        :class="{
          'semi-dark': semiDarkMenu,
          'light-sidebar': !semiDarkMenu && selectedTheme !== 'dark',
          'dark-sidebar': selectedTheme === 'dark'
        }"
      >
        <div class="nav-header">
          <div class="d-flex align-center ga-3">
            <img src="@/assets/logo.svg" width="40" height="42" alt="Benzigo">
            <span class="text-h6 font-weight-bold" :class="logoTextClass">Benzigo Workspace</span>
          </div>
        </div>
        
        <v-divider :class="dividerClass"></v-divider>
        
        <v-list density="compact" nav class="mt-2">
          <v-list-item prepend-icon="ri-calculator-line" title="KPI Калькулятор" to="/kpi-calculator" :active="$route.path === '/kpi-calculator'" :class="navItemClass"></v-list-item>
          <v-list-item prepend-icon="ri-bank-line" title="Прогноз и отчеты" to="/supplier-balances" :active="$route.path === '/supplier-balances'" :class="navItemClass"></v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- Шапка -->
      <v-app-bar elevation="0" class="header">
        <v-app-bar-title class="text-h6 font-weight-medium app-title">{{ pageTitle }}</v-app-bar-title>
        
        <v-spacer></v-spacer>

        <v-btn icon variant="text" size="small" class="text-medium-emphasis">
          <v-icon size="22">ri-question-line</v-icon>
        </v-btn>
        <v-btn icon variant="text" size="small" class="text-medium-emphasis">
          <v-badge dot color="error" bordered>
            <v-icon size="22">ri-notification-2-line</v-icon>
          </v-badge>
        </v-btn>
        <v-avatar :color="`rgb(${primaryColor})`" size="40" class="cursor-pointer ml-2">
          <v-icon size="24" color="white">ri-user-line</v-icon>
        </v-avatar>
      </v-app-bar>

      <!-- Основной контент -->
      <v-main :class="{ 'mb-16': isMobile }">
        <router-view v-slot="{ Component }">
          <component :is="Component" :theme="selectedTheme" :primary-color="primaryColor" />
        </router-view>
      </v-main>

      <!-- Нижнее меню: мобильные (тачскрин) -->
      <v-bottom-navigation
        v-if="isMobile"
        v-model="bottomNav"
        fixed
        grow
        class="bottom-nav"
        color="primary"
      >
        <v-btn value="calculator" to="/kpi-calculator">
          <v-icon>ri-calculator-line</v-icon>
          <span class="text-caption">KPI</span>
        </v-btn>
        <v-btn value="forecast" to="/supplier-balances">
          <v-icon>ri-bank-line</v-icon>
          <span class="text-caption">Прогноз</span>
        </v-btn>
      </v-bottom-navigation>

      <AppCustomizer 
        @update:primary-color="updatePrimaryColor"
        @update:theme="updateTheme"
        @update:semi-dark="updateSemiDark"
      />
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import AppCustomizer from '@/components/AppCustomizer.vue'

const route = useRoute()

// Определение мобильного устройства по сенсорному экрану
const isMobile = ref(false)
const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)')

const updateDevice = (e: MediaQueryListEvent | MediaQueryList) => {
  isMobile.value = e.matches
}

onMounted(() => {
  updateDevice(mediaQuery)
  mediaQuery.addEventListener('change', updateDevice)
})

onBeforeUnmount(() => {
  mediaQuery.removeEventListener('change', updateDevice)
})

const bottomNav = ref('forecast')
const primaryColor = ref('230,4,16')
const selectedTheme = ref('light')
const semiDarkMenu = ref(false)

const showAuthDialog = ref(false)
const authLogin = ref('')
const authPassword = ref('')
const authError = ref('')

const doAuth = () => {
  if (!authLogin.value || !authPassword.value) {
    authError.value = 'Заполните все поля'
    return
  }
  if (authLogin.value === 'bnz' && authPassword.value === 'bnz') {
    localStorage.setItem('kpi_auth', 'true')
    showAuthDialog.value = false
  } else {
    authError.value = 'Неверный логин или пароль'
  }
}

const pageTitle = computed(() => {
  switch(route.path) {
    case '/': return 'Главная'
    case '/kpi-calculator': return 'KPI Калькулятор'
    case '/supplier-balances': return 'Прогноз и отчеты'
    default: return 'Benzigo Workspace'
  }
})

const updatePrimaryColor = (rgb: string) => { primaryColor.value = rgb }
const updateTheme = (theme: string) => { selectedTheme.value = theme }
const updateSemiDark = (value: boolean) => { semiDarkMenu.value = value }

const logoTextClass = computed(() => (semiDarkMenu.value || selectedTheme.value === 'dark') ? 'text-white' : 'text-dark')
const dividerClass = computed(() => (semiDarkMenu.value || selectedTheme.value === 'dark') ? 'border-white' : '')
const navItemClass = computed(() => (semiDarkMenu.value || selectedTheme.value === 'dark') ? 'dark-nav-item' : 'light-nav-item')

onMounted(() => {
  console.log('🚀 App.vue mounted')
  console.log('isMobile:', isMobile.value)
  
  const savedColor = localStorage.getItem('primary-color')
  if (savedColor) primaryColor.value = savedColor
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) selectedTheme.value = savedTheme
  const savedSemiDark = localStorage.getItem('semi-dark-menu')
  if (savedSemiDark) semiDarkMenu.value = savedSemiDark === 'true'
  
  if (!localStorage.getItem('kpi_auth')) {
    showAuthDialog.value = true
  }
})
</script>

<style>
/* ========== РЕЗИНОВАЯ ТИПОГРАФИКА ========== */
html {
  font-size: 16px;
}

@media (max-width: 960px) {
  html {
    font-size: clamp(12px, calc(100vw / 375 * 10), 16px);
  }
}

/* ========== БАЗОВЫЕ СТИЛИ ========== */
.auth-basic-card {
  border-radius: 0.8rem !important;
  box-shadow: 0 0.8rem 3.2rem rgba(0,0,0,0.3) !important;
}

.sidebar {
  transition: background-color 0.3s ease, color 0.3s ease;
}

.sidebar.light-sidebar {
  background-color: #FFFFFF !important;
  border-right: 1px solid rgba(0,0,0,0.08) !important;
}

.sidebar.light-sidebar .v-list-item__title,
.sidebar.light-sidebar .v-icon {
  color: rgba(0,0,0,0.7) !important;
}

.sidebar.light-sidebar .v-list-item:hover {
  background-color: rgba(0,0,0,0.05) !important;
}

.sidebar.semi-dark,
.sidebar.dark-sidebar {
  background-color: #1E1E2D !important;
  border-right: 1px solid rgba(255,255,255,0.08) !important;
}

.sidebar.semi-dark .v-list-item__title,
.sidebar.dark-sidebar .v-list-item__title,
.sidebar.semi-dark .v-icon,
.sidebar.dark-sidebar .v-icon {
  color: rgba(255,255,255,0.7) !important;
}

.sidebar.semi-dark .v-list-item:hover,
.sidebar.dark-sidebar .v-list-item:hover {
  background-color: rgba(255,255,255,0.05) !important;
}

.sidebar .v-list-item--active {
  background-color: rgba(var(--v-global-theme-primary), 0.15) !important;
  color: rgb(var(--v-global-theme-primary)) !important;
}

.sidebar .v-list-item--active .v-icon {
  color: rgb(var(--v-global-theme-primary)) !important;
}

.v-list-subheader {
  padding-left: 1.6rem !important;
  margin-top: 0.8rem !important;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
  text-transform: uppercase !important;
}

.header {
  background-color: white !important;
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}

.dark-theme {
  background-color: #1E1E2D !important;
  color: white !important;
}

.dark-theme .v-card {
  background-color: #2A2A2A !important;
  color: rgba(255,255,255,0.9) !important;
}

.dark-theme .header {
  background-color: #2A2A2A !important;
  border-bottom: 1px solid rgba(255,255,255,0.08) !important;
}

.dark-theme .header .v-btn,
.dark-theme .header .v-app-bar-title {
  color: rgba(255,255,255,0.9) !important;
}

.bordered-skin .v-card {
  border: 1px solid rgba(0,0,0,0.12) !important;
  box-shadow: none !important;
}

.bordered-skin.dark-theme .v-card {
  border: 1px solid rgba(255,255,255,0.12) !important;
}

.bottom-nav {
  border-top: 1px solid rgba(0,0,0,0.1);
}
</style>