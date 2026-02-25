<!-- src/pages/MainPage.vue -->
<template>
  <v-container fluid class="page-content">
    <v-row>
      <!-- Левая колонка с графиком -->
      <v-col cols="12" md="8">
        <v-card class="mb-3" elevation="0">
          <v-card-title class="text-h6 font-weight-medium mb-2">
            <span class="text-primary">●</span> Денежные поступления
          </v-card-title>
          <v-card-text>
            <div class="chart-placeholder">
              <span class="text-grey">График денежных поступлений</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Правая колонка - теперь пустая (можно использовать для будущих виджетов) -->
      <v-col cols="12" md="4"></v-col>

      <!-- Топливные карты -->
      <v-col cols="12" md="8">
        <v-card elevation="0">
          <v-card-title class="text-h6 font-weight-medium mb-2">
            <span class="text-primary">●</span> Топливные карты
          </v-card-title>
          <v-card-text>
            <!-- Газпромнефть -->
            <v-row class="mb-2">
              <v-col cols="12" class="text-h5 mb-0 pb-0">Газпромнефть</v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" :style="{ backgroundColor: `rgb(${primaryColor})` }">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">87</span><br>Активные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #8F9197">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">100</span><br>Неактивные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #2A2A2A">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">73</span><br>Свободные
                </div>
              </v-col>
            </v-row>

            <!-- Газпромнефть (Фаэтон) -->
            <v-row class="mb-2">
              <v-col cols="12" class="text-h5 mb-0 pb-0">Газпромнефть (Фаэтон)</v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" :style="{ backgroundColor: `rgb(${primaryColor})` }">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">2</span><br>Активные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #8F9197">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">76</span><br>Неактивные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #2A2A2A">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">37</span><br>Свободные
                </div>
              </v-col>
            </v-row>

            <!-- Лукойл -->
            <v-row class="mb-2">
              <v-col cols="12" class="text-h5 mb-0 pb-0">Лукойл</v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" :style="{ backgroundColor: `rgb(${primaryColor})` }">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">68</span><br>Активные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #8F9197">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">174</span><br>Неактивные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #2A2A2A">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">283</span><br>Свободные
                </div>
              </v-col>
            </v-row>

            <!-- ППР -->
            <v-row class="mb-2">
              <v-col cols="12" class="text-h5 mb-0 pb-0">ППР</v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" :style="{ backgroundColor: `rgb(${primaryColor})` }">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">798</span><br>Активные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #8F9197">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">825</span><br>Неактивные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #2A2A2A">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">7128</span><br>Свободные
                </div>
              </v-col>
            </v-row>

            <!-- Роснефть -->
            <v-row class="mb-2">
              <v-col cols="12" class="text-h5 mb-0 pb-0">Роснефть</v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" :style="{ backgroundColor: `rgb(${primaryColor})` }">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">174</span><br>Активные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #8F9197">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">100</span><br>Неактивные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #2A2A2A">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">40</span><br>Свободные
                </div>
              </v-col>
            </v-row>

            <!-- Татнефть -->
            <v-row class="mb-2">
              <v-col cols="12" class="text-h5 mb-0 pb-0">Татнефть</v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" :style="{ backgroundColor: `rgb(${primaryColor})` }">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">409</span><br>Активные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #8F9197">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">464</span><br>Неактивные
                </div>
              </v-col>
              <v-col cols="4" class="d-flex flex-wrap gap-x-3">
                <div class="dynamic-avatar" style="background-color: #2A2A2A">
                  <v-icon color="white">ri-bank-card-line</v-icon>
                </div>
                <div>
                  <span class="text-h6">77</span><br>Свободные
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Получаем текущий основной цвет из localStorage
const primaryColor = ref('230,4,16')

// Функция обновления цвета
const updateColor = () => {
  const savedColor = localStorage.getItem('primary-color')
  if (savedColor) {
    primaryColor.value = savedColor
  }
}

// Слушаем изменения цвета
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'primary-color') {
    primaryColor.value = e.newValue || '230,4,16'
  }
}

// Также слушаем кастомное событие от кастомайзера
const handleColorChange = (e: CustomEvent) => {
  if (e.detail && e.detail.rgb) {
    primaryColor.value = e.detail.rgb
  }
}

onMounted(() => {
  updateColor()
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('primary-color-changed', handleColorChange as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('primary-color-changed', handleColorChange as EventListener)
})
</script>

<style scoped>
.page-content {
  padding: 24px;
  background-color: #F5F5F5;
  min-height: 100vh;
}

.chart-placeholder {
  height: 400px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.05);
}

.text-primary {
  color: rgb(var(--v-global-theme-primary)) !important;
}

/* Стили для динамических аватарок */
.dynamic-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

/* Стили для карточек */
:deep(.v-card) {
  border-radius: 12px !important;
  border: 1px solid rgba(0,0,0,0.05) !important;
}

.gap-x-3 {
  column-gap: 12px;
}
</style>