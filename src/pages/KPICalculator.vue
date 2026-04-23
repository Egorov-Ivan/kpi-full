<!-- src/pages/KpiCalculator.vue -->
<template>
  <v-container fluid class="page-content">
    <v-row>
      <v-col cols="12">
        <!-- Заголовок страницы -->
        <div class="d-flex align-center mb-4">
          <v-avatar color="primary" size="48" class="mr-4">
            <v-icon size="28" color="white">ri-bar-chart-grouped-line</v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-medium mb-1">Рейтинг менеджеров</h1>
            <p class="text-subtitle-1 text-grey">План / Факт / Выплаты за {{ selectedMonthName }} {{ selectedYear }}</p>
          </div>
        </div>

        <!-- Карточка с рейтингом -->
        <v-card elevation="0" class="rating-card">
          <!-- Период и фильтры -->
          <div class="pa-4 d-flex align-center gap-4 flex-wrap">
            <div style="min-width: 200px;">
              <v-select
                v-model="selectedYear"
                :items="years"
                label="Год"
                variant="outlined"
                density="compact"
                hide-details
              ></v-select>
            </div>

            <div style="min-width: 200px;">
              <v-select
                v-model="selectedMonth"
                :items="months"
                item-title="title"
                item-value="value"
                label="Месяц"
                variant="outlined"
                density="compact"
                hide-details
              ></v-select>
            </div>
            
            <v-spacer></v-spacer>

            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="ri-refresh-line"
              @click="refreshData"
            >
              Обновить
            </v-btn>
          </div>

          <!-- Статистика по буферу -->
          <v-divider></v-divider>
          
          <div class="pa-4 d-flex justify-space-between align-center">
            <div class="text-caption text-grey">
              <v-icon size="small" color="grey" class="mr-1">ri-database-2-line</v-icon>
              Буфер данных: 
              <strong>{{ bufferStats.totalOperations }}</strong> операций, 
              <strong>{{ bufferStats.totalClients }}</strong> клиентов
            </div>
            <div class="text-caption">
                <span class="text-grey">Прогноз на конец месяца:</span>
                <span class="font-weight-medium ml-2">{{ formatMoney(forecast) }}</span>
              </div>
            <div class="text-caption text-grey">
              <v-icon size="small" color="grey" class="mr-1">ri-calendar-line</v-icon>
              Период данных: {{ bufferStats.dateRange.first }} — {{ bufferStats.dateRange.last }}
            </div>
          </div>

          <v-divider></v-divider>

          <!-- Таблица рейтинга -->
          <v-data-table
            :headers="ratingHeaders"
            :items="managerRatings"
            :loading="loading"
            loading-text="Загрузка данных..."
            class="rating-table"
            hover
            items-per-page="-1"
            fixed-header
          >
            <!-- Место в рейтинге -->
            <template v-slot:item.rank="{ index }">
              <div class="rank-cell">
                <span class="rank-number">#{{ index + 1 }}</span>
              </div>
            </template>

            <!-- Менеджер -->
            <template v-slot:item.manager="{ item }">
              <div class="d-flex align-center gap-3">
                <v-avatar :color="getRoleColor(item.role)" size="36">
                  <v-icon color="white">{{ getRoleIcon(item.role) }}</v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ item.name }}</div>
                  <div class="text-caption text-grey">{{ item.role }}</div>
                </div>
              </div>
            </template>

            <!-- План пополнений -->
            <template v-slot:item.plan="{ item }">
              <div class="text-right font-weight-medium">
                {{ formatMoney(item.plan) }}
              </div>
            </template>

            <!-- Факт (пополнения) -->
            <template v-slot:item.fact="{ item }">
              <div class="text-right">
                <span class="font-weight-medium">{{ formatMoney(item.fact) }}</span>
                <div class="text-caption text-grey">
                  {{ item.operationsCount }} опер.
                </div>
              </div>
            </template>

            <!-- % выполнения плана -->
            <template v-slot:item.planPercent="{ item }">
              <div class="d-flex align-center gap-2">
                <v-progress-linear
                  v-model="item.planPercent"
                  :color="getPercentColor(item.planPercent)"
                  height="8"
                  rounded
                  class="flex-grow-1"
                ></v-progress-linear>
                <span class="text-body-2 font-weight-medium" :class="getPercentTextColor(item.planPercent)">
                  {{ item.planPercent.toFixed(1) }}%
                </span>
              </div>
            </template>

            <!-- Сумма выплаты -->
            <template v-slot:item.payment="{ item }">
              <div class="text-right">
                <span class="text-h6 font-weight-bold" :class="getPaymentColor(item.payment)">
                  {{ formatMoney(item.payment) }}
                </span>
              </div>
            </template>

            <!-- Действия -->
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="openManagerDetails(item)"
              >
                <v-icon>ri-eye-line</v-icon>
                <v-tooltip activator="parent" location="top">Детали</v-tooltip>
              </v-btn>
            </template>

            <!-- Пустое состояние -->
            <template v-slot:no-data>
              <div class="text-center pa-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">ri-user-search-line</v-icon>
                <h3 class="text-h6 text-grey">Нет данных за выбранный период</h3>
                <p class="text-body-2 text-grey">Попробуйте выбрать другой месяц</p>
              </div>
            </template>
          </v-data-table>

          <!-- Итоги -->
          <v-divider></v-divider>
          
          <div class="pa-4 d-flex justify-space-between align-center">
            <div class="text-caption text-grey">
              <v-icon size="small" color="grey" class="mr-1">ri-information-line</v-icon>
              Период: {{ selectedMonthName }} {{ selectedYear }}
            </div>
            
            <div class="d-flex gap-4">
              
              <div class="text-caption">
                <span class="text-grey">Общий факт:</span>
                <span class="font-weight-medium ml-2">{{ formatMoney(totalFact) }}</span>
              </div>
              <div class="text-caption">
                <span class="text-grey">Средний % плана:</span>
                <span class="font-weight-medium ml-2">{{ averagePlanPercent.toFixed(1) }}%</span>
              </div>
              <div class="text-caption">
                <span class="text-grey">Общая выплата:</span>
                <span class="font-weight-medium ml-2">{{ formatMoney(totalPayment) }}</span>
              </div>
            </div>
          </div>
        </v-card>

        <!-- Модальное окно деталей менеджера -->
        <v-dialog v-model="showDetailsDialog" max-width="1200" @update:model-value="saveDialogState">
          <v-card v-if="selectedManagerDetails">
            <v-card-title class="d-flex align-center pa-4">
              <v-avatar :color="getRoleColor(selectedManagerDetails.role)" size="40" class="mr-3">
                <v-icon color="white">{{ getRoleIcon(selectedManagerDetails.role) }}</v-icon>
              </v-avatar>
              <div>
                <span class="text-h5">{{ selectedManagerDetails.name }}</span>
                <div class="text-caption text-grey">{{ selectedManagerDetails.role }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-btn
                icon
                variant="text"
                @click="showDetailsDialog = false"
              >
                <v-icon>ri-close-line</v-icon>
              </v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text class="pa-4">
              <!-- Статистика по менеджеру -->
              <v-row>
                <v-col cols="3">
                  <v-card variant="tonal" class="pa-4">
                    <div class="text-caption text-grey mb-1">Пополнений за месяц</div>
                    <div class="text-h4 font-weight-bold text-primary">
                      {{ selectedManagerDetails.operationsCount }}
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card variant="tonal" class="pa-4">
                    <div class="text-caption text-grey mb-1">Сумма пополнений</div>
                    <div class="text-h4 font-weight-bold text-success">
                      {{ formatMoney(selectedManagerDetails.fact) }}
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card variant="tonal" class="pa-4">
                    <div class="text-caption text-grey mb-1">Пополнения с НДС</div>
                    <div class="text-h5 font-weight-bold text-info">
                      {{ formatMoney(selectedManagerDetails.vatAmount || 0) }}
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card variant="tonal" class="pa-4">
                    <div class="text-caption text-grey mb-1">KPI НДС (ручной ввод)</div>
                    <div class="text-h5 font-weight-bold text-info">
                      {{ formatMoney(manualKpiVat[selectedManagerDetails.id] || 0) }}
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Выполнение плана пополнений -->
              <v-card class="mt-4" variant="tonal">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="font-weight-medium">Выполнение плана пополнений</span>
                    <span class="text-h6" :class="getPercentTextColor(selectedManagerDetails.planPercent)">
                      {{ selectedManagerDetails.planPercent.toFixed(1) }}%
                    </span>
                  </div>
                  <v-progress-linear
                    v-model="selectedManagerDetails.planPercent"
                    :color="getPercentColor(selectedManagerDetails.planPercent)"
                    height="18"
                    rounded
                  ></v-progress-linear>
                  <div class="d-flex justify-space-between mt-2 text-caption text-grey">
                    <span>План: {{ formatMoney(selectedManagerDetails.plan) }}</span>
                    <span>Факт: {{ formatMoney(selectedManagerDetails.fact) }}</span>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Табы с детализацией -->
              <v-tabs
                v-model="activeTab"
                class="mt-4"
                color="primary"
                grow
              >
                <v-tab value="maintenance">
                  <v-icon start>ri-percent-line</v-icon>
                  Ведение
                </v-tab>
                <v-tab value="kpiNoVat">
                  <v-icon start>ri-bar-chart-2-line</v-icon>
                  KPI Без НДС
                </v-tab>
                <v-tab value="kpiVat">
                  <v-icon start>ri-file-copy-line</v-icon>
                  KPI НДС
                </v-tab>
              </v-tabs>

              <v-window v-model="activeTab" class="mt-4">
                <!-- Таб: Ведение -->
                <v-window-item value="maintenance">
                  <!-- Выбор ставки ведения -->
                  <v-card class="mb-4" variant="tonal">
                    <v-card-text>
                      <div class="text-subtitle-1 font-weight-medium mb-3">Ставка ведения</div>
                      <v-btn-toggle
                        v-model="selectedRate[selectedManagerDetails.id]"
                        mandatory
                        divided
                        class="flex-wrap"
                      >
                        <v-btn
                          v-for="rate in store.maintenanceRates"
                          :key="rate.id"
                          :value="rate.value"
                          :color="selectedRate[selectedManagerDetails.id] === rate.value ? 'primary' : undefined"
                          variant="outlined"
                          class="ma-1"
                          :disabled="!isRateAllowed(selectedManagerDetails.originalManager, rate.id)"
                        >
                          {{ rate.label }}
                        </v-btn>
                      </v-btn-toggle>
                      
                      <div class="d-flex justify-space-between mt-3 text-caption text-grey">
                        <span>Доступные ставки: 
                          {{ getAllowedRates(selectedManagerDetails.originalManager).join(', ') }}
                        </span>
                      </div>
                    </v-card-text>
                  </v-card>

                  <!-- Расчет выплаты -->
                  <v-card class="mb-4" variant="tonal" color="primary-light">
                    <v-card-text>
                      <div class="d-flex align-center justify-space-between">
                        <div>
                          <div class="text-caption text-grey">Сумма выплаты (ведение)</div>
                          <div class="text-h3 font-weight-bold text-primary">
                            {{ formatMoney(calculatePayment(selectedManagerDetails)) }}
                          </div>
                          <div class="text-caption text-grey mt-2">
                            Рассчитано как {{ formatMoney(selectedManagerDetails.noVatAmount || 0) }} × 
                            {{ (getSelectedRate(selectedManagerDetails) * 100).toFixed(2) }}%
                          </div>
                        </div>
                        <v-icon size="48" color="primary">ri-money-cny-circle-line</v-icon>
                      </div>
                    </v-card-text>
                  </v-card>

                  <!-- Детализация по клиентам (ведение) -->
                  <v-expansion-panels>
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        <v-icon start>ri-team-line</v-icon>
                        Детализация по клиентам ({{ maintenanceClientDetails.length }})
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table
                          :headers="maintenanceClientHeaders"
                          :items="maintenanceClientDetails"
                          items-per-page="-1"
                          density="compact"
                          class="client-table"
                          hover
                        >
                          <!-- Клиент -->
                          <template v-slot:item.client="{ item }">
                            <div class="font-weight-medium">{{ item.client }}</div>
                          </template>

                          <!-- Сумма пополнений (NO_VAT) -->
                          <template v-slot:item.totalAmount="{ item }">
                            <div class="text-right">
                              {{ formatMoney(item.totalAmount) }}
                            </div>
                          </template>

                          <!-- Сумма ведения -->
                          <template v-slot:item.maintenance="{ item }">
                            <div class="text-right text-primary font-weight-medium">
                              {{ formatMoney(item.maintenance) }}
                            </div>
                          </template>

                          <!-- Доля в общем ведении -->
                          <template v-slot:item.share="{ item }">
                            <div class="text-right">
                              {{ item.share.toFixed(1) }}%
                            </div>
                          </template>

                          <!-- Количество операций -->
                          <template v-slot:item.operations="{ item }">
                            <div class="text-center">
                              <v-chip size="x-small" variant="tonal">
                                {{ item.operationsCount }}
                              </v-chip>
                            </div>
                          </template>
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-window-item>

                <!-- Таб: KPI NO VAT -->
                <v-window-item value="kpiNoVat">
                  <!-- Базовая статистика -->
                  <v-row>
                    <v-col cols="4">
                      <v-card variant="tonal" class="pa-4">
                        <div class="text-caption text-grey mb-1">Пополнений без НДС</div>
                        <div class="text-h4 font-weight-bold text-warning">
                          {{ formatMoney(selectedManagerDetails.noVatAmount || 0) }}
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="4">
                      <v-card variant="tonal" class="pa-4">
                        <div class="text-caption text-grey mb-1">KPI к выплате (ДА)</div>
                        <div class="text-h4 font-weight-bold text-success">
                          {{ kpiClientDetails.active.length }}
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="4">
                      <v-card variant="tonal" class="pa-4">
                        <div class="text-caption text-grey mb-1">Остальные клиенты</div>
                        <div class="text-h4 font-weight-bold text-grey">
                          {{ kpiClientDetails.was.length + kpiClientDetails.non.length }}
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Выбор ставки KPI -->
                  <v-card class="mt-4 mb-4" variant="tonal">
                    <v-card-text>
                      <div class="text-subtitle-1 font-weight-medium mb-3">Ставка KPI Без НДС</div>
                      <v-btn-toggle
                        v-model="selectedKpiRate[selectedManagerDetails.id]"
                        mandatory
                        divided
                        class="flex-wrap"
                      >
                        <v-btn
                          v-for="rate in kpiNoVatRates"
                          :key="rate.id"
                          :value="rate.value"
                          :color="selectedKpiRate[selectedManagerDetails.id] === rate.value ? 'success' : undefined"
                          variant="outlined"
                          class="ma-1"
                        >
                          {{ rate.label }}
                        </v-btn>
                      </v-btn-toggle>
                    </v-card-text>
                  </v-card>

                  <!-- Расчет KPI -->
                  <v-card class="mb-4" variant="tonal" color="success-light">
                    <v-card-text>
                      <div class="d-flex align-center justify-space-between">
                        <div>
                          <div class="text-caption text-grey">Сумма KPI Без НДС</div>
                          <div class="text-h3 font-weight-bold text-success">
                            {{ formatMoney(calculateKpiAmount(selectedManagerDetails)) }}
                          </div>
                          <div class="text-caption text-grey mt-2">
                            Рассчитано как {{ formatMoney(kpiClientBaseTotal) }} × 
                            {{ (getSelectedKpiRate(selectedManagerDetails) * 100).toFixed(2) }}%
                          </div>
                          <div class="text-caption text-grey mt-1">
                            База KPI: Сумма максимальных пополнений за бонусный период
                          </div>
                        </div>
                        <v-icon size="48" color="success">ri-bar-chart-2-line</v-icon>
                      </div>
                    </v-card-text>
                  </v-card>

                  <!-- Выпадающий список 1: Клиенты с бонусом (ДА) -->
                  <v-expansion-panels class="mb-2">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="bg-success-light">
                        <v-icon start color="success">ri-checkbox-circle-line</v-icon>
                        KPI к выплате ({{ kpiClientDetails.active.length }})
                        <template v-slot:actions>
                          <v-chip size="small" color="success" variant="tonal">
                            {{ formatMoney(kpiClientBaseTotal) }}
                          </v-chip>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table
                          :headers="kpiClientHeaders"
                          :items="kpiClientDetails.active"
                          items-per-page="-1"
                          density="compact"
                          class="client-table"
                          hover
                        >
                          <!-- Клиент -->
                          <template v-slot:item.client="{ item }">
                            <div class="font-weight-medium">{{ item.client }}</div>
                          </template>

                          <!-- База KPI (максимальная сумма за период) -->
                          <template v-slot:item.kpiBase="{ item }">
                            <div class="text-right">
                              <div class="text-warning font-weight-medium">
                                {{ formatMoney(item.displayAmount) }}
                              </div>
                              <div v-if="item.baseInfo" class="text-caption text-grey">
                                {{ item.baseInfo }}
                              </div>
                            </div>
                          </template>

                          <!-- Сумма KPI -->
                          <template v-slot:item.kpiAmount="{ item }">
                            <div class="text-right">
                              <div class="text-success font-weight-medium">
                                {{ formatMoney(item.kpiAmount) }}
                              </div>
                              <div class="text-caption text-grey">
                                ставка {{ (getSelectedKpiRate(selectedManagerDetails) * 100).toFixed(2) }}%
                              </div>
                            </div>
                          </template>

                          <!-- Бонусный месяц -->
                          <template v-slot:item.bonusMonth="{ item }">
                            <div class="text-center">
                              <v-chip 
                                size="x-small" 
                                :color="item.maxAmountMonth ? 'success' : 'grey'"
                                variant="tonal"
                              >
                                {{ item.maxAmountMonth || '—' }}
                              </v-chip>
                            </div>
                          </template>

                          <!-- Первая заправка -->
                          <template v-slot:item.firstFillDate="{ item }">
                            <div class="text-center text-caption">
                              {{ item.firstFillDate || '—' }}
                            </div>
                          </template>

                          <!-- Количество операций -->
                          <template v-slot:item.operations="{ item }">
                            <div class="text-center">
                              <v-chip 
                                size="x-small" 
                                :color="item.operationsCount === 0 ? 'grey' : 'primary'"
                                variant="tonal"
                              >
                                {{ item.operationsCount }}
                              </v-chip>
                            </div>
                          </template>
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>

                  <!-- Выпадающий список 2: Клиенты с историей бонуса (БЫЛ) -->
                  <v-expansion-panels class="mb-2">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="bg-warning-light">
                        <v-icon start color="warning">ri-history-line</v-icon>
                        KPI был получен ранее ({{ kpiClientDetails.was.length }})
                        <template v-slot:actions>
                          <v-chip size="small" color="warning" variant="tonal">
                            {{ formatMoney(wasKpiClientNoVatTotal) }}
                          </v-chip>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table
                          :headers="wasKpiClientHeaders"
                          :items="kpiClientDetails.was"
                          items-per-page="-1"
                          density="compact"
                          class="client-table"
                          hover
                        >
                          <!-- Клиент -->
                          <template v-slot:item.client="{ item }">
                            <div class="font-weight-medium">{{ item.client }}</div>
                          </template>

                          <!-- Сумма NO_VAT -->
                          <template v-slot:item.noVatAmount="{ item }">
                            <div class="text-right text-warning font-weight-medium">
                              {{ formatMoney(item.noVatAmount) }}
                            </div>
                          </template>

                          <!-- Статус в файле -->
                          <template v-slot:item.fileStatus="{ item }">
                            <div class="text-center">
                              <v-chip 
                                size="x-small" 
                                color="warning"
                                variant="tonal"
                                v-if="item.fileStatus"
                              >
                                {{ item.fileStatus }}
                              </v-chip>
                              <span v-else>—</span>
                            </div>
                          </template>

                          <!-- Месяц бонуса (если был) -->
                          <template v-slot:item.bonusMonth="{ item }">
                            <div class="text-center text-caption">
                              {{ item.bonusMonth || '—' }}
                            </div>
                          </template>

                          <!-- Первая заправка -->
                          <template v-slot:item.firstFillDate="{ item }">
                            <div class="text-center text-caption">
                              {{ item.firstFillDate || '—' }}
                            </div>
                          </template>

                          <!-- Количество операций -->
                          <template v-slot:item.operations="{ item }">
                            <div class="text-center">
                              <v-chip size="x-small" variant="tonal">
                                {{ item.operationsCount }}
                              </v-chip>
                            </div>
                          </template>
                          
                          <!-- Действия -->
                          <template v-slot:item.actions="{ item }">
                            <div class="d-flex gap-1">
                              <v-btn
                                v-if="showKpiButton"
                                size="x-small"
                                color="warning"
                                variant="tonal"
                                @click="markSingleClientKpi(item)"
                              >
                                <v-icon size="small">ri-check-double-line</v-icon>
                                KPI
                              </v-btn>
                            </div>
                          </template>
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>

                  <!-- Выпадающий список 3: Клиенты без бонуса (НЕТ) -->
                  <v-expansion-panels>
                    <v-expansion-panel>
                      <v-expansion-panel-title class="text-grey">
                        <v-icon start color="grey">ri-eye-off-line</v-icon>
                        KPI еще не получен ({{ kpiClientDetails.non.length }})
                        <template v-slot:actions>
                          <v-chip size="small" color="grey" variant="tonal">
                            {{ formatMoney(nonKpiClientNoVatTotal) }}
                          </v-chip>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table
                          :headers="nonKpiClientHeaders"
                          :items="kpiClientDetails.non"
                          items-per-page="-1"
                          density="compact"
                          class="client-table"
                          hover
                        >
                          <!-- Клиент -->
                          <template v-slot:item.client="{ item }">
                            <div class="font-weight-medium">{{ item.client }}</div>
                          </template>

                          <!-- Максимальная сумма за 3 месяца -->
                          <template v-slot:item.displayAmount="{ item }">
                            <div class="text-right">
                              <span class="font-weight-medium text-warning">{{ formatMoney(item.displayAmount) }}</span>
                              <div v-if="item.monthInfo" class="text-caption text-grey">
                                {{ item.monthInfo }}
                              </div>
                            </div>
                          </template>

                          <!-- Сумма NO_VAT -->
                          <template v-slot:item.noVatAmount="{ item }">
                            <div class="text-right text-grey">
                              {{ formatMoney(item.noVatAmount) }}
                            </div>
                          </template>

                          <!-- Статус в файле -->
                          <template v-slot:item.fileStatus="{ item }">
                            <div class="text-center">
                              <v-chip 
                                size="x-small" 
                                :color="item.fileStatus === 'НЕТ' ? 'grey' : 'warning'"
                                variant="tonal"
                                v-if="item.fileStatus"
                              >
                                {{ item.fileStatus }}
                              </v-chip>
                              <span v-else>—</span>
                            </div>
                          </template>

                          <!-- Первая заправка -->
                          <template v-slot:item.firstFillDate="{ item }">
                            <div class="text-center text-caption">
                              {{ item.firstFillDate || '—' }}
                            </div>
                          </template>

                          <!-- Количество операций -->
                          <template v-slot:item.operations="{ item }">
                            <div class="text-center">
                              <v-chip size="x-small" variant="tonal">
                                {{ item.operationsCount }}
                              </v-chip>
                            </div>
                          </template>

                          <!-- Действия -->
<template v-slot:item.actions="{ item }">
  <div class="d-flex gap-1">
    <v-btn
      size="x-small"
      color="success"
      variant="tonal"
      @click="setBonusStatus(item.client, 'ДА')"
    >
      <v-icon size="small">ri-check-line</v-icon>
      ДА
    </v-btn>
    
    <!-- ВРЕМЕННАЯ КНОПКА (УДАЛИТЬ ПОСЛЕ НАПОЛНЕНИЯ БД) -->
    <v-btn
      v-if="showKpiButton"
      size="x-small"
      color="warning"
      variant="tonal"
      @click="markSingleClientKpi(item)"
    >
      <v-icon size="small">ri-check-double-line</v-icon>
      KPI
    </v-btn>
    <!-- КОНЕЦ ВРЕМЕННОЙ КНОПКИ -->
  </div>
</template>
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-window-item>

                <!-- Таб: KPI VAT -->
                <v-window-item value="kpiVat">
                  <v-row>
                    <v-col cols="12">
                      <v-card variant="tonal" class="pa-4 mb-4">
                        <v-card-text>
                          <div class="text-subtitle-1 font-weight-medium mb-3">Ручной ввод KPI НДС</div>
                          <v-text-field
                            :model-value="manualKpiVat[selectedManagerDetails.id]"
                            @update:model-value="val => updateManualKpiVat(selectedManagerDetails.id, val)"
                            label="Сумма KPI НДС"
                            prefix="₽"
                            variant="outlined"
                            density="compact"
                            type="text"
                            :placeholder="formatNumber(0)"
                            hint="Введите сумму в рублях"
                            persistent-hint
                          >
                            <template v-slot:append>
                              <v-btn
                                icon
                                variant="text"
                                size="small"
                                @click="updateManualKpiVat(selectedManagerDetails.id, 0)"
                                title="Очистить"
                              >
                                <v-icon>ri-close-line</v-icon>
                              </v-btn>
                            </template>
                          </v-text-field>
                          
                          <div class="d-flex align-center justify-space-between mt-2 text-caption text-grey">
                            <span>Текущее значение:</span>
                            <span class="font-weight-medium text-primary">{{ formatMoney(manualKpiVat[selectedManagerDetails.id] || 0) }}</span>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                  
                  <!-- История ввода -->
                  <v-expansion-panels>
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        <v-icon start>ri-history-line</v-icon>
                        История ввода KPI НДС
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-card variant="tonal" class="pa-4 text-center text-grey">
                          <v-icon size="48" color="grey-lighten-1" class="mb-2">ri-timer-line</v-icon>
                          <p>Здесь будет отображаться история изменений</p>
                          <p class="text-caption">Функция в разработке</p>
                        </v-card>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useKpiStore } from '../stores/kpiStore';
import { bufferService } from '@/services/bufferService';
import type { Manager } from '@/types/kpi.types';

const store = useKpiStore();
const loading = ref(false);
const activeTab = ref('maintenance');

// Состояние фильтров - текущий месяц по умолчанию
const currentDate = new Date();
const selectedYear = ref(currentDate.getFullYear().toString());
const selectedMonth = ref((currentDate.getMonth() + 1).toString().padStart(2, '0'));

const showDetailsDialog = ref(false);
const selectedManagerDetails = ref<any>(null);

// Состояние для выбранных ставок по каждому менеджеру
const selectedRate = ref<Record<string, number>>({});

// Ставки KPI NO VAT
const kpiNoVatRates = ref([
  { id: 'kpi_1', value: 0.015, label: '1.50%' },
  { id: 'kpi_2', value: 0.02, label: '2.00%' },
  { id: 'kpi_3', value: 0.03, label: '3.00%' },
]);

// Выбранные ставки KPI для каждого менеджера
const selectedKpiRate = ref<Record<string, number>>({});

// Состояние для ручного ввода KPI НДС по каждому менеджеру
const manualKpiVat = ref<Record<string, number>>({});

// Данные bonusHistory
const bonushistory = computed(() => store.bonusHistory);

// Кастомные статусы бонусов (переопределение из файла)
const customBonusStatus = ref<Record<string, {
  status: string;
  bonusMonth: string | null;
}>>({});

// Состояние для хранения KPI всех менеджеров (не только текущего)
const managerKpiValues = ref<Record<string, number>>({});

// Триггер для принудительного обновления computed свойств
const forceUpdate = ref(0);

// ========== ЗАГРУЗКА ИЗ LOCALSTORAGE (FALLBACK) ==========
const loadStateFromStorage = () => {
  try {
    console.log('📂 Загрузка состояния из localStorage (fallback)...');
    
    const savedCustomStatus = localStorage.getItem('kpi_custom_bonus_status');
    if (savedCustomStatus) {
      customBonusStatus.value = JSON.parse(savedCustomStatus);
    }
    
    const savedManagerKpi = localStorage.getItem('kpi_manager_values');
    if (savedManagerKpi) {
      managerKpiValues.value = JSON.parse(savedManagerKpi);
    }
    
    const savedRates = localStorage.getItem('kpi_selected_rates');
    if (savedRates) {
      selectedRate.value = JSON.parse(savedRates);
    }
    
    const savedKpiRates = localStorage.getItem('kpi_selected_kpi_rates');
    if (savedKpiRates) {
      selectedKpiRate.value = JSON.parse(savedKpiRates);
    }
    
    const savedManualKpiVat = localStorage.getItem('kpi_manual_vat');
    if (savedManualKpiVat) {
      manualKpiVat.value = JSON.parse(savedManualKpiVat);
    }
    
    const savedTab = localStorage.getItem('kpi_active_tab');
    if (savedTab) {
      activeTab.value = savedTab;
    }
    
    const savedYear = localStorage.getItem('kpi_selected_year');
    if (savedYear) {
      selectedYear.value = savedYear;
    }
    
    const savedMonth = localStorage.getItem('kpi_selected_month');
    if (savedMonth) {
      selectedMonth.value = savedMonth;
    }
    
    forceUpdate.value = Date.now();
    console.log('✅ Состояние загружено из localStorage');
    
  } catch (e) {
    console.error('Ошибка загрузки из localStorage:', e);
  }
};

// ========== СОХРАНЕНИЕ В LOCALSTORAGE (FALLBACK) ==========
const saveStateToStorage = () => {
  try {
    localStorage.setItem('kpi_custom_bonus_status', JSON.stringify(customBonusStatus.value));
    localStorage.setItem('kpi_manager_values', JSON.stringify(managerKpiValues.value));
    localStorage.setItem('kpi_selected_rates', JSON.stringify(selectedRate.value));
    localStorage.setItem('kpi_selected_kpi_rates', JSON.stringify(selectedKpiRate.value));
    localStorage.setItem('kpi_manual_vat', JSON.stringify(manualKpiVat.value));
    localStorage.setItem('kpi_active_tab', activeTab.value);
    localStorage.setItem('kpi_selected_year', selectedYear.value);
    localStorage.setItem('kpi_selected_month', selectedMonth.value);
  } catch (e) {
    console.error('Ошибка сохранения в localStorage:', e);
  }
};

// ========== ЗАГРУЗКА С СЕРВЕРА ==========
const loadStateFromServer = async () => {
  try {
    console.log('📂 Загрузка состояния с сервера...');
    
    const settings = await store.loadKpiSettings();
    
    if (settings.customBonusStatus) {
      customBonusStatus.value = settings.customBonusStatus;
      console.log('✅ Загружены кастомные статусы:', Object.keys(customBonusStatus.value).length);
    }
    
    if (settings.managerKpiValues) {
      managerKpiValues.value = settings.managerKpiValues;
      console.log('✅ Загружены KPI менеджеров:', managerKpiValues.value);
    }
    
    if (settings.selectedRate) {
      selectedRate.value = settings.selectedRate;
    }
    
    if (settings.selectedKpiRate) {
      selectedKpiRate.value = settings.selectedKpiRate;
    }
    
    if (settings.manualKpiVat) {
      manualKpiVat.value = settings.manualKpiVat;
    }
    
    const savedTab = localStorage.getItem('kpi_active_tab');
    if (savedTab) {
      activeTab.value = savedTab;
    }
    
    if (settings.selectedYear) {
      selectedYear.value = settings.selectedYear;
    }
    
    if (settings.selectedMonth) {
      selectedMonth.value = settings.selectedMonth;
    }
    
    forceUpdate.value = Date.now();
    console.log('✅ Состояние загружено с сервера');
    
  } catch (e) {
    console.error('Ошибка загрузки с сервера:', e);
    loadStateFromStorage();
  }
};

// ========== СОХРАНЕНИЕ НА СЕРВЕР ==========
const saveStateToServer = async () => {
  try {
    const settings = {
      customBonusStatus: customBonusStatus.value,
      managerKpiValues: managerKpiValues.value,
      selectedRate: selectedRate.value,
      selectedKpiRate: selectedKpiRate.value,
      manualKpiVat: manualKpiVat.value,
      selectedYear: selectedYear.value,
      selectedMonth: selectedMonth.value
    };
    
    await store.saveAllKpiSettings(settings);
    console.log('✅ Состояние сохранено на сервер');
    
    localStorage.setItem('kpi_active_tab', activeTab.value);
    
  } catch (e) {
    console.error('Ошибка сохранения на сервер:', e);
    saveStateToStorage();
  }
};

// Функция для принудительного пересчета всех computed
const refreshAllData = () => {
  forceUpdate.value = Date.now();
};

// Следим за изменениями и сохраняем на сервер
watch([customBonusStatus, managerKpiValues, selectedRate, selectedKpiRate, manualKpiVat, selectedYear, selectedMonth], () => {
  saveStateToServer();
}, { deep: true });

// Функция для форматирования ввода числа
const parseNumberInput = (value: string): number => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Функция для обновления KPI VAT с сохранением
const updateManualKpiVat = (managerId: string, value: any) => {
  const numValue = typeof value === 'string' ? parseNumberInput(value) : value;
  manualKpiVat.value[managerId] = numValue;
  saveStateToServer();
};

// Функция для форматирования отображения
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(value);
};

// Годы (от 2024 до текущего + 1)
const years = Array.from({ length: 5 }, (_, i) => (2024 + i).toString());

// Месяцы
const months = [
  { title: 'Январь', value: '01' },
  { title: 'Февраль', value: '02' },
  { title: 'Март', value: '03' },
  { title: 'Апрель', value: '04' },
  { title: 'Май', value: '05' },
  { title: 'Июнь', value: '06' },
  { title: 'Июль', value: '07' },
  { title: 'Август', value: '08' },
  { title: 'Сентябрь', value: '09' },
  { title: 'Октябрь', value: '10' },
  { title: 'Ноябрь', value: '11' },
  { title: 'Декабрь', value: '12' }
];

// Заголовки таблицы рейтинга
const ratingHeaders = [
  { title: '#', key: 'rank', sortable: false, width: '60', align: 'center' as const },
  { title: 'Менеджер', key: 'manager', sortable: true },
  { title: 'План пополнений', key: 'plan', sortable: true, align: 'end' as const },
  { title: 'Факт (пополнения)', key: 'fact', sortable: true, align: 'end' as const },
  { title: 'Выполнение', key: 'planPercent', sortable: true },
  { title: 'К выплате', key: 'payment', sortable: true, align: 'end' as const },
  { title: '', key: 'actions', sortable: false, width: '60', align: 'center' as const }
];

// Заголовки для таблицы клиентов (ведение)
const maintenanceClientHeaders = [
  { title: 'Клиент', key: 'client', sortable: true },
  { title: 'Пополнения (NO_VAT)', key: 'totalAmount', sortable: true, align: 'end' as const },
  { title: 'Ведение', key: 'maintenance', sortable: true, align: 'end' as const },
  { title: 'Доля', key: 'share', sortable: true, align: 'end' as const },
  { title: 'Пополнений', key: 'operations', sortable: true, align: 'center' as const }
];

// Заголовки для таблицы KPI клиентов (с бонусом)
const kpiClientHeaders = [
  { title: 'Клиент', key: 'client', sortable: true },
  { title: 'База KPI Без НДС', key: 'kpiBase', sortable: true, align: 'end' as const },
  { title: 'Сумма KPI', key: 'kpiAmount', sortable: true, align: 'end' as const },
  { title: 'Бонусный месяц', key: 'bonusMonth', sortable: true, align: 'center' as const },
  { title: 'Первая заправка', key: 'firstFillDate', sortable: true, align: 'center' as const },
  { title: 'Пополнений', key: 'operations', sortable: true, align: 'center' as const }
];

// Заголовки для таблицы клиентов с историей бонуса (БЫЛ)
const wasKpiClientHeaders = [
  { title: 'Клиент', key: 'client', sortable: true },
  { title: 'Пополнения без НДС', key: 'noVatAmount', sortable: true, align: 'end' as const },
  { title: 'Статус в файле', key: 'fileStatus', sortable: true, align: 'center' as const },
  { title: 'Месяц бонуса', key: 'bonusMonth', sortable: true, align: 'center' as const },
  { title: 'Первая заправка', key: 'firstFillDate', sortable: true, align: 'center' as const },
  { title: 'Пополнений', key: 'operations', sortable: true, align: 'center' as const },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' as const }
];

// Заголовки для таблицы клиентов без бонуса (НЕТ)
const nonKpiClientHeaders = [
  { title: 'Клиент', key: 'client', sortable: true },
  { title: 'Пополнения без НДС', key: 'noVatAmount', sortable: true, align: 'end' as const },
  { title: 'Макс. за 3 мес.', key: 'displayAmount', sortable: true, align: 'end' as const },
  { title: 'Статус', key: 'fileStatus', sortable: true, align: 'center' as const },
  { title: 'Первая заправка', key: 'firstFillDate', sortable: true, align: 'center' as const },
  { title: 'Пополнений', key: 'operations', sortable: true, align: 'center' as const },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' as const }
];

// Разрешенные роли
const allowedRoles = ['Менеджер', 'Старший Менеджер'];

// Фильтрованные менеджеры из системы
const filteredManagers = computed(() => {
  return store.managers.filter(manager => 
    manager.role && allowedRoles.includes(manager.role)
  );
});

// Статистика буфера (из данных API)
const bufferStats = computed(() => {
  const operations = store.bufferData;
  if (!operations.length) {
    return {
      totalOperations: 0,
      totalClients: 0,
      dateRange: { first: null, last: null }
    };
  }
  
  const uniqueClients = new Set(operations.map(op => op.client));
  const dates = operations.map(op => op.date).filter(Boolean);
  
  return {
    totalOperations: operations.length,
    totalClients: uniqueClients.size,
    dateRange: {
      first: dates.length ? dates.reduce((a, b) => a < b ? a : b) : null,
      last: dates.length ? dates.reduce((a, b) => a > b ? a : b) : null
    }
  };
});

// Получить статистику менеджеров из буфера за выбранный период
const managersStats = computed(() => {
  const year = parseInt(selectedYear.value);
  const month = parseInt(selectedMonth.value);
  const monthStr = month.toString().padStart(2, '0');
  
  const filteredOps = store.bufferData.filter(op => {
    if (!op.date) return false;
    const [day, opMonth, opYear] = op.date.split('-');
    return parseInt(opYear) === year && parseInt(opMonth) === month;
  });
  
  console.log(`📊 Фильтрация за ${year}-${monthStr}: ${filteredOps.length} операций из ${store.bufferData.length}`);
  
  const stats = new Map();
  
  filteredOps.forEach(op => {
    const managerId = op.managerId;
    if (!managerId) return;
    
    if (!stats.has(managerId)) {
      stats.set(managerId, {
        manager: op.manager,
        managerId: managerId,
        totalAmount: 0,
        noVatAmount: 0,
        vatAmount: 0,
        operationsCount: 0,
        uniqueClients: new Set()
      });
    }
    
    const stat = stats.get(managerId);
    stat.totalAmount += op.amount;
    stat.operationsCount += 1;
    stat.uniqueClients.add(op.client);
    
    if (op.clientType === 'NO_VAT') {
      stat.noVatAmount += op.amount;
    } else {
      stat.vatAmount += op.amount;
    }
  });
  
  for (const [, stat] of stats.entries()) {
    stat.uniqueClients = stat.uniqueClients.size;
  }
  
  return stats;
});

// Проверка разрешена ли ставка для менеджера
const isRateAllowed = (manager: Manager, rateId: string): boolean => {
  if (!manager.allowedMaintenanceRates || manager.allowedMaintenanceRates.length === 0) {
    return true;
  }
  return manager.allowedMaintenanceRates.includes(rateId);
};

// Получить разрешенные ставки для менеджера в читаемом виде
const getAllowedRates = (manager: Manager): string[] => {
  const rates: string[] = [];
  if (manager.allowedMaintenanceRates?.includes('m015')) rates.push('0.15%');
  if (manager.allowedMaintenanceRates?.includes('m020')) rates.push('0.20%');
  if (manager.allowedMaintenanceRates?.includes('m030')) rates.push('0.30%');
  return rates;
};

// Получить выбранную ставку для менеджера (ведение)
const getSelectedRate = (item: any): number => {
  if (selectedRate.value[item.id]) {
    return selectedRate.value[item.id];
  }
  
  const manager = item.originalManager;
  if (manager.allowedMaintenanceRates?.includes('m015')) return 0.0015;
  if (manager.allowedMaintenanceRates?.includes('m020')) return 0.002;
  if (manager.allowedMaintenanceRates?.includes('m030')) return 0.003;
  return 0.0015;
};

// Получить выбранную ставку KPI
const getSelectedKpiRate = (item: any): number => {
  return selectedKpiRate.value[item.id] || 0.015;
};

// Рассчитать выплату с учетом выбранной ставки (ведение)
const calculatePayment = (item: any): number => {
  const rate = getSelectedRate(item);
  return (item.noVatAmount || 0) * rate;
};

// Рассчитать KPI сумму
const calculateKpiAmount = (item: any): number => {
  const rate = getSelectedKpiRate(item);
  return kpiClientBaseTotal.value * rate;
};

// Получить статус бонуса для клиента
const getClientBonusStatus = (
  clientName: string,
  managerName: string,
  currentYear: number,
  currentMonth: number,
  monthlyAmounts: Map<string, number>
): { 
  status: string; 
  firstFillDate: string | null;
  maxAmount: number;
  maxMonth: string | null;
  hasActiveBonus: boolean;
  allMonthsCompleted: boolean;
  fileStatus?: string;
} => {
  // 🔥 Проверяем, не получал ли клиент KPI ранее
  const alreadyReceived = store.isKpiReceivedForClient(clientName);
  console.log(`🔍 getClientBonusStatus для "${clientName}": alreadyReceived=${alreadyReceived}`);
  
  if (alreadyReceived) {
    console.log(`✅ ${clientName} → БЫЛ (KPI уже получен)`);
    return {
      status: 'БЫЛ',
      firstFillDate: null,
      maxAmount: 0,
      maxMonth: null,
      hasActiveBonus: false,
      allMonthsCompleted: true,
      fileStatus: 'KPI уже получен'
    };
}
  const customKey = `${clientName}_${managerName}`;
  if (customBonusStatus.value[customKey]) {
    const custom = customBonusStatus.value[customKey];
    return {
      status: custom.status,
      firstFillDate: null,
      maxAmount: 0,
      maxMonth: custom.bonusMonth,
      hasActiveBonus: custom.status === 'ДА',
      allMonthsCompleted: true,
      fileStatus: custom.status
    };
  }
  
  const bonus = store.bonusHistory.find(b => 
    b.client === clientName && b.currentManager === managerName
  );
  
  if (bonus) {
    if (bonus.status === 'БЫЛ') {
      return {
        status: 'БЫЛ',
        firstFillDate: bonus.firstFillDate || null,
        maxAmount: 0,
        maxMonth: null,
        hasActiveBonus: false,
        allMonthsCompleted: true,
        fileStatus: bonus.status
      };
    }
    
    if (bonus.status === 'ДА' && bonus.firstFillDate) {
      const [day, month, year] = bonus.firstFillDate.split('-').map(Number);
      const firstFill = new Date(year, month - 1, day);
      
      const bonusMonths: string[] = [];
      for (let i = 0; i < 3; i++) {
        const bonusDate = new Date(firstFill);
        bonusDate.setMonth(firstFill.getMonth() + i);
        const bonusYear = bonusDate.getFullYear();
        const bonusMonth = bonusDate.getMonth() + 1;
        bonusMonths.push(`${bonusYear}-${bonusMonth.toString().padStart(2, '0')}`);
      }
      
      const currentMonthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      
      let maxAmount = 0;
      let maxMonth = null;
      
      bonusMonths.forEach(monthKey => {
        const amount = monthlyAmounts.get(monthKey) || 0;
        if (amount > maxAmount) {
          maxAmount = amount;
          maxMonth = monthKey;
        }
      });
      
      const isActive = currentMonthKey === maxMonth;
      
      return {
        status: isActive ? 'ДА' : 'БЫЛ',
        firstFillDate: bonus.firstFillDate,
        maxAmount,
        maxMonth,
        hasActiveBonus: isActive,
        allMonthsCompleted: true,
        fileStatus: bonus.status
      };
    }
    
    if (bonus.status === 'НЕТ') {
      return {
        status: 'НЕТ',
        firstFillDate: bonus.firstFillDate || null,
        maxAmount: 0,
        maxMonth: null,
        hasActiveBonus: false,
        allMonthsCompleted: false,
        fileStatus: bonus.status
      };
    }
  }
  
  return {
    status: 'НЕТ',
    firstFillDate: null,
    maxAmount: 0,
    maxMonth: null,
    hasActiveBonus: false,
    allMonthsCompleted: false,
    fileStatus: undefined
  };
};

// Установить статус бонуса для клиента
const setBonusStatus = (clientName: string, status: string) => {
  console.log('%c========== НАЖАТА КНОПКА "СДЕЛАТЬ ДА" ==========', 'background: #4CAF50; color: white; font-size: 14px');
  
  if (!selectedManagerDetails.value) {
    console.error('❌ Ошибка: selectedManagerDetails отсутствует');
    alert('Ошибка: выберите менеджера');
    return;
  }
  
  const manager = selectedManagerDetails.value.originalManager;
  const managerName = manager.displayName;
  const managerId = selectedManagerDetails.value.id;
  
  const customKey = `${clientName}_${managerName}`;
  const currentMonthKey = `${selectedYear.value}-${selectedMonth.value}`;
  
  console.log('📝 Сохраняем кастомный статус:', { customKey, status, currentMonthKey });
  
  customBonusStatus.value = {
    ...customBonusStatus.value,
    [customKey]: {
      status,
      bonusMonth: currentMonthKey
    }
  };
  
  // Запускаем сохранение на сервер
  saveStateToServer();
  
  setTimeout(() => {
    const managerItem = managerRatings.value.find(m => m.id === managerId);
    if (managerItem) {
      managerKpiValues.value[managerId] = managerItem.managerKpi || 0;
      saveStateToServer();
      console.log(`💾 Сохранен KPI для ${managerName}:`, managerItem.managerKpi);
    }
    
    forceUpdate.value = Date.now();
  }, 100);
  
  console.log(`✅ Статус для клиента ${clientName} установлен как ${status}`);
  alert(`✅ Статус для клиента "${clientName}" изменен на "${status}"`);
};

// Рейтинги менеджеров
const managerRatings = computed(() => {
  const bufferStats = managersStats.value;
  
  return filteredManagers.value.map((manager) => {
    let totalAmount = 0;
    let noVatAmount = 0;
    let operationsCount = 0;
    let vatAmount = 0;
    let uniqueClients = 0;
    
    const statData = bufferStats.get(manager.id);
    if (statData) {
      totalAmount = statData.totalAmount;
      noVatAmount = statData.noVatAmount;
      vatAmount = statData.vatAmount;
      operationsCount = statData.operationsCount;
      uniqueClients = statData.uniqueClients;
    }
    
    const plan = manager.plan || 80000;
    const fact = totalAmount;
    const planPercent = plan > 0 ? (fact / plan) * 100 : 0;
    
    const rate = getSelectedRate({ id: manager.id, originalManager: manager, noVatAmount });
    const maintenancePayment = noVatAmount * rate;
    
    let managerKpi = 0;
    if (managerKpiValues.value[manager.id] !== undefined) {
      managerKpi = managerKpiValues.value[manager.id];
    } else if (selectedManagerDetails.value?.id === manager.id) {
      managerKpi = kpiClientDetails.value.active.reduce((sum, client) => sum + client.kpiAmount, 0);
      managerKpiValues.value[manager.id] = managerKpi;
      saveStateToServer();
    }
    
    const kpiVatAmount = manualKpiVat.value[manager.id] || 0;
    const payment = maintenancePayment + managerKpi + kpiVatAmount;
    
    return {
      id: manager.id,
      name: manager.displayName,
      role: manager.role || 'Менеджер',
      originalManager: manager,
      plan,
      fact,
      planPercent,
      payment,
      maintenancePayment,
      managerKpi,
      kpiVatAmount,
      operationsCount,
      totalAmount,
      noVatAmount,
      vatAmount,
      uniqueClients
    };
  }).sort((a, b) => b.planPercent - a.planPercent);
});

// Детализация по клиентам для ведения
const maintenanceClientDetails = computed(() => {
  if (!selectedManagerDetails.value) return [];
  
  const year = parseInt(selectedYear.value);
  const month = parseInt(selectedMonth.value);
  const manager = selectedManagerDetails.value.originalManager;
  
  const searchNames = [
    manager.displayName,
    ...(manager.aliases || [])
  ].map(n => n?.toLowerCase().trim()).filter(Boolean);
  
  let allOps: any[] = [];
  
  searchNames.forEach(name => {
    const ops = bufferService.getOperationsByManager(name, year, month);
    allOps = [...allOps, ...ops];
  });
  
  const uniqueOps = Array.from(
    new Map(allOps.map(op => [`${op.date}-${op.client}-${op.amount}`, op])).values()
  );
  
  const clientMap = new Map();
  
  uniqueOps.forEach(op => {
    if (!clientMap.has(op.client)) {
      clientMap.set(op.client, {
        client: op.client,
        totalAmount: 0,
        noVatAmount: 0,
        operationsCount: 0
      });
    }
    
    const data = clientMap.get(op.client);
    data.totalAmount += op.amount;
    data.operationsCount += 1;
    if (op.clientType === 'NO_VAT') {
      data.noVatAmount += op.amount;
    }
  });
  
  const rate = getSelectedRate(selectedManagerDetails.value);
  
  let totalMaintenance = 0;
  const details = Array.from(clientMap.values())
    .filter(data => data.noVatAmount > 0)
    .map(data => {
      const maintenance = data.noVatAmount * rate;
      totalMaintenance += maintenance;
      return {
        ...data,
        maintenance
      };
    });
  
  details.forEach(data => {
    data.share = totalMaintenance > 0 ? (data.maintenance / totalMaintenance) * 100 : 0;
  });
  
  return details.sort((a, b) => b.maintenance - a.maintenance);
});

// Детализация по клиентам для KPI
const kpiClientDetails = computed(() => {
  const update = forceUpdate.value;
  
  if (!selectedManagerDetails.value) return { active: [], was: [], non: [] };
  
  const year = parseInt(selectedYear.value);
  const month = parseInt(selectedMonth.value);
  const manager = selectedManagerDetails.value.originalManager;
  const managerName = manager.displayName;
  
  console.log('🔄 Пересчет kpiClientDetails, forceUpdate:', update);
  
  const monthsToCheck = [];
  for (let i = -3; i <= 3; i++) {
    const checkDate = new Date(year, month - 1 + i, 1);
    monthsToCheck.push({
      year: checkDate.getFullYear(),
      month: checkDate.getMonth() + 1
    });
  }
  
  const monthlyOpsMap = new Map<string, any[]>();
  
monthsToCheck.forEach(({ year: y, month: m }) => {
    const monthKey = `${y}-${m.toString().padStart(2, '0')}`;
    const ops = bufferService.getOperationsByManager(managerName, y, m);
    const uniqueOps = Array.from(
      new Map(ops.map(op => [`${op.date}-${op.client}-${op.amount}`, op])).values()
    );
monthlyOpsMap.set(monthKey, uniqueOps);
    
    monthlyOpsMap.set(monthKey, uniqueOps);
  });
  
  const clientMonthlyMap = new Map();
  
  monthlyOpsMap.forEach((ops, monthKey) => {
    ops.forEach(op => {
      if (!clientMonthlyMap.has(op.client)) {
        clientMonthlyMap.set(op.client, new Map());
      }
      
      const clientMonths = clientMonthlyMap.get(op.client);
      const currentAmount = clientMonths.get(monthKey) || 0;
      clientMonths.set(monthKey, currentAmount + op.amount);
    });
  });
  
  const clientCurrentMap = new Map();
  
  const managerBonuses = bonushistory.value.filter(b => 
  b.currentManager === managerName
);
  
  managerBonuses.forEach(bonus => {
    if (!clientCurrentMap.has(bonus.client)) {
      clientCurrentMap.set(bonus.client, {
        client: bonus.client,
        totalAmount: 0,
        noVatAmount: 0,
        vatAmount: 0,
        operationsCount: 0,
        firstFillDate: bonus.firstFillDate || null,
        clientStatus: bonus.status,
        bonusMonth: null,
        maxAmount: 0,
        maxAmountMonth: null,
        fileStatus: bonus.status,
        hasOperations: false
      });
    }
  });
  
  const currentMonthKey = `${year}-${month.toString().padStart(2, '0')}`;
  const ops = bufferService.getOperationsByManager(managerName, year, month);
const currentMonthOps = Array.from(
  new Map(ops.map(op => [`${op.date}-${op.client}-${op.amount}`, op])).values()
);
  
  currentMonthOps.forEach(op => {
    if (!clientCurrentMap.has(op.client)) {
      clientCurrentMap.set(op.client, {
        client: op.client,
        totalAmount: 0,
        noVatAmount: 0,
        vatAmount: 0,
        operationsCount: 0,
        firstFillDate: null,
        clientStatus: 'НЕТ',
        bonusMonth: null,
        maxAmount: 0,
        maxAmountMonth: null,
        fileStatus: null,
        hasOperations: true
      });
    }
    
    const data = clientCurrentMap.get(op.client);
    data.totalAmount += op.amount;
    data.operationsCount += 1;
    data.hasOperations = true;
    
    if (op.clientType === 'NO_VAT') {
      data.noVatAmount += op.amount;
    } else if (op.clientType === 'VAT') {
      data.vatAmount += op.amount;
    }
  });
  
  for (const [client, data] of clientCurrentMap.entries()) {
    if (data.firstFillDate) {
      try {
        const [day, m, y] = data.firstFillDate.split('-').map(Number);
        const firstFill = new Date(y, m - 1, day);
        
        const bonusMonths: string[] = [];
        for (let i = 0; i < 3; i++) {
          const bonusDate = new Date(firstFill);
          bonusDate.setMonth(firstFill.getMonth() + i);
          const bonusYear = bonusDate.getFullYear();
          const bonusMonthNum = bonusDate.getMonth() + 1;
          bonusMonths.push(`${bonusYear}-${bonusMonthNum.toString().padStart(2, '0')}`);
        }
        
        const clientMonths = clientMonthlyMap.get(client) || new Map();
        let maxAmount = 0;
        let maxMonth = null;
        
        bonusMonths.forEach(monthKey => {
          const amount = clientMonths.get(monthKey) || 0;
          if (amount > maxAmount) {
            maxAmount = amount;
            maxMonth = monthKey;
          }
        });
        
        data.maxAmount = maxAmount;
        data.maxAmountMonth = maxMonth;
        
        if (data.clientStatus === 'ДА') {
          data.kpiBaseAmount = maxAmount;
        }
        
      } catch (e) {
        console.error('Ошибка парсинга даты для клиента:', client, data.firstFillDate);
      }
    }
  }
  
 const allClients = Array.from(clientCurrentMap.values());

const rate = getSelectedKpiRate(selectedManagerDetails.value);

// Принудительно проверяем KPI через getClientBonusStatus для каждого клиента
const clientsWithStatus = allClients.map(data => {
  const bonusStatus = getClientBonusStatus(
    data.client,
    managerName,
    year,
    month,
    clientMonthlyMap.get(data.client) || new Map()
  );
  return { ...data, ...bonusStatus };
});

const active = clientsWithStatus
  .filter(data => data.status === 'ДА' && data.noVatAmount > 0)
  .map(data => {
    const baseAmount = data.kpiBaseAmount || data.noVatAmount;
    return {
      ...data,
      displayAmount: baseAmount,
      kpiAmount: baseAmount * rate,
      baseInfo: data.kpiBaseAmount ? `Макс. за период: ${formatMoney(data.kpiBaseAmount)}` : null,
      monthInfo: data.maxAmountMonth ? `Бонусный месяц: ${data.maxAmountMonth}` : null,
      warning: !data.hasOperations && !data.kpiBaseAmount ? 'Нет операций' : null
    };
  });

const was = clientsWithStatus
  .filter(data => data.status === 'БЫЛ' && data.noVatAmount > 0)
  .map(data => ({ ...data }));

const non = clientsWithStatus
  .filter(data => data.status === 'НЕТ' && data.noVatAmount > 0)
  .map(data => ({ ...data }));

return { active, was, non };
});

// Общая сумма базы KPI по клиентам с бонусом
const kpiClientBaseTotal = computed(() => {
  return kpiClientDetails.value.active.reduce((sum, item) => {
    return sum + (item.displayAmount || 0);
  }, 0);
});

// Общая сумма NO_VAT по клиентам с историей бонуса
const wasKpiClientNoVatTotal = computed(() => {
  return kpiClientDetails.value.was.reduce((sum, item) => sum + item.noVatAmount, 0);
});

// Общая сумма NO_VAT по клиентам без бонуса
const nonKpiClientNoVatTotal = computed(() => {
  return kpiClientDetails.value.non.reduce((sum, item) => sum + item.noVatAmount, 0);
});

// Итоги
const forecast = computed(() => {
  const fact = totalFact.value;
  
  const now = new Date();
  const selectedYearNum = parseInt(selectedYear.value);
  const selectedMonthNum = parseInt(selectedMonth.value);
  
  // Если выбранный месяц уже прошёл — прогноз = факт
  if (selectedYearNum < now.getFullYear() || 
      (selectedYearNum === now.getFullYear() && selectedMonthNum < now.getMonth() + 1)) {
    return fact;
  }
  
  // Если текущий месяц — считаем прогноз
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const passedDays = now.getDate();
  
  return (fact / Math.max(passedDays, 1)) * daysInMonth;
});

const totalFact = computed(() => {
  return managerRatings.value.reduce((sum, m) => sum + m.fact, 0);
});

const totalPayment = computed(() => {
  return managerRatings.value.reduce((sum, m) => sum + m.payment, 0);
});

const averagePlanPercent = computed(() => {
  if (managerRatings.value.length === 0) return 0;
  return managerRatings.value.reduce((sum, m) => sum + m.planPercent, 0) / managerRatings.value.length;
});

// Название месяца
const selectedMonthName = computed(() => {
  const month = months.find(m => m.value === selectedMonth.value);
  return month ? month.title : '';
});

// Функции для иконок и цветов
const getRoleIcon = (role?: string): string => {
  switch(role) {
    case 'Старший Менеджер': return 'ri-computer-line';
    case 'Руководитель ОП': return 'ri-team-line';
    case 'Менеджер': return 'ri-user-line';
    default: return 'ri-user-line';
  }
};

const getRoleColor = (role?: string): string => {
  switch(role) {
    case 'Старший Менеджер': return 'error';
    case 'Руководитель ОП': return 'primary';
    case 'Менеджер': return 'success';
    default: return 'grey';
  }
};

const getPercentColor = (percent: number): string => {
  if (percent >= 100) return 'success';
  if (percent >= 50) return 'warning';
  return 'error';
};

const getPercentTextColor = (percent: number): string => {
  if (percent >= 100) return 'text-success';
  if (percent >= 50) return 'text-warning';
  return 'text-error';
};

const getPaymentColor = (payment: number): string => {
  return payment > 0 ? 'text-primary' : 'text-grey';
};

// Форматирование денег
const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Сохранить состояние диалога
const saveDialogState = (isOpen: boolean) => {
  if (!isOpen && selectedManagerDetails.value) {
    saveStateToServer();
  }
};

// Открыть детали менеджера
const openManagerDetails = (item: any) => {
  selectedManagerDetails.value = item;
  
  if (!selectedRate.value[item.id]) {
    selectedRate.value[item.id] = getSelectedRate(item);
  }
  
  if (!selectedKpiRate.value[item.id]) {
    selectedKpiRate.value[item.id] = 0.015;
  }
  
  if (manualKpiVat.value[item.id] === undefined) {
    manualKpiVat.value[item.id] = 0;
  }
  
  const savedTabKey = `kpi_tab_${item.id}`;
  const savedTab = localStorage.getItem(savedTabKey);
  if (savedTab) {
    activeTab.value = savedTab;
  } else {
    activeTab.value = 'maintenance';
  }
  
  showDetailsDialog.value = true;
};

// Обновление данных
const refreshData = async () => {
  loading.value = true;
  try {
    const year = parseInt(selectedYear.value);
    const month = parseInt(selectedMonth.value);
    
    if (store.managers.length === 0) {
      await store.loadManagers();
    }
    
    await store.loadPlans(year, month);
    await store.loadBufferData(year, month);
    await store.loadMaintenanceRates();
    await store.loadKpiRates();
    await store.loadBonusHistory();
    await store.loadKpiReceivedClients(); // Перезагружаем KPI клиентов
forceUpdate.value = Date.now(); // Принудительный пересчёт
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    loading.value = false;
  }
};

// Сохраняем активный таб при его изменении
watch(activeTab, (newTab) => {
  if (selectedManagerDetails.value) {
    localStorage.setItem(`kpi_tab_${selectedManagerDetails.value.id}`, newTab);
  }
});

// Следим за изменением года/месяца
watch([selectedYear, selectedMonth], () => {
  refreshData();
});

// ========== ВРЕМЕННЫЙ КОД ФИКСАЦИИ KPI (УДАЛИТЬ ПОСЛЕ НАПОЛНЕНИЯ БД) ==========
const showKpiButton = ref(true);

const handleKpiKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'K') {
    showKpiButton.value = !showKpiButton.value;
    console.log('🔧 Кнопки KPI:', showKpiButton.value ? 'показаны' : 'скрыты');
  }
};

const markSingleClientKpi = async (item: any) => {
  if (!selectedManagerDetails.value) return;
  
  const managerName = selectedManagerDetails.value.originalManager.displayName;
  
  if (!confirm(`Разрешить получение KPI?\n\nКлиент: ${item.client}\nМенеджер: ${managerName}`)) return;
  
  try {
    await store.removeKpiReceived(item.client);
    await store.loadKpiReceivedClients();
    alert(`✅ KPI разрешён: ${item.client}`);
    forceUpdate.value = Date.now();
  } catch (error) {
    alert('❌ Ошибка');
  }
};
// ========== КОНЕЦ ВРЕМЕННОГО КОДА ==========




// ========== ИНИЦИАЛИЗАЦИЯ ==========



onMounted(async () => {
  await store.loadKpiReceivedClients(); // Сначала загружаем KPI клиентов
  await loadStateFromServer();
  await refreshData();
  window.addEventListener('keydown', handleKpiKeyDown);
});
</script>

<style scoped>
.page-content {
  padding: 24px;
  background-color: #F5F5F5;
  min-height: 100vh;
}

.rating-card {
  border-radius: 16px !important;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.05) !important;
}

.rank-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
}

.client-table {
  margin-top: 8px;
  border-radius: 8px !important;
}

.client-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.03) !important;
}

.client-table :deep(.v-data-table__td) {
  padding: 8px 12px !important;
}

:deep(.v-data-table) {
  background-color: transparent !important;
}

:deep(.v-data-table .v-data-table__thead) {
  background-color: rgba(0,0,0,0.02);
}

:deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

.gap-4 {
  gap: 16px;
}

.bg-success-light {
  background-color: rgba(var(--v-theme-success), 0.1) !important;
}

.bg-warning-light {
  background-color: rgba(var(--v-theme-warning), 0.1) !important;
}

.dark-theme .page-content {
  background-color: #1E1E2D !important;
}

.dark-theme .v-data-table .v-data-table__thead {
  background-color: rgba(255,255,255,0.05);
}
</style>