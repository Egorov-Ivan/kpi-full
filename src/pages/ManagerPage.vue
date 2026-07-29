<!-- src/pages/ManagerPage.vue -->
<template>
  <v-container fluid class="page-content">
    <v-row justify="start">
      <!-- Главная колонка (занимает всю ширину) -->
      <v-col cols="12" md="12">
        
        <!-- ПЕРВЫЙ РЯД - Статистика и график выполнения плана -->
        <v-row>
          <!-- ПЕРВЫЙ БЛОК - Статистика (75%) -->
          <v-col cols="12" md="9">
            <v-card class="stats-card h-80" elevation="0" border="sm">
              <v-card-text class="pa-4">
                <v-row>
                  <!-- Колонка с клиентами -->
                  <v-col cols="12" lg="4">
                    <div class="mb-3 font-weight-bold">Клиенты</div>
                    <v-avatar :color="`rgb(${primaryColor})`" size="48">
                      <v-icon size="24">ri-group-line</v-icon>
                    </v-avatar>
                    <div class="text-h4 mt-2">50</div>
                    <div class="text-subtitle-2 text-grey">Клиенты</div>
                  </v-col>

                  <!-- Колонка с картами -->
                  <v-col cols="12" lg="4">
                    <div class="mb-3 font-weight-bold">Карты</div>
                    <v-row>
                      <v-col cols="6">
                        <v-avatar color="#2A2A2A" size="48">
                          <v-icon color="white" size="24">ri-bank-card-line</v-icon>
                        </v-avatar>
                        <div class="text-h4 mt-2">334</div>
                        <div class="text-subtitle-2 text-grey">Все карты</div>
                      </v-col>
                      <v-col cols="6">
                        <v-avatar color="#8B8D93" size="48">
                          <v-icon color="white" size="24">ri-bank-card-line</v-icon>
                        </v-avatar>
                        <div class="text-h4 mt-2">250</div>
                        <div class="text-subtitle-2 text-grey">Активные карты</div>
                      </v-col>
                    </v-row>
                  </v-col>

                  <!-- Колонка со средним чеком -->
                  <v-col cols="12" lg="4">
                    <div class="mb-3 font-weight-bold">Средний чек за месяц</div>
                    <v-row>
                      <v-col cols="6">
                        <v-avatar color="#2A2A2A" size="48">
                          <v-icon color="white" size="24">ri-cash-line</v-icon>
                        </v-avatar>
                        <div class="text-h4 mt-2">22 222 ₽</div>
                        <div class="text-subtitle-2 text-grey">В рублях</div>
                      </v-col>
                      <v-col cols="6">
                        <v-avatar color="#8B8D93" size="48">
                          <v-icon color="white" size="24">ri-coins-line</v-icon>
                        </v-avatar>
                        <div class="text-h4 mt-2">500 л.</div>
                        <div class="text-subtitle-2 text-grey">В литрах</div>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- ВТОРОЙ БЛОК - График выполнения плана (25%) -->
          <v-col cols="12" md="3">
            <v-card class="stats-card h-100" elevation="0" border="sm">
              <v-card-title class="text-h6 text-center pa-4">
                <span class="text-primary"></span> Выполнение плана
              </v-card-title>
              <v-card-text class="pa-4 pt-0">
                <v-row>
                  <!-- График -->
                  <v-col cols="12" class="text-center">
                    <div class="d-flex justify-center align-center">
                      <svg viewBox="0 0 120 120" class="circular-chart" style="width: 140px; height: 140px;">
                        <!-- Фоновый круг -->
                        <circle
                          class="circle-bg"
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke="#f0f0f0"
                          stroke-width="12"
                        />
                        <!-- Прогресс (32%) -->
                        <circle
                          class="circle-progress"
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          :stroke="`rgb(${primaryColor})`"
                          stroke-width="12"
                          stroke-linecap="round"
                          :stroke-dasharray="circumference"
                          :stroke-dashoffset="circleDashoffset(32)"
                          transform="rotate(-90 60 60)"
                        />
                        <!-- Текст в центре -->
                        <text x="60" y="50" text-anchor="middle" class="chart-label">Выполнено</text>
                        <text x="60" y="75" text-anchor="middle" class="chart-value">32%</text>
                      </svg>
                    </div>
                  </v-col>
                  
                  <!-- Информация -->
                  <v-col cols="12" class="text-center">
                    <div class="text-h6 font-weight-bold mb-2">План на месяц</div>
                    <div class="text-body-2 mb-1">
                      <span class="text-grey">Выполнено:</span> 
                      <span class="font-weight-bold">32%</span>
                    </div>
                    
                    <!-- Чипы в одной строке -->
                    <div class="d-flex justify-center align-center flex-wrap ga-1">
                      <v-chip
                        size="small"
                        color="primary"
                        text-color="black"
                        variant="tonal"
                        class="font-weight-bold"
                      >
                        7 930 794 ₽
                      </v-chip>
                      
                      <span class="text-grey mx-1">из</span>
                      
                      <v-chip
                        size="small"
                        color="primary"
                        variant="tonal"
                        class="font-weight-bold"
                      >25 000 000 ₽
                      </v-chip>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
         
        <!-- КНОПКИ РАЗДЕЛОВ НАД ВТОРЫМ РЯДОМ -->
        <v-row class="mt-6">
          <v-col cols="12">
            <v-card class="stats-card" elevation="0" border="sm">
              <div class="d-flex pa-2">
                <v-btn
                  v-for="tab in tabs"
                  :key="tab.value"
                  :color="activeTab === tab.value ? 'primary' : 'grey'"
                  :variant="activeTab === tab.value ? 'flat' : 'text'"
                  class="tab-btn"
                  @click="activeTab = tab.value"
                >
                  <v-icon :color="activeTab === tab.value ? 'white' : 'grey'" class="mr-2">
                    {{ tab.icon }}
                  </v-icon>
                  {{ tab.title }}
                  <v-chip
                    v-if="tab.count"
                    size="x-small"
                    :color="activeTab === tab.value ? 'white' : 'grey'"
                    :variant="activeTab === tab.value ? 'flat' : 'tonal'"
                    class="ml-2"
                  >
                    {{ tab.count }}
                  </v-chip>
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- ДИНАМИЧЕСКИЙ КОНТЕНТ В ЗАВИСИМОСТИ ОТ ВЫБРАННОЙ ВКЛАДКИ -->
        <transition name="fade" mode="out-in">
          <div :key="activeTab">
            <!-- Вкладка: Пополнения -->
<div v-if="activeTab === 'replenishments'">
  <v-row class="mt-4">
    <!-- Левая колонка - Последние пополнения -->
    <v-col cols="12" md="4">
      <v-card class="stats-card" elevation="0" border="sm">
        <v-card-title class="d-flex align-center pa-4">
          <v-avatar size="32" color="primary" variant="tonal" class="mr-3">
            <v-icon size="20" color="primary">ri-bank-card-line</v-icon>
          </v-avatar>
          <span class="text-h6 font-weight-medium">Последние пополнения</span>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            color="primary"
            size="small"
            @click="refreshReplenishments"
          >
            <v-icon size="18">ri-refresh-line</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-0">
          <v-list class="pa-0" lines="two">
            <v-list-item
              v-for="(item, index) in displayedReplenishments"
              :key="index"
              class="pa-4"
              border-b
            >
              <template v-slot:prepend>
                
              </template>
              
              <template v-slot:title>
                <div class="d-flex align-center">
                  <span class="font-weight-medium">{{ item.name }}</span>
                </div>
              </template>
              
              <template v-slot:subtitle>
                <div class="d-flex align-center">
                  <v-icon size="14" color="grey" class="mr-1">ri-time-line</v-icon>
                  <span class="text-caption text-grey">{{ item.date }}</span>
                </div>
              </template>
              
              <template v-slot:append>
                <div class="text-right">
                  <div class="text-h6 font-weight-bold text-success">+{{ item.amount }} ₽</div>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <!-- Пагинация для последних пополнений -->
        <v-card-actions class="pa-4">
          <div class="d-flex align-center">
          </div>
          <v-spacer></v-spacer>
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            size="40"
            rounded="circle"
            density="compact"
            :total-visible="3"
          />
        </v-card-actions>
      </v-card>
    </v-col>
    
    <!-- Правая колонка - Пополнения по клиентам -->
    <v-col cols="12" md="8">
      <v-card class="stats-card" elevation="0" border="sm">
        <!-- Заголовок и фильтры -->
        <v-card-title class="d-flex align-center pa-4">
          <v-avatar size="32" color="primary" variant="tonal" class="mr-3">
            <v-icon size="20" color="primary">ri-bar-chart-line</v-icon>
          </v-avatar>
          <span class="text-h6 font-weight-medium">Пополнения по клиентам</span>
          <v-spacer></v-spacer>
          
          <!-- Фильтры -->
          <div class="d-flex align-center ga-3">
            <!-- Кнопка "Показать все" -->
            <v-btn
              color="primary"
              variant="elevated"
              size="small"
              @click="resetFilters"
            >
              Показать все
            </v-btn>
            
            <!-- Выбор периода -->
            <v-select
              v-model="selectedPeriod"
              :items="periods"
              label="Период"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 160px;"
              @update:modelValue="onPeriodChange"
            />
            
            <!-- Выбор даты -->
            <v-text-field
              v-model="dateRange"
              label="Выбор периода"
              density="compact"
              variant="outlined"
              readonly
              prepend-inner-icon="ri-calendar-line"
              hide-details
              style="width: 220px;"
              @click="showDatePicker = true"
            />
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <!-- Таблица -->
        <v-table class="text-no-wrap" style="max-height: 500px;">
          <thead>
            <tr>
              <th class="text-left">Клиент</th>
              <th class="text-right">Сумма пополнений</th>
              <th class="text-right">Кол-во операций</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in paginatedClients" :key="client.id">
              <td class="text-left">
                <a :href="`/clients/${client.id}`" class="text-primary text-decoration-none">
                  {{ client.name }}
                </a>
              </td>
              <td class="text-right font-weight-bold text-success">
                {{ formatAmount(client.totalAmount) }} ₽
              </td>
              <td class="text-right">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ client.operationsCount }}
                </v-chip>
              </td>
            </tr>
            
            <!-- Если нет данных -->
            <tr v-if="paginatedClients.length === 0">
              <td colspan="3" class="text-center pa-8 text-grey">
                Нет данных за выбранный период
              </td>
            </tr>
          </tbody>
        </v-table>
        
        <v-divider></v-divider>
        
        <!-- Итоги и пагинация -->
        <v-card-actions class="pa-4">
          <div class="d-flex align-center">
          </div>
          <v-spacer></v-spacer>
          <v-pagination
            v-model="clientsPage"
            :length="clientsTotalPages"
            size="40"
            rounded="circle"
            density="compact"
            :total-visible="5"
          />
        </v-card-actions>
        
        <!-- Date Picker -->
        <v-menu
          v-model="showDatePicker"
          :close-on-content-click="false"
          location="bottom"
          offset-y
        >
          <v-date-picker
            v-model="dates"
            range
            @update:model-value="onDateSelect"
          />
        </v-menu>
      </v-card>
    </v-col>
  </v-row>
</div>

            <!-- Вкладка: Сводка -->
            <div v-if="activeTab === 'operations'">
              <v-row class="mt-4">
                <v-col cols="12">
                  <v-card class="stats-card" elevation="0" border="sm">
                    <v-card-text class="pa-8 text-center text-grey">
                      Сводка в разработке
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- Вкладка: Карты без работы -->
            <div v-if="activeTab === 'cards'">
              <v-row class="mt-4">
                <v-col cols="12">
                  <v-card class="stats-card" elevation="0" border="sm">
                    <v-card-text class="pa-8 text-center text-grey">
                      Карты без работы в разработке
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </div>
        </transition>

        <!-- ЧЕТВЕРТЫЙ РЯД - Дополнительная информация (общая для всех вкладок) -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-card class="stats-card" elevation="0" border="sm">
              <v-card-text class="pa-4">
                <!-- Здесь можно добавить дополнительную информацию -->
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Типы данных
interface Tab {
  title: string
  value: string
  icon: string
  count: number
}

interface Replenishment {
  name: string
  amount: string
  date: string
}

interface Operation {
  date: string
  client: string
  type: string
  card: string
  amountRub: string
  amountL: string
  status: string
}

interface Card {
  number: string
  owner: string
  lastActivity: string
}

interface ClientReplenishment {
  id: number
  name: string
  totalAmount: number
  operationsCount: number
  lastReplenishment: string
}

// Состояние
const activeTab = ref('replenishments')
const searchCard = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// Данные для блока "Пополнения по клиентам"
const clientsData = ref<ClientReplenishment[]>([
  { id: 1, name: 'ИП Долгинов Николай Петрович', totalAmount: 45000, operationsCount: 3, lastReplenishment: '2026-03-23' },
  { id: 2, name: 'ООО "НефтьТранс"', totalAmount: 67500, operationsCount: 5, lastReplenishment: '2026-03-23' },
  { id: 3, name: 'ИП Петров Алексей Сергеевич', totalAmount: 32800, operationsCount: 2, lastReplenishment: '2026-03-22' },
  { id: 4, name: 'АО "Логистика"', totalAmount: 98200, operationsCount: 7, lastReplenishment: '2026-03-22' },
  { id: 5, name: 'ООО "Автопарк"', totalAmount: 23400, operationsCount: 1, lastReplenishment: '2026-03-21' },
  { id: 6, name: 'ООО "ТрансНефть"', totalAmount: 56700, operationsCount: 4, lastReplenishment: '2026-03-20' },
  { id: 7, name: 'ИП Смирнов Дмитрий Игоревич', totalAmount: 12500, operationsCount: 1, lastReplenishment: '2026-03-20' },
  { id: 8, name: 'АО "Нефтепродукт"', totalAmount: 89300, operationsCount: 6, lastReplenishment: '2026-03-19' },
  { id: 9, name: 'ИП Нагоев Шумаф Темботович', totalAmount: 134500, operationsCount: 9, lastReplenishment: '2026-03-18' },
  { id: 10, name: 'ИП Никитин Виктор Сергеевич', totalAmount: 45600, operationsCount: 3, lastReplenishment: '2026-03-18' },
  { id: 11, name: 'ИП Алексеев Эдуард Владимирович', totalAmount: 67800, operationsCount: 4, lastReplenishment: '2026-03-17' },
  { id: 12, name: 'ИП Андреев Сергей Сергеевич', totalAmount: 23900, operationsCount: 2, lastReplenishment: '2026-03-16' },
  { id: 13, name: 'ООО "Газпром нефть"', totalAmount: 156700, operationsCount: 11, lastReplenishment: '2026-03-15' },
  { id: 14, name: 'ИП Козлов Андрей Викторович', totalAmount: 87600, operationsCount: 5, lastReplenishment: '2026-03-14' },
  { id: 15, name: 'АО "ТрансАвто"', totalAmount: 54300, operationsCount: 3, lastReplenishment: '2026-03-13' },
])

// Фильтры для блока клиентов
const selectedPeriod = ref('30 дней')
const periods = ref(['7 дней', '14 дней', '30 дней', '90 дней', '365 дней', 'Все время'])
const dateRange = ref('')
const showDatePicker = ref(false)
const dates = ref<Date[]>([])
const clientsPage = ref(1)
const clientsItemsPerPage = 10

// Данные для кнопок табов
const tabs = ref<Tab[]>([
  { title: 'Пополнения', value: 'replenishments', icon: 'ri-bank-card-line', count: 247 },
  { title: 'Сводка', value: 'operations', icon: 'ri-history-line', count: 156 },
  { title: 'Карты без Работы', value: 'cards', icon: 'ri-bank-card-2-line', count: 334 }
])

// Данные для пополнений
const replenishments = ref<Replenishment[]>([
  { name: 'ИП Иванов Иван Иванович', amount: '45 000', date: 'Сегодня, 14:23' },
  { name: 'ООО "НефтьТранс"', amount: '67 500', date: 'Сегодня, 11:45' },
  { name: 'ИП Петров Алексей Сергеевич', amount: '32 800', date: 'Вчера, 16:30' },
  { name: 'АО "Логистика"', amount: '98 200', date: 'Вчера, 09:15' },
  { name: 'ООО "Автопарк"', amount: '23 400', date: '17.03.2026' },
  { name: 'ООО "ТрансНефть"', amount: '56 700', date: '16.03.2026' },
  { name: 'ИП Смирнов', amount: '12 500', date: '16.03.2026' },
  { name: 'АО "Нефтепродукт"', amount: '89 300', date: '15.03.2026' }
])

// Данные для топ-клиентов
const topClients = ref([
  { name: 'ООО "НефтьТранс"', amount: '2,450,000' },
  { name: 'ИП Петров А.С.', amount: '1,890,000' },
  { name: 'АО "Логистика"', amount: '1,560,000' }
])

// Данные для операций
const operations = ref<Operation[]>([
  { date: '18.03.2026', client: 'ООО "НефтьТранс"', type: 'Дизель', card: '**** 1234', amountRub: '45,000 ₽', amountL: '900 л', status: 'Выполнено' },
  { date: '18.03.2026', client: 'ИП Петров А.С.', type: 'АИ-95', card: '**** 5678', amountRub: '12,500 ₽', amountL: '250 л', status: 'Выполнено' },
  { date: '17.03.2026', client: 'АО "Логистика"', type: 'Дизель', card: '**** 9012', amountRub: '67,500 ₽', amountL: '1,350 л', status: 'Выполнено' },
  { date: '17.03.2026', client: 'ООО "Автопарк"', type: 'АИ-92', card: '**** 3456', amountRub: '8,900 ₽', amountL: '200 л', status: 'В обработке' },
  { date: '16.03.2026', client: 'ИП Сидоров', type: 'АИ-95', card: '**** 7890', amountRub: '15,200 ₽', amountL: '300 л', status: 'Выполнено' }
])

// Данные для неактивных карт
const inactiveCards = ref<Card[]>([
  { number: '**** 1234', owner: 'ИП Иванов И.И.', lastActivity: '01.02.2026' },
  { number: '**** 5678', owner: 'ООО "НефтьТранс"', lastActivity: '15.01.2026' },
  { number: '**** 9012', owner: 'ИП Петров А.С.', lastActivity: '20.12.2025' },
  { number: '**** 3456', owner: 'АО "Логистика"', lastActivity: '05.02.2026' },
  { number: '**** 7890', owner: 'ООО "Автопарк"', lastActivity: '10.01.2026' }
])

// Данные для популярных продуктов
const popularProducts = ref([
  { name: 'Дизельное топливо', percent: 45, color: 'primary' },
  { name: 'АИ-95', percent: 30, color: 'success' },
  { name: 'АИ-92', percent: 20, color: 'warning' },
  { name: 'Газ', percent: 5, color: 'info' }
])

// Данные для быстрых действий
const quickActions = ref([
  { label: 'Новый клиент', icon: 'ri-user-add-line', color: 'primary' },
  { label: 'Зачислить', icon: 'ri-bank-card-line', color: 'success' },
  { label: 'Отчет', icon: 'ri-file-chart-line', color: 'info' },
  { label: 'Настройки', icon: 'ri-settings-line', color: 'grey' }
])

// Вычисляемые свойства
const totalPages = computed(() => Math.ceil(replenishments.value.length / itemsPerPage))

const displayedReplenishments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return replenishments.value.slice(start, end)
})

const filteredInactiveCards = computed(() => {
  if (!searchCard.value) return inactiveCards.value
  return inactiveCards.value.filter(card => 
    card.number.includes(searchCard.value) || 
    card.owner.toLowerCase().includes(searchCard.value.toLowerCase())
  )
})

// Фильтрация клиентов по периоду
const filteredClients = computed(() => {
  let filtered = [...clientsData.value]
  
  // Фильтрация по периоду
  if (selectedPeriod.value !== 'Все время') {
    const days = parseInt(selectedPeriod.value)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    filtered = filtered.filter(client => {
      const clientDate = new Date(client.lastReplenishment)
      return clientDate >= cutoffDate
    })
  }
  
  // Фильтрация по диапазону дат
  if (dates.value.length === 2 && dateRange.value) {
    const startDate = new Date(dates.value[0])
    const endDate = new Date(dates.value[1])
    endDate.setHours(23, 59, 59)
    
    filtered = filtered.filter(client => {
      const clientDate = new Date(client.lastReplenishment)
      return clientDate >= startDate && clientDate <= endDate
    })
  }
  
  // Сортировка по сумме пополнений (по убыванию)
  return filtered.sort((a, b) => b.totalAmount - a.totalAmount)
})

const clientsTotalPages = computed(() => Math.ceil(filteredClients.value.length / clientsItemsPerPage))

const paginatedClients = computed(() => {
  const start = (clientsPage.value - 1) * clientsItemsPerPage
  const end = start + clientsItemsPerPage
  return filteredClients.value.slice(start, end)
})

const primaryColor = ref<string>('230,4,16')

// Для кругового графика
const circumference = computed<number>(() => {
  return 2 * Math.PI * 54
})

const circleDashoffset = (percent: number): number => {
  return circumference.value * (1 - percent / 100)
}

// Форматирование суммы
const formatAmount = (amount: number): string => {
  return amount.toLocaleString('ru-RU')
}

// Сброс фильтров
const resetFilters = () => {
  selectedPeriod.value = '30 дней'
  dateRange.value = ''
  dates.value = []
  clientsPage.value = 1
}

// Обработчик изменения периода
const onPeriodChange = (period: string) => {
  console.log('Период изменен:', period)
  dateRange.value = ''
  dates.value = []
  clientsPage.value = 1
}

// Обработчик выбора дат
const onDateSelect = (value: Date[]) => {
  if (value.length === 2) {
    dates.value = value
    const start = value[0].toLocaleDateString('ru-RU')
    const end = value[1].toLocaleDateString('ru-RU')
    dateRange.value = `${start} - ${end}`
    showDatePicker.value = false
    selectedPeriod.value = ''
    clientsPage.value = 1
  }
}

// Методы
const switchTab = (tabValue: string) => {
  activeTab.value = tabValue
  currentPage.value = 1
  searchCard.value = ''
  console.log(`Switched to tab: ${tabValue}`)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const refreshReplenishments = () => {
  console.log('Refreshing replenishments...')
}

const exportOperations = () => {
  console.log('Exporting operations...')
}

const loadMoreOperations = () => {
  console.log('Loading more operations...')
}

const activateCard = (card: Card) => {
  console.log('Activating card:', card)
}

const massActivateCards = () => {
  console.log('Mass activating cards...')
}

const handleQuickAction = (action: string) => {
  console.log('Quick action:', action)
}

const getAvatarColor = (name: string) => {
  const colors = ['primary-lighten-2', 'info-lighten-2', 'warning-lighten-2', 'success-lighten-2', 'grey-lighten-2']
  const index = name.length % colors.length
  return colors[index]
}

const getInitials = (name: string) => {
  return name.split(' ').map(word => word[0]).join('').slice(0, 2)
}

const getFuelTypeColor = (type: string): string => {
  switch(type) {
    case 'Дизель': return 'primary'
    case 'АИ-95': return 'success'
    case 'АИ-92': return 'warning'
    default: return 'grey'
  }
}

const updateColor = (): void => {
  const savedColor = localStorage.getItem('primary-color')
  if (savedColor) {
    primaryColor.value = savedColor
  }
}

const handleStorageChange = (e: StorageEvent): void => {
  if (e.key === 'primary-color') {
    primaryColor.value = e.newValue || '230,4,16'
  }
}

const handleColorChange = (e: Event): void => {
  const customEvent = e as CustomEvent
  if (customEvent.detail && customEvent.detail.rgb) {
    primaryColor.value = customEvent.detail.rgb
  }
}

onMounted((): void => {
  updateColor()
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('primary-color-changed', handleColorChange)
})

onUnmounted((): void => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('primary-color-changed', handleColorChange)
})
</script>

<style scoped>
.page-content {
  padding: 24px;
  background-color: #F5F5F5;
  min-height: 100vh;
}

.stats-card {
  border-radius: 16px !important;
  background-color: white !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.h-100 {
  height: 100%;
}

.text-h1 {
  font-size: 2.5rem !important;
  font-weight: 700 !important;
}

.text-h3 {
  font-size: 1.25rem !important;
  font-weight: 500 !important;
}

.text-h4 {
  font-size: 1.5rem !important;
  font-weight: 600 !important;
}

.text-h6 {
  font-size: 1rem !important;
  font-weight: 600 !important;
}

.mb-3 {
  margin-bottom: 16px !important;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.8);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mt-2 {
  margin-top: 12px !important;
}

.text-grey {
  color: rgba(0, 0, 0, 0.6) !important;
  font-size: 0.875rem;
}

/* Стили для кругового графика */
.circular-chart {
  display: block;
}

.circle-bg {
  stroke: #f0f0f0;
}

.circle-progress {
  transition: stroke-dashoffset 0.3s ease;
}

.chart-label {
  font-size: 10px;
  fill: #666;
  font-weight: 500;
}

.chart-value {
  font-size: 18px;
  fill: #333;
  font-weight: 700;
}

/* Стили для таблицы клиентов */
.v-table {
  font-size: 0.875rem;
}

.v-table th {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  background-color: #fafafa;
  padding: 12px 16px;
}

.v-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.v-table tr:hover td {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Стили для ссылок */
.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}

.text-decoration-none {
  text-decoration: none;
}

.text-decoration-none:hover {
  text-decoration: underline;
}

/* Анимация переключения вкладок */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Стили для поиска */
.search-field {
  max-width: 250px;
}

.tab-btn {
  text-transform: none !important;
  letter-spacing: normal !important;
  font-weight: 500 !important;
}

/* Адаптивность */
@media (max-width: 960px) {
  .page-content {
    padding: 12px;
  }
  
  .text-h1 {
    font-size: 2rem !important;
  }
  
  .text-h3 {
    font-size: 1rem !important;
  }
  
  .text-h4 {
    font-size: 1.25rem !important;
  }
}
</style>