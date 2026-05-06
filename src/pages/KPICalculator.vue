<!-- src/pages/KPICalculator.vue -->
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
              color="info"
              variant="tonal"
              prepend-icon="ri-file-excel-2-line"
              @click="showKpiVatUploadDialog = true"
            >
              Загрузить KPI НДС
            </v-btn>

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
            <div class="text-caption text-black flex-grow-1 text-center">
                <span class="text-grey">Прогноз на конец месяца:</span>
                <span class="font-weight-medium ml-2">{{ formatMoney(forecast) }}</span>
            </div>
          </div>

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
            <template v-slot:item.rank="{ index }">
              <div class="rank-cell">
                <span class="rank-number">#{{ index + 1 }}</span>
              </div>
            </template>

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

            <template v-slot:item.plan="{ item }">
              <div class="text-right font-weight-medium">{{ formatMoney(item.plan) }}</div>
            </template>

            <template v-slot:item.fact="{ item }">
              <div class="text-right">
                <span class="font-weight-medium">{{ formatMoney(item.fact) }}</span>
                <div class="text-caption text-grey">{{ item.operationsCount }} опер.</div>
              </div>
            </template>

            <template v-slot:item.planPercent="{ item }">
              <div class="d-flex align-center gap-2">
                <v-progress-linear v-model="item.planPercent" :color="getPercentColor(item.planPercent)" height="8" rounded class="flex-grow-1"></v-progress-linear>
                <span class="text-body-2 font-weight-medium" :class="getPercentTextColor(item.planPercent)">{{ item.planPercent.toFixed(1) }}%</span>
              </div>
            </template>

            <template v-slot:item.payment="{ item }">
              <div class="text-right">
                <span class="text-h6 font-weight-bold" :class="getPaymentColor(item.payment)">{{ formatMoney(item.payment) }}</span>
              </div>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn icon variant="text" size="small" color="primary" @click="openManagerDetails(item)">
                <v-icon>ri-eye-line</v-icon>
                <v-tooltip activator="parent" location="top">Детали</v-tooltip>
              </v-btn>
            </template>

            <template v-slot:no-data>
              <div class="text-center pa-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">ri-user-search-line</v-icon>
                <h3 class="text-h6 text-grey">Нет данных за выбранный период</h3>
                <p class="text-body-2 text-grey">Попробуйте выбрать другой месяц</p>
              </div>
            </template>
          </v-data-table>

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
            <!-- ... содержимое модального окна (оставляем как есть) ... -->
            <v-card-title class="d-flex align-center pa-4">
              <v-avatar :color="getRoleColor(selectedManagerDetails.role)" size="40" class="mr-3">
                <v-icon color="white">{{ getRoleIcon(selectedManagerDetails.role) }}</v-icon>
              </v-avatar>
              <div>
                <span class="text-h5">{{ selectedManagerDetails.name }}</span>
                <div class="text-caption text-grey">{{ selectedManagerDetails.role }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-btn icon variant="text" @click="showDetailsDialog = false">
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
                    <div class="text-h4 font-weight-bold text-primary">{{ selectedManagerDetails.operationsCount }}</div>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card variant="tonal" class="pa-4">
                    <div class="text-caption text-grey mb-1">Сумма пополнений</div>
                    <div class="text-h4 font-weight-bold text-success">{{ formatMoney(selectedManagerDetails.fact) }}</div>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card variant="tonal" class="pa-4">
                    <div class="text-caption text-grey mb-1">Пополнения с НДС</div>
                    <div class="text-h5 font-weight-bold text-info">{{ formatMoney(selectedManagerDetails.vatAmount || 0) }}</div>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card variant="tonal" class="pa-4">
                    <div class="text-caption text-grey mb-1">KPI НДС (ручной ввод)</div>
                    <div class="text-h5 font-weight-bold text-info">{{ formatMoney(manualKpiVat[selectedManagerDetails.id] || 0) }}</div>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Выполнение плана -->
              <v-card class="mt-4" variant="tonal">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="font-weight-medium">Выполнение плана пополнений</span>
                    <span class="text-h6" :class="getPercentTextColor(selectedManagerDetails.planPercent)">{{ selectedManagerDetails.planPercent.toFixed(1) }}%</span>
                  </div>
                  <v-progress-linear v-model="selectedManagerDetails.planPercent" :color="getPercentColor(selectedManagerDetails.planPercent)" height="18" rounded></v-progress-linear>
                  <div class="d-flex justify-space-between mt-2 text-caption text-grey">
                    <span>План: {{ formatMoney(selectedManagerDetails.plan) }}</span>
                    <span>Факт: {{ formatMoney(selectedManagerDetails.fact) }}</span>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Табы -->
              <v-tabs v-model="activeTab" class="mt-4" color="primary" grow>
                <v-tab value="maintenance"><v-icon start>ri-percent-line</v-icon>Ведение</v-tab>
                <v-tab value="kpiNoVat"><v-icon start>ri-bar-chart-2-line</v-icon>KPI Без НДС</v-tab>
                <v-tab value="kpiVat"><v-icon start>ri-file-copy-line</v-icon>KPI НДС</v-tab>
              </v-tabs>

              <v-window v-model="activeTab" class="mt-4">
                <!-- Таб: Ведение -->
                <v-window-item value="maintenance">
                  <v-card class="mb-4" variant="tonal">
                    <v-card-text>
                      <div class="text-subtitle-1 font-weight-medium mb-3">Ставка ведения</div>
                      <v-btn-toggle v-model="selectedRate[selectedManagerDetails.id]" mandatory divided class="flex-wrap">
                        <v-btn v-for="rate in store.maintenanceRates" :key="rate.id" :value="rate.value" :color="selectedRate[selectedManagerDetails.id] === rate.value ? 'primary' : undefined" variant="outlined" class="ma-1" :disabled="!isRateAllowed(selectedManagerDetails.originalManager, rate.id)">
                          {{ rate.label }}
                        </v-btn>
                      </v-btn-toggle>
                      <div class="d-flex justify-space-between mt-3 text-caption text-grey">
                        <span>Доступные ставки: {{ getAllowedRates(selectedManagerDetails.originalManager).join(', ') }}</span>
                      </div>
                    </v-card-text>
                  </v-card>

                  <v-card class="mb-4" variant="tonal" color="primary-light">
                    <v-card-text>
                      <div class="d-flex align-center justify-space-between">
                        <div>
                          <div class="text-caption text-grey">Сумма выплаты (ведение)</div>
                          <div class="text-h3 font-weight-bold text-primary">{{ formatMoney(calculatePayment(selectedManagerDetails)) }}</div>
                          <div class="text-caption text-grey mt-2">Рассчитано как {{ formatMoney(selectedManagerDetails.noVatAmount || 0) }} × {{ (getSelectedRate(selectedManagerDetails) * 100).toFixed(2) }}%</div>
                        </div>
                        <v-icon size="48" color="primary">ri-money-cny-circle-line</v-icon>
                      </div>
                    </v-card-text>
                  </v-card>

                  <v-expansion-panels>
                    <v-expansion-panel>
                      <v-expansion-panel-title><v-icon start>ri-team-line</v-icon>Детализация по клиентам ({{ maintenanceClientDetails.length }})</v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table :headers="maintenanceClientHeaders" :items="maintenanceClientDetails" items-per-page="-1" density="compact" class="client-table" hover>
                          <template v-slot:item.client="{ item }"><div class="font-weight-medium">{{ item.client }}</div></template>
                          <template v-slot:item.totalAmount="{ item }"><div class="text-right">{{ formatMoney(item.totalAmount) }}</div></template>
                          <template v-slot:item.maintenance="{ item }"><div class="text-right text-primary font-weight-medium">{{ formatMoney(item.maintenance) }}</div></template>
                          <template v-slot:item.share="{ item }"><div class="text-right">{{ item.share.toFixed(1) }}%</div></template>
                          <template v-slot:item.operations="{ item }"><div class="text-center"><v-chip size="x-small" variant="tonal">{{ item.operationsCount }}</v-chip></div></template>
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-window-item>

                <!-- Таб: KPI NO VAT -->
                <v-window-item value="kpiNoVat">
                  <v-row>
                    <v-col cols="4">
                      <v-card variant="tonal" class="pa-4">
                        <div class="text-caption text-grey mb-1">Пополнений без НДС</div>
                        <div class="text-h4 font-weight-bold text-warning">{{ formatMoney(selectedManagerDetails.noVatAmount || 0) }}</div>
                      </v-card>
                    </v-col>
                    <v-col cols="4">
                      <v-card variant="tonal" class="pa-4">
                        <div class="text-caption text-grey mb-1">KPI к выплате (ДА)</div>
                        <div class="text-h4 font-weight-bold text-success">{{ kpiClientDetails.active.length }}</div>
                      </v-card>
                    </v-col>
                    <v-col cols="4">
                      <v-card variant="tonal" class="pa-4">
                        <div class="text-caption text-grey mb-1">Остальные клиенты</div>
                        <div class="text-h4 font-weight-bold text-grey">{{ kpiClientDetails.was.length + kpiClientDetails.non.length }}</div>
                      </v-card>
                    </v-col>
                  </v-row>

                  <v-card class="mt-4 mb-4" variant="tonal">
                    <v-card-text>
                      <div class="text-subtitle-1 font-weight-medium mb-3">Ставка KPI Без НДС</div>
                      <v-btn-toggle v-model="selectedKpiRate[selectedManagerDetails.id]" mandatory divided class="flex-wrap">
                        <v-btn v-for="rate in kpiNoVatRates" :key="rate.id" :value="rate.value" :color="selectedKpiRate[selectedManagerDetails.id] === rate.value ? 'success' : undefined" variant="outlined" class="ma-1">
                          {{ rate.label }}
                        </v-btn>
                      </v-btn-toggle>
                    </v-card-text>
                  </v-card>

                  <v-card class="mb-4" variant="tonal" color="success-light">
                    <v-card-text>
                      <div class="d-flex align-center justify-space-between">
                        <div>
                          <div class="text-caption text-grey">Сумма KPI Без НДС</div>
                          <div class="text-h3 font-weight-bold text-success">{{ formatMoney(calculateKpiAmount(selectedManagerDetails)) }}</div>
                          <div class="text-caption text-grey mt-2">Рассчитано как {{ formatMoney(kpiClientBaseTotal) }} × {{ (getSelectedKpiRate(selectedManagerDetails) * 100).toFixed(2) }}%</div>
                          <div class="text-caption text-grey mt-1">База KPI: Сумма максимальных пополнений за бонусный период</div>
                        </div>
                        <v-icon size="48" color="success">ri-bar-chart-2-line</v-icon>
                      </div>
                    </v-card-text>
                  </v-card>

                  <!-- Список ДА -->
                  <v-expansion-panels class="mb-2">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="bg-success-light">
                        <v-icon start color="success">ri-checkbox-circle-line</v-icon>
                        KPI к выплате ({{ kpiClientDetails.active.length }})
                        <template v-slot:actions><v-chip size="small" color="success" variant="tonal">{{ formatMoney(kpiClientBaseTotal) }}</v-chip></template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table :headers="kpiClientHeaders" :items="kpiClientDetails.active" items-per-page="-1" density="compact" class="client-table" hover>
                          <template v-slot:item.client="{ item }"><div class="font-weight-medium">{{ item.client }}</div></template>
                          <template v-slot:item.kpiBase="{ item }"><div class="text-right"><div class="text-warning font-weight-medium">{{ formatMoney(item.displayAmount) }}</div><div v-if="item.baseInfo" class="text-caption text-grey">{{ item.baseInfo }}</div></div></template>
                          <template v-slot:item.kpiAmount="{ item }"><div class="text-right"><div class="text-success font-weight-medium">{{ formatMoney(item.kpiAmount) }}</div><div class="text-caption text-grey">ставка {{ (getSelectedKpiRate(selectedManagerDetails) * 100).toFixed(2) }}%</div></div></template>
                          <template v-slot:item.bonusMonth="{ item }"><div class="text-center"><v-chip size="x-small" :color="item.maxAmountMonth ? 'success' : 'grey'" variant="tonal">{{ item.maxAmountMonth || '—' }}</v-chip></div></template>
                          <template v-slot:item.firstFillDate="{ item }"><div class="text-center text-caption">{{ item.firstFillDate || '—' }}</div></template>
                          <template v-slot:item.operations="{ item }"><div class="text-center"><v-chip size="x-small" :color="item.operationsCount === 0 ? 'grey' : 'primary'" variant="tonal">{{ item.operationsCount }}</v-chip></div></template>
                          <template v-slot:item.actions="{ item }">
                            <v-btn size="x-small" color="error" variant="tonal" @click="setBonusStatus(item.client, 'НЕТ')">
                              <v-icon size="small">ri-close-line</v-icon> Отменить
                            </v-btn>
                          </template>
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>

                  <!-- Список БЫЛ -->
                  <v-expansion-panels class="mb-2">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="bg-warning-light">
                        <v-icon start color="warning">ri-history-line</v-icon>
                        KPI был получен ранее ({{ kpiClientDetails.was.length }})
                        <template v-slot:actions><v-chip size="small" color="warning" variant="tonal">{{ formatMoney(wasKpiClientNoVatTotal) }}</v-chip></template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table :headers="wasKpiClientHeaders" :items="kpiClientDetails.was" items-per-page="-1" density="compact" class="client-table" hover>
                          <template v-slot:item.client="{ item }"><div class="font-weight-medium">{{ item.client }}</div></template>
                          <template v-slot:item.noVatAmount="{ item }"><div class="text-right text-warning font-weight-medium">{{ formatMoney(item.noVatAmount) }}</div></template>
                          <template v-slot:item.fileStatus="{ item }"><div class="text-center"><v-chip size="x-small" color="warning" variant="tonal" v-if="item.fileStatus">{{ item.fileStatus }}</v-chip><span v-else>—</span></div></template>
                          <template v-slot:item.bonusMonth="{ item }"><div class="text-center text-caption">{{ item.bonusMonth || '—' }}</div></template>
                          <template v-slot:item.firstFillDate="{ item }"><div class="text-center text-caption">{{ item.firstFillDate || '—' }}</div></template>
                          <template v-slot:item.operations="{ item }"><div class="text-center"><v-chip size="x-small" variant="tonal">{{ item.operationsCount }}</v-chip></div></template>
                          <template v-slot:item.actions="{ item }">
                            <div class="d-flex gap-1">
                              <v-btn size="x-small" color="warning" variant="tonal" @click="setBonusStatus(item.client, 'НЕТ')">
                                <v-icon size="small">ri-refresh-line</v-icon> Сброс
                              </v-btn>
                              <v-btn v-if="showKpiButton" size="x-small" color="warning" variant="tonal" @click="markSingleClientKpi(item)">
                                <v-icon size="small">ri-check-double-line</v-icon> KPI
                              </v-btn>
                            </div>
                          </template>
                        </v-data-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>

                  <!-- Список НЕТ -->
                  <v-expansion-panels>
                    <v-expansion-panel>
                      <v-expansion-panel-title class="text-grey">
                        <v-icon start color="grey">ri-eye-off-line</v-icon>
                        KPI еще не получен ({{ kpiClientDetails.non.length }})
                        <template v-slot:actions><v-chip size="small" color="grey" variant="tonal">{{ formatMoney(nonKpiClientNoVatTotal) }}</v-chip></template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table :headers="nonKpiClientHeaders" :items="kpiClientDetails.non" items-per-page="-1" density="compact" class="client-table" hover>
                          <template v-slot:item.client="{ item }"><div class="font-weight-medium">{{ item.client }}</div></template>
                          <template v-slot:item.displayAmount="{ item }"><div class="text-right"><span class="font-weight-medium text-warning">{{ formatMoney(item.displayAmount) }}</span><div v-if="item.monthInfo" class="text-caption text-grey">{{ item.monthInfo }}</div></div></template>
                          <template v-slot:item.noVatAmount="{ item }"><div class="text-right text-grey">{{ formatMoney(item.noVatAmount) }}</div></template>
                          <template v-slot:item.fileStatus="{ item }"><div class="text-center"><v-chip size="x-small" :color="item.fileStatus === 'НЕТ' ? 'grey' : 'warning'" variant="tonal" v-if="item.fileStatus">{{ item.fileStatus }}</v-chip><span v-else>—</span></div></template>
                          <template v-slot:item.firstFillDate="{ item }"><div class="text-center text-caption">{{ item.firstFillDate || '—' }}</div></template>
                          <template v-slot:item.operations="{ item }"><div class="text-center"><v-chip size="x-small" variant="tonal">{{ item.operationsCount }}</v-chip></div></template>
                          <template v-slot:item.actions="{ item }">
                            <div class="d-flex gap-1">
                              <v-btn size="x-small" color="success" variant="tonal" @click="setBonusStatus(item.client, 'ДА')">
                                <v-icon size="small">ri-check-line</v-icon> ДА
                              </v-btn>
                              <v-btn v-if="showKpiButton" size="x-small" color="warning" variant="tonal" @click="markSingleClientKpi(item)">
                                <v-icon size="small">ri-check-double-line</v-icon> KPI
                              </v-btn>
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
                      <!-- Ручной ввод -->
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
                              <v-btn icon variant="text" size="small" @click="updateManualKpiVat(selectedManagerDetails.id, 0)" title="Очистить">
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

                      <!-- Автоматический расчёт (данные из Excel) -->
                      <v-card v-if="currentManagerKpiVatDetails.length > 0" variant="tonal" class="pa-4 mb-4" color="success-light">
                        <v-card-text>
                          <div class="d-flex align-center justify-space-between mb-3">
                            <div class="text-subtitle-1 font-weight-medium">
                              <v-icon start color="success">ri-table-line</v-icon>
                              Автоматический расчёт KPI НДС
                            </div>
                            <v-chip color="primary" variant="tonal" size="small">
                              Итого: {{ formatMoney(currentManagerKpiVatTotal) }}
                            </v-chip>
                          </div>
                          
                          <v-data-table
                            :headers="kpiVatDetailHeaders"
                            :items="currentManagerKpiVatDetails"
                            items-per-page="-1"
                            density="compact"
                            class="client-table"
                            hover
                          >
                            <template v-slot:item.client_name="{ item }">
                              <div class="font-weight-medium">{{ item.client_name }}</div>
                            </template>
                            
                            <template v-slot:item.total_profit="{ item }">
                              <div class="text-right">
                                <span :class="Number(item.total_profit) >= 0 ? 'text-success' : 'text-error'">
                                  {{ formatMoney(item.total_profit) }}
                                </span>
                              </div>
                            </template>
                            
                            <template v-slot:item.kpi_vat="{ item }">
                              <div class="text-right">
                                <div class="font-weight-bold text-primary">{{ formatMoney(item.kpi_vat) }}</div>
                                <div class="text-caption text-grey">
                                  {{ (Number(item.rate) * 100).toFixed(1) }}% ({{ item.client_age_months }} мес.)
                                </div>
                              </div>
                            </template>
                            
                            <template v-slot:item.transactions_count="{ item }">
                              <div class="text-center">
                                <v-chip size="x-small" variant="tonal">{{ item.transactions_count }}</v-chip>
                              </div>
                            </template>
                            
                            <template v-slot:item.share="{ item }">
                              <div class="text-right">{{ getCurrentManagerKpiVatShare(item).toFixed(1) }}%</div>
                            </template>
                          </v-data-table>
                          
                          <div class="d-flex justify-end mt-3">
                            <v-btn
                              color="success"
                              variant="tonal"
                              size="small"
                              prepend-icon="ri-check-line"
                              @click="applyKpiVatToManager"
                            >
                              Применить ({{ formatMoney(currentManagerKpiVatTotal) }})
                            </v-btn>
                          </div>
                        </v-card-text>
                      </v-card>

                      <!-- Если нет данных -->
                      <v-card v-else variant="tonal" class="pa-4 text-center text-grey">
                        <v-icon size="48" color="grey-lighten-1" class="mb-2">ri-file-excel-2-line</v-icon>
                        <p class="mb-2">Нет данных автоматического расчёта</p>
                        <p class="text-caption">
                          Загрузите Excel через кнопку «Загрузить KPI НДС» на странице рейтинга
                        </p>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
               </v-dialog>

        <!-- 🔥 ДИАЛОГ ЗАГРУЗКИ KPI VAT -->
        <v-dialog v-model="showKpiVatUploadDialog" max-width="500" persistent>
          <v-card>
            <v-card-title class="d-flex align-center pa-4">
              <v-icon color="info" class="mr-2">ri-file-excel-2-line</v-icon>
              Загрузка KPI НДС из Excel
              <v-spacer></v-spacer>
              <v-btn icon variant="text" @click="showKpiVatUploadDialog = false" :disabled="kpiVatUploading">
                <v-icon>ri-close-line</v-icon>
              </v-btn>
            </v-card-title>
            
            <v-card-text class="pa-4">
              <p class="text-body-2 text-grey mb-4">
                Загрузите Excel-файл с транзакциями за <strong>{{ selectedMonthName }} {{ selectedYear }}</strong>.
                KPI будет рассчитан для всех менеджеров автоматически.
              </p>
              
              <v-file-input
                v-model="kpiVatFile"
                label="Выберите Excel-файл (.xlsx)"
                accept=".xlsx,.xls"
                prepend-icon="ri-upload-cloud-2-line"
                variant="outlined"
                density="compact"
                :disabled="kpiVatUploading"
                @update:model-value="handleKpiVatFileSelect"
                persistent-hint
                hint="Колонки: Менеджер, Сумма для нас, Сумма для клиента, Операция, Юр.лицо клиента, Дата и время записи в CRM"
              ></v-file-input>
              
              <v-progress-linear
                v-if="kpiVatUploading"
                v-model="kpiVatProgress"
                color="info"
                height="6"
                rounded
                class="mt-3"
              ></v-progress-linear>
              <div v-if="kpiVatUploading" class="text-caption text-center mt-1 text-grey">
                {{ kpiVatProgressMessage }}
              </div>
              
              <v-alert
                v-if="kpiVatError"
                type="error"
                variant="tonal"
                closable
                class="mt-2"
                @click:close="kpiVatError = ''"
              >
                <div v-html="kpiVatError"></div>
              </v-alert>
              
              <v-alert
                v-if="kpiVatSuccess"
                type="success"
                variant="tonal"
                closable
                class="mt-2"
                @click:close="kpiVatSuccess = ''"
              >
                {{ kpiVatSuccess }}
              </v-alert>
            </v-card-text>
            
            <v-card-actions class="pa-4 pt-0">
              <v-btn 
                v-if="allKpiVatData.length > 0"
                color="error" 
                variant="text" 
                size="small"
                :disabled="kpiVatUploading"
                @click="deleteKpiVatData"
              >
                <v-icon start size="small">ri-delete-bin-line</v-icon>
                Удалить данные
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="showKpiVatUploadDialog = false" :disabled="kpiVatUploading">
                Отмена
              </v-btn>
              <v-btn
                color="info"
                variant="tonal"
                :loading="kpiVatUploading"
                :disabled="!kpiVatFile || kpiVatUploading"
                @click="uploadKpiVatFile"
              >
                Загрузить и рассчитать
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

      </v-col>
    </v-row>
  </v-container>
</template>
    
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useKpiStore } from '../stores/kpiStore';
import { bufferService } from '@/services/bufferService';
import type { Manager } from '@/types/kpi.types';

const store = useKpiStore();
const loading = ref(false);
const activeTab = ref('maintenance');
const initialized = ref(false);



// ========== АВТОРИЗАЦИЯ ==========
const showAuthDialog = ref(false);
const authLogin = ref('');
const authPassword = ref('');
const authLoading = ref(false);
const authError = ref('');

const doAuth = async () => {
  if (!authLogin.value || !authPassword.value) {
    authError.value = 'Заполните все поля';
    return;
  }
  
  authLoading.value = true;
  authError.value = '';
  
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: authLogin.value, password: authPassword.value })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      localStorage.setItem('kpi_auth', 'true');
      showAuthDialog.value = false;
    } else {
      authError.value = data.error || 'Неверный логин или пароль';
    }
  } catch (e) {
    authError.value = 'Ошибка соединения';
  } finally {
    authLoading.value = false;
  }
};

// Состояние фильтров - текущий месяц по умолчанию
const currentDate = new Date();
const selectedYear = ref(currentDate.getFullYear().toString());
const selectedMonth = ref((currentDate.getMonth() + 1).toString().padStart(2, '0'));

const showDetailsDialog = ref(false);
const selectedManagerDetails = ref<any>(null);


// ========== KPI VAT АВТОМАТИЧЕСКИЙ РАСЧЁТ ==========
const showKpiVatUploadDialog = ref(false);
const kpiVatFile = ref<File | null>(null);
const kpiVatUploading = ref(false);
const kpiVatError = ref('');
const kpiVatSuccess = ref('');

// Данные для отображения
interface KpiVatDetail {
  client_name: string;
  total_profit: number;
  transactions_count: number;
  kpi_vat: number;
  rate: number;
  client_age_months: number;
}

const allKpiVatData = ref<any[]>([]);

// Загрузка всех сохранённых данных KPI VAT за период
const loadAllKpiVatData = async () => {
  try {
    const params = new URLSearchParams({
      year: selectedYear.value,
      month: selectedMonth.value
    });
    
    const response = await fetch(`/api/kpi-vat?${params}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        allKpiVatData.value = result.data || [];
        console.log('✅ KPI VAT из БД:', allKpiVatData.value.length, 'записей');
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки KPI VAT:', error);
  }
};

const kpiVatDetails = ref<KpiVatDetail[]>([]);


// Удаление данных KPI VAT за текущий период
const deleteKpiVatData = async () => {
  if (!confirm(`Удалить все данные KPI НДС за ${selectedMonthName.value} ${selectedYear.value}?`)) return;
  
  kpiVatUploading.value = true;
  kpiVatError.value = '';
  kpiVatSuccess.value = '';
  
  try {
    const params = new URLSearchParams({
      year: selectedYear.value,
      month: selectedMonth.value
    });
    
    const response = await fetch(`/api/kpi-vat?${params}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (!response.ok) throw new Error(result.error || 'Ошибка');
    
    if (result.success) {
      allKpiVatData.value = [];
      kpiVatDetails.value = [];
      kpiVatSuccess.value = '✅ Данные удалены';
      kpiVatFile.value = null;
    }
  } catch (error: any) {
    kpiVatError.value = error.message;
  } finally {
    kpiVatUploading.value = false;
  }
};



// Данные для текущего менеджера
const currentManagerKpiVatDetails = computed(() => {
  if (!selectedManagerDetails.value) return [];
  return allKpiVatData.value.filter(
    item => item.manager_name === selectedManagerDetails.value.name
  );
});

const currentManagerKpiVatTotal = computed(() => {
  return currentManagerKpiVatDetails.value.reduce((sum, item) => sum + Number(item.kpi_vat || 0), 0);
});

const getCurrentManagerKpiVatShare = (item: any) => {
  const total = currentManagerKpiVatTotal.value;
  if (total === 0) return 0;
  return (Number(item.kpi_vat) / total) * 100;
};


// Выбор файла
const handleKpiVatFileSelect = (file: File | File[]) => {
  kpiVatFile.value = Array.isArray(file) ? file[0] : file;
  kpiVatError.value = '';
  kpiVatSuccess.value = '';
};

/// Загрузка файла с прогрессом
const uploadKpiVatFile = async () => {
  if (!kpiVatFile.value) return;
  
  kpiVatUploading.value = true;
  kpiVatError.value = '';
  kpiVatSuccess.value = '';
  kpiVatProgress.value = 0;
  kpiVatProgressMessage.value = 'Отправка файла...';
  
  // Этапы с примерным прогрессом
  const steps = [
    { progress: 10, message: 'Отправка файла на сервер...' },
    { progress: 30, message: 'Чтение Excel...' },
    { progress: 50, message: 'Парсинг транзакций...' },
    { progress: 70, message: 'Расчёт KPI...' },
    { progress: 90, message: 'Сохранение в базу данных...' },
    { progress: 100, message: 'Готово!' }
  ];
  
  // Запускаем анимацию прогресса
  let stepIndex = 0;
  const progressInterval = setInterval(() => {
    if (stepIndex < steps.length) {
      kpiVatProgress.value = steps[stepIndex].progress;
      kpiVatProgressMessage.value = steps[stepIndex].message;
      stepIndex++;
    }
  }, 800);
  
  try {
    const formData = new FormData();
    formData.append('file', kpiVatFile.value);
    formData.append('year', selectedYear.value);
    formData.append('month', selectedMonth.value);
    
    const response = await fetch('/api/kpi-vat', {
      method: 'POST',
      body: formData
    });
    
    clearInterval(progressInterval);
    kpiVatProgress.value = 95;
    kpiVatProgressMessage.value = 'Обработка ответа...';
    
    const result = await response.json();
    
    if (!response.ok) throw new Error(result.error || 'Ошибка сервера');
    
    if (result.success) {
      allKpiVatData.value = result.data || [];
      
      const totalKpi = result.summary?.reduce((s: number, m: any) => s + m.totalKpiVat, 0) || 0;
      const managersCount = result.summary?.length || 0;
      
      kpiVatProgress.value = 100;
      kpiVatProgressMessage.value = '✅ Готово';
      kpiVatSuccess.value = `Рассчитано для ${managersCount} менеджеров, общий KPI: ${formatMoney(totalKpi)}`;
      
      if (result.summary) {
        result.summary.forEach((s: any) => {
          const manager = managerRatings.value.find(m => m.name === s.manager);
          if (manager) {
            updateManualKpiVat(manager.id, s.totalKpiVat);
          }
        });
      }
      
      setTimeout(() => {
        showKpiVatUploadDialog.value = false;
        kpiVatFile.value = null;
      }, 1500);
    }
  } catch (error: any) {
    clearInterval(progressInterval);
    kpiVatProgress.value = 0;
    kpiVatError.value = error.message;
  } finally {
    kpiVatUploading.value = false;
  }
};


const kpiVatTotal = computed(() => {
  return kpiVatDetails.value.reduce((sum, item) => sum + (item.kpi_vat || 0), 0);
});

// Заголовки таблицы KPI VAT
const kpiVatDetailHeaders = [
  { title: 'Клиент', key: 'client_name', sortable: true },
  { title: 'Прибыль', key: 'total_profit', sortable: true, align: 'end' as const },
  { title: 'KPI НДС', key: 'kpi_vat', sortable: true, align: 'end' as const },
  { title: 'Пополнений', key: 'transactions_count', sortable: true, align: 'center' as const },
  { title: 'Доля', key: 'share', sortable: true, align: 'end' as const }
];

// Получить долю KPI клиента
const getKpiVatShare = (item: KpiVatDetail) => {
  const total = kpiVatTotal.value;
  if (total === 0) return 0;
  return (item.kpi_vat / total) * 100;
};

// Загрузка файла
const handleKpiVatFileUpload = async (file: File | File[]) => {
  const fileToUpload = Array.isArray(file) ? file[0] : file;
  
  if (!fileToUpload) {
    kpiVatFile.value = null;
    return;
  }
  
  kpiVatFile.value = fileToUpload;
  kpiVatUploading.value = true;
  kpiVatError.value = '';
  kpiVatSuccess.value = '';
  
  try {
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('year', selectedYear.value);
    formData.append('month', selectedMonth.value);
    
    if (selectedManagerDetails.value) {
      formData.append('manager', selectedManagerDetails.value.name);
    }
    
    const response = await fetch('/api/kpi-vat', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка загрузки');
    }
    
    const result = await response.json();
    
    if (result.success) {
      kpiVatDetails.value = result.data || [];
      kpiVatSuccess.value = `✅ Рассчитано: ${kpiVatDetails.value.length} клиентов, общий KPI: ${formatMoney(kpiVatTotal.value)}`;
      
      // Если данные есть и открыт менеджер — предзаполняем ручной ввод
      if (selectedManagerDetails.value && result.summary) {
        const managerSummary = result.summary.find(
          (s: any) => s.manager === selectedManagerDetails.value.name
        );
        if (managerSummary) {
          updateManualKpiVat(selectedManagerDetails.value.id, managerSummary.totalKpiVat);
        }
      }
    } else {
      throw new Error(result.error || 'Неизвестная ошибка');
    }
  } catch (error: any) {
    console.error('KPI VAT upload error:', error);
    kpiVatError.value = error.message || 'Ошибка загрузки файла';
    kpiVatDetails.value = [];
  } finally {
    kpiVatUploading.value = false;
  }
};

// Загрузка сохранённых данных при открытии таба
const loadKpiVatDetails = async () => {
  if (!selectedManagerDetails.value) return;
  
  try {
    const params = new URLSearchParams({
      year: selectedYear.value,
      month: selectedMonth.value,
      manager: selectedManagerDetails.value.name
    });
    
    const response = await fetch(`/api/kpi-vat?${params}`);
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        kpiVatDetails.value = result.data;
      }
    }
  } catch (error) {
    console.error('Load KPI VAT error:', error);
  }
};

// Применить KPI к менеджеру
const applyKpiVatToManager = () => {
  if (!selectedManagerDetails.value) return;
  
  updateManualKpiVat(selectedManagerDetails.value.id, kpiVatTotal.value);
  kpiVatSuccess.value = `✅ Применено: ${formatMoney(kpiVatTotal.value)}`;
  
  // Сохраняем сразу
  saveStateToServer();
};

// Следим за открытием таба KPI VAT
watch(activeTab, (newTab) => {
  if (newTab === 'kpiVat' && selectedManagerDetails.value) {
    loadKpiVatDetails();
  }
});

// Следим за сменой менеджера в диалоге
watch(selectedManagerDetails, (newManager) => {
  if (newManager && activeTab.value === 'kpiVat') {
    kpiVatDetails.value = [];
    loadKpiVatDetails();
  }
});

// Пересчёт KPI NO_VAT для всех менеджеров
const recalculateAllKpiNoVat = () => {
  const year = parseInt(selectedYear.value);
  const month = parseInt(selectedMonth.value);
  
  filteredManagers.value.forEach(manager => {
    const managerName = manager.displayName;
    
    // Собираем операции этого менеджера
    const allOps = store.bufferData.filter(op => op.manager === managerName);
    
    // Группируем по клиентам и месяцам
    const clientMonthlyMap = new Map();
    
    allOps.forEach(op => {
      if (!clientMonthlyMap.has(op.client)) {
        clientMonthlyMap.set(op.client, new Map());
      }
      const [day, opMonth, opYear] = op.date.split('-');
      const monthKey = `${opYear}-${opMonth}`;
      const current = clientMonthlyMap.get(op.client).get(monthKey) || 0;
      clientMonthlyMap.get(op.client).set(monthKey, current + op.amount);
    });
    
    // Получаем бонусные статусы клиентов
    const managerBonuses = store.bonusHistory.filter(b => b.currentManager === managerName);
    const bonusClients = new Set(managerBonuses.filter(b => b.status === 'ДА').map(b => b.client));
    
    // Считаем KPI NO_VAT
    let totalKpi = 0;
    
    clientMonthlyMap.forEach((months, client) => {
      // Проверяем кастомный статус
      const customKey = `${client}_${managerName}`;
      const custom = customBonusStatus.value[customKey];
      
      let status = 'НЕТ';
      if (custom?.status === 'ДА') status = 'ДА';
      else if (custom?.status === 'БЫЛ') status = 'БЫЛ';
      else if (bonusClients.has(client)) status = 'ДА';
      else if (store.isKpiReceivedForClient(client)) status = 'БЫЛ';
      
      if (status === 'ДА') {
        // Находим максимальную сумму за 3 месяца
        let maxAmount = 0;
        for (let i = 0; i < 3; i++) {
          const d = new Date(year, month - 1 - i, 1);
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          const amount = months.get(key) || 0;
          if (amount > maxAmount) maxAmount = amount;
        }
        
        const rate = selectedKpiRate.value[manager.id] || 0.015;
        totalKpi += maxAmount * rate;
      }
    });
    
    managerKpiValues.value[manager.id] = totalKpi;
  });
  
  console.log('🔄 Пересчитан KPI NO_VAT:', JSON.stringify(managerKpiValues.value));
  saveStateToServer();
};


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

// ВРЕМЕННЫЙ КОД ДЛЯ КНОПОК KPI
const showKpiButton = ref(true);

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
  { title: 'Пополнений', key: 'operations', sortable: true, align: 'center' as const },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' as const }
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
) => {
  // 1. Проверяем кастомный статус (имеет приоритет)
  const customKey = `${clientName}_${managerName}`;
  const custom = customBonusStatus.value[customKey];
  
  if (custom) {
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
  
  // 2. Проверяем глобальный список получивших KPI
  const alreadyReceived = store.isKpiReceivedForClient(clientName);
  if (alreadyReceived) {
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
  
  // 3. По умолчанию — НЕТ
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

// ========== ОСНОВНАЯ ФУНКЦИЯ УСТАНОВКИ СТАТУСА ==========
const setBonusStatus = async (clientName: string, status: string) => {
  if (!selectedManagerDetails.value) {
    console.error('❌ Ошибка: выберите менеджера');
    alert('Ошибка: выберите менеджера');
    return;
  }

  const manager = selectedManagerDetails.value.originalManager;
  const managerName = manager.displayName;
  const managerId = selectedManagerDetails.value.id;
  const customKey = `${clientName}_${managerName}`;
  const currentMonthKey = `${selectedYear.value}-${selectedMonth.value}`;

  console.log(`🔄 setBonusStatus: клиент="${clientName}", статус="${status}", менеджер="${managerName}"`);

  if (status === 'НЕТ') {
    delete customBonusStatus.value[customKey];
    await store.removeKpiReceivedClient(clientName);
  } 
  else if (status === 'ДА') {
    customBonusStatus.value = {
      ...customBonusStatus.value,
      [customKey]: {
        status: 'ДА',
        bonusMonth: currentMonthKey
      }
    };
  } 
  else if (status === 'БЫЛ') {
    customBonusStatus.value = {
      ...customBonusStatus.value,
      [customKey]: {
        status: 'БЫЛ',
        bonusMonth: currentMonthKey
      }
    };
  }

  await saveStateToServer();
  await store.loadKpiReceivedClients();
  forceUpdate.value = Date.now();
  
  setTimeout(() => {
    const managerItem = managerRatings.value.find(m => m.id === managerId);
    if (managerItem) {
      managerKpiValues.value[managerId] = managerItem.managerKpi || 0;
      saveStateToServer();
    }
    forceUpdate.value = Date.now();
  }, 100);
};

// Кнопка KPI (временная)
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
    
    const managerKpiNoVat = managerKpiValues.value[manager.id] || 0;
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
  
  // Собираем операции по месяцам
  const clientMonthlyMap = new Map();
  const allOps = store.bufferData.filter(op => op.manager === managerName);
  
  allOps.forEach(op => {
    if (!clientMonthlyMap.has(op.client)) {
      clientMonthlyMap.set(op.client, new Map());
    }
    const [day, opMonth, opYear] = op.date.split('-');
    const monthKey = `${opYear}-${opMonth}`;
    const currentAmount = clientMonthlyMap.get(op.client).get(monthKey) || 0;
    clientMonthlyMap.get(op.client).set(monthKey, currentAmount + op.amount);
  });
  
  // Создаём карту клиентов
  const clientCurrentMap = new Map();
  
  // Добавляем клиентов из bonusHistory
  const managerBonuses = bonushistory.value.filter(b => b.currentManager === managerName);
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
        maxAmount: 0,
        maxAmountMonth: null,
        fileStatus: bonus.status,
        hasOperations: false
      });
    }
  });
  
  // Добавляем клиентов из операций текущего месяца
  const currentMonthOps = allOps.filter(op => {
    const [day, opMonth, opYear] = op.date.split('-');
    return parseInt(opYear) === year && parseInt(opMonth) === month;
  });
  
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
  
  // Вычисляем maxAmount для всех клиентов
  for (const [client, data] of clientCurrentMap.entries()) {
    const months = clientMonthlyMap.get(client) || new Map();
    let maxAmount = 0;
    let maxMonth = null;
    
    for (let i = 0; i < 3; i++) {
      const checkDate = new Date(year, month - 1 - i, 1);
      const checkKey = `${checkDate.getFullYear()}-${(checkDate.getMonth() + 1).toString().padStart(2, '0')}`;
      const amount = months.get(checkKey) || 0;
      if (amount > maxAmount) {
        maxAmount = amount;
        maxMonth = checkKey;
      }
    }
    
    data.maxAmount = maxAmount;
    data.maxAmountMonth = maxMonth;
  }
  
  const allClients = Array.from(clientCurrentMap.values());
  const rate = getSelectedKpiRate(selectedManagerDetails.value);
  
  // Применяем логику статусов
  const clientsWithStatus = allClients.map(data => {
    const bonusStatus = getClientBonusStatus(
      data.client,
      managerName,
      year,
      month,
      clientMonthlyMap.get(data.client) || new Map()
    );
    return { 
      ...data, 
      ...bonusStatus,
      maxAmount: data.maxAmount,
      maxAmountMonth: data.maxAmountMonth
    };
  });
  
  const active = clientsWithStatus
    .filter(data => data.status === 'ДА' && data.noVatAmount > 0)
    .map(data => ({
      ...data,
      displayAmount: data.maxAmount,
      kpiAmount: data.maxAmount * rate,
      baseInfo: `Макс. за период: ${formatMoney(data.maxAmount)}`,
      monthInfo: data.maxAmountMonth ? `Макс. месяц: ${data.maxAmountMonth}` : null
    }));
  
  const was = clientsWithStatus
    .filter(data => data.status === 'БЫЛ' && data.noVatAmount > 0)
    .map(data => ({ ...data }));
  
  const non = clientsWithStatus
    .filter(data => data.status === 'НЕТ' && data.noVatAmount > 0)
    .map(data => {
      const clientMonths = clientMonthlyMap.get(data.client) || new Map();
      let maxAmount = 0;
      let maxMonth = null;
      
      for (let i = 0; i < 3; i++) {
        const checkDate = new Date(year, month - 1 - i, 1);
        const checkKey = `${checkDate.getFullYear()}-${(checkDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const amount = clientMonths.get(checkKey) || 0;
        if (amount > maxAmount) {
          maxAmount = amount;
          maxMonth = checkKey;
        }
      }
      
      const displayAmount = maxAmount > 0 ? maxAmount : data.noVatAmount;
      
      return {
        ...data,
        maxAmount,
        maxAmountMonth: maxMonth,
        displayAmount,
        monthInfo: maxMonth ? `Месяц: ${maxMonth}` : null,
        baseInfo: maxAmount > 0 ? `Макс. сумма: ${formatMoney(maxAmount)}` : null
      };
    });
  
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
  
  if (selectedYearNum < now.getFullYear() || 
      (selectedYearNum === now.getFullYear() && selectedMonthNum < now.getMonth() + 1)) {
    return fact;
  }
  
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

const totalPlan = computed(() => {
  return filteredManagers.value.reduce((sum, m) => sum + (m.plan || 80000), 0);
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

// Защита от двойного вызова
let isRefreshing = false;

// Обновление данных
const refreshData = async () => {
  if (isRefreshing) {
    console.log('⏩ refreshData уже выполняется, пропускаю');
    return;
  }
  
  isRefreshing = true;
  loading.value = true;
  
  try {
    const year = parseInt(selectedYear.value);
    const month = parseInt(selectedMonth.value);
    
    store.bufferData = [];
    
    if (store.managers.length === 0) {
      await store.loadManagers();
    }
    
    await store.loadPlans(year, month);
    
    for (let i = 0; i < 3; i++) {
      const d = new Date(year, month - 1 - i, 1);
      await store.loadBufferData(d.getFullYear(), d.getMonth() + 1);
    }
    
    await store.loadMaintenanceRates();
    await store.loadKpiRates();
    await store.loadBonusHistory();
    await store.loadKpiReceivedClients();
    
    await loadAllKpiVatData();
    recalculateAllKpiNoVat();
    
    forceUpdate.value = Date.now();
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    loading.value = false;
    isRefreshing = false;
  }
};

// Обработчик для временных кнопок KPI
const handleKpiKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'K') {
    showKpiButton.value = !showKpiButton.value;
    console.log('🔧 Кнопки KPI:', showKpiButton.value ? 'показаны' : 'скрыты');
  }
};

const kpiVatProgress = ref(0);
const kpiVatProgressMessage = ref('');



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

// ИНИЦИАЛИЗАЦИЯ
onMounted(async () => {
    store.bufferData = [];
  await store.loadKpiReceivedClients();
  await loadStateFromServer();
  await refreshData();
  window.addEventListener('keydown', handleKpiKeyDown);
});
</script>

<style scoped>

.info-light {
  background-color: rgba(var(--v-theme-info), 0.05) !important;
}

.success-light {
  background-color: rgba(var(--v-theme-success), 0.05) !important;
}

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

.auth-basic-card {
  border-radius: 8px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
}
</style>
