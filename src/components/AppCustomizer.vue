<!-- src/components/AppCustomizer.vue -->
<template>
  <div class="app-customizer">
    <!-- Кнопка-шестеренка -->
    <v-btn
      icon
      :color="`rgb(${selectedColor})`"
      class="customizer-toggler"
      @click="drawer = !drawer"
    >
      <v-icon>ri-settings-3-line</v-icon>
    </v-btn>

    <!-- Выдвижная панель -->
    <v-navigation-drawer
      v-model="drawer"
      location="right"
      temporary
      width="400"
      class="customizer-panel"
    >
      <div class="pa-6">
        <!-- Заголовок -->
        <div class="d-flex align-center justify-space-between mb-4">
          <h3 class="text-h6 font-weight-medium">Настройка экрана</h3>
          <v-btn
            icon
            variant="text"
            size="small"
            @click="drawer = false"
          >
            <v-icon>ri-close-line</v-icon>
          </v-btn>
        </div>

        <v-divider class="mb-4"></v-divider>

        <!-- Primary Color -->
        <div class="mb-6">
          <div class="d-flex align-center mb-3">
            <span class="text-uppercase text-caption font-weight-medium" 
                   :style="{ color: `rgb(${selectedColor})` }">Theming</span>
          </div>
          <h4 class="text-subtitle-2 font-weight-medium mb-3">Primary Color</h4>
          <div class="d-flex gap-2 flex-wrap">
            <div
              v-for="color in primaryColors"
              :key="color.rgb"
              class="color-option"
              :class="{ active: selectedColor === color.rgb }"
              :style="{ 
                backgroundColor: `rgb(${color.rgb})`,
                outline: selectedColor === color.rgb ? `2px solid rgb(${color.rgb})` : 'none'
              }"
              @click="setPrimaryColor(color.rgb)"
            ></div>
            <v-btn
              icon
              size="small"
              variant="flat"
              class="color-picker-btn"
              @click="showColorPicker = true"
            >
              <v-icon>ri-palette-line</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Theme (Light/Dark/System) -->
        <div class="mb-6">
          <h4 class="text-subtitle-2 font-weight-medium mb-3">Theme</h4>
          <v-row>
            <v-col cols="4" v-for="theme in themes" :key="theme.value">
              <v-card
                flat
                border
                class="text-center pa-3 cursor-pointer"
                :class="{ 'theme-active': selectedTheme === theme.value }"
                @click="setTheme(theme.value)"
              >
                <v-icon size="30" class="mb-2">{{ theme.icon }}</v-icon>
                <div class="text-caption">{{ theme.label }}</div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Skins (Default/Bordered) -->
        <div class="mb-6">
          <h4 class="text-subtitle-2 font-weight-medium mb-3">Skins</h4>
          <v-row>
            <v-col cols="6" v-for="skin in skins" :key="skin.value">
              <v-card
                flat
                border
                class="text-center pa-3 cursor-pointer"
                :class="{ 'skin-active': selectedSkin === skin.value }"
                @click="setSkin(skin.value)"
              >
                <div class="text-caption">{{ skin.label }}</div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Semi Dark Menu -->
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-subtitle-2">Semi Dark Menu</span>
          <v-switch
            v-model="semiDarkMenu"
            :color="`rgb(${selectedColor})`"
            hide-details
            density="compact"
            inset
            @update:model-value="setSemiDarkMenu"
          ></v-switch>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- Цветовая палитра -->
    <v-dialog v-model="showColorPicker" width="300">
      <v-card>
        <v-card-title>Выберите цвет</v-card-title>
        <v-card-text>
          <v-color-picker
            v-model="customColor"
            mode="hex"
            hide-canvas
            show-swatches
            swatches-max-height="200"
          ></v-color-picker>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn :color="`rgb(${selectedColor})`" @click="applyCustomColor">Применить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from 'vuetify'

// События для передачи в App.vue
const emit = defineEmits<{
  (e: 'update:primary-color', rgb: string): void
  (e: 'update:theme', theme: string): void
  (e: 'update:semi-dark', value: boolean): void
}>()

const drawer = ref(false)
const theme = useTheme()

// Цвета в формате RGB (как в оригинале)
const primaryColors = [
  { rgb: '230,4,16' },    // Красный Benzigo
  { rgb: '13,147,148' },  // Бирюзовый
  { rgb: '255,180,0' },   // Желтый
  { rgb: '255,76,81' },   // Розовый
  { rgb: '22,177,255' },  // Синий
]

// Текущий выбранный цвет (храним RGB строку)
const selectedColor = ref('230,4,16')
const showColorPicker = ref(false)
const customColor = ref('#E60410')

// Тема
const themes = [
  { value: 'light', label: 'Light', icon: 'ri-sun-line' },
  { value: 'dark', label: 'Dark', icon: 'ri-moon-clear-line' },
  { value: 'system', label: 'System', icon: 'ri-computer-line' },
]
const selectedTheme = ref('light')

// Скины
const skins = [
  { value: 'default', label: 'Default' },
  { value: 'bordered', label: 'Bordered' },
]
const selectedSkin = ref('default')

// Semi Dark Menu
const semiDarkMenu = ref(false)

// Установка основного цвета (RGB формат)
const setPrimaryColor = (rgb: string) => {
  selectedColor.value = rgb
  
  // Устанавливаем на корневых элементах
  document.documentElement.style.setProperty('--v-global-theme-primary', rgb)
  
  const appElement = document.querySelector('.v-application')
  if (appElement) {
    (appElement as HTMLElement).style.setProperty('--v-global-theme-primary', rgb)
  }
  
  // Обновляем тему Vuetify (конвертируем RGB в HEX для Vuetify)
  const hex = rgbToHex(rgb)
  theme.themes.value.light.colors.primary = hex
  theme.themes.value.dark.colors.primary = hex
  
  // Сохраняем в localStorage
  localStorage.setItem('primary-color', rgb)
  
  // Отправляем событие в родительский компонент
  emit('update:primary-color', rgb)
  
  // Отправляем кастомное событие для всех компонентов
  window.dispatchEvent(new CustomEvent('primary-color-changed', { detail: { rgb } }))
}

// Конвертер RGB в HEX
const rgbToHex = (rgb: string) => {
  const [r, g, b] = rgb.split(',').map(Number)
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Конвертер HEX в RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? 
    `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : 
    '230,4,16'
}

// Применить кастомный цвет
const applyCustomColor = () => {
  const rgb = hexToRgb(customColor.value)
  setPrimaryColor(rgb)
  showColorPicker.value = false
}

// Установка темы
const setTheme = (themeValue: string) => {
  selectedTheme.value = themeValue
  
  const appElement = document.querySelector('.v-application')
  
  if (themeValue === 'dark') {
    theme.global.name.value = 'dark'
    appElement?.classList.remove('v-theme--light')
    appElement?.classList.add('v-theme--dark')
    document.documentElement.classList.add('dark-theme')
  } else if (themeValue === 'light') {
    theme.global.name.value = 'light'
    appElement?.classList.remove('v-theme--dark')
    appElement?.classList.add('v-theme--light')
    document.documentElement.classList.remove('dark-theme')
  } else if (themeValue === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.global.name.value = systemDark ? 'dark' : 'light'
    if (systemDark) {
      appElement?.classList.remove('v-theme--light')
      appElement?.classList.add('v-theme--dark')
      document.documentElement.classList.add('dark-theme')
    } else {
      appElement?.classList.remove('v-theme--dark')
      appElement?.classList.add('v-theme--light')
      document.documentElement.classList.remove('dark-theme')
    }
  }
  
  localStorage.setItem('theme', themeValue)
  emit('update:theme', themeValue)
}

// Установка скина
const setSkin = (skin: string) => {
  selectedSkin.value = skin
  
  // Удаляем предыдущий класс скина
  document.body.classList.remove('bordered-skin', 'default-skin')
  
  if (skin === 'bordered') {
    document.body.classList.add('bordered-skin')
  } else {
    document.body.classList.add('default-skin')
  }
  
  localStorage.setItem('skin', skin)
}

// Установка Semi Dark Menu
const setSemiDarkMenu = (value: boolean) => {
  semiDarkMenu.value = value
  
  if (value) {
    document.body.classList.add('semi-dark-menu')
  } else {
    document.body.classList.remove('semi-dark-menu')
  }
  
  localStorage.setItem('semi-dark-menu', value.toString())
  emit('update:semi-dark', value)
}

// Загрузка настроек
onMounted(() => {
  // Загружаем цвет
  const savedColor = localStorage.getItem('primary-color')
  if (savedColor) {
    selectedColor.value = savedColor
    document.documentElement.style.setProperty('--v-global-theme-primary', savedColor)
    
    const hex = rgbToHex(savedColor)
    theme.themes.value.light.colors.primary = hex
    theme.themes.value.dark.colors.primary = hex
    
    // Отправляем событие в родительский компонент
    emit('update:primary-color', savedColor)
  }
  
  // Загружаем тему
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    setTheme(savedTheme)
  } else {
    // Устанавливаем начальную тему
    setTheme('light')
  }
  
  // Загружаем скин
  const savedSkin = localStorage.getItem('skin')
  if (savedSkin) {
    setSkin(savedSkin)
  } else {
    setSkin('default')
  }
  
  // Загружаем Semi Dark Menu
  const savedSemiDark = localStorage.getItem('semi-dark-menu')
  if (savedSemiDark) {
    semiDarkMenu.value = savedSemiDark === 'true'
    setSemiDarkMenu(semiDarkMenu.value)
  } else {
    setSemiDarkMenu(false)
  }
})
</script>

<style scoped>
.customizer-toggler {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  border-radius: 8px 0 0 8px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.customizer-panel {
  border-left: 1px solid rgba(0,0,0,0.08) !important;
  z-index: 1001;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #2A2A2A;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.color-picker-btn {
  background-color: rgba(75, 70, 92, 0.08) !important;
  border-radius: 8px !important;
}

.theme-active,
.skin-active {
  border-color: #E60410 !important;
  background-color: rgba(230, 4, 16, 0.04) !important;
}

.gap-2 {
  gap: 8px;
}
</style>

<style>
/* Глобальные стили для скинов */
.bordered-skin .v-card {
  border: 1px solid rgba(0,0,0,0.12) !important;
  box-shadow: none !important;
}

.default-skin .v-card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
  border: none !important;
}

/* Semi Dark Menu */
.semi-dark-menu .v-navigation-drawer {
  background-color: #1E1E2D !important;
}

.semi-dark-menu .v-navigation-drawer .v-list-item__title,
.semi-dark-menu .v-navigation-drawer .v-icon {
  color: rgba(255,255,255,0.7) !important;
}

/* Темная тема */
.dark-theme {
  background-color: #1E1E2D !important;
  color: white !important;
}

.dark-theme .v-card {
  background-color: #2A2A2A !important;
  color: rgba(255,255,255,0.9) !important;
}

.dark-theme .v-list {
  background-color: #1E1E2D !important;
}

.dark-theme .v-divider {
  border-color: rgba(255,255,255,0.12) !important;
}

/* Bordered скин в темной теме */
.dark-theme.bordered-skin .v-card {
  border: 1px solid rgba(255,255,255,0.12) !important;
}

/* CSS-переменная для цвета */
:root {
  --v-global-theme-primary: 230,4,16;
}

.v-application {
  --v-global-theme-primary: 230,4,16;
}
</style>