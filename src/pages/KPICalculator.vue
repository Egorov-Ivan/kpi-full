<!-- src/pages/KPICalculator.vue -->
<template>
  <v-container fluid class="page-content">
    <v-row>
      <v-col cols="12">
        <!-- Заголовок страницы: скрыт на мобильных -->
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
            <div class="filter-wrapper">
              <v-select
                v-model="selectedYear"
                :items="years"
                label="Год"
                variant="outlined"
                density="compact"
                hide-details
              ></v-select>
            </div>

            <div class="filter-wrapper">
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
              size="small"
              prepend-icon="ri-file-excel-2-line"
              @click="showKpiVatUploadDialog = true"
              class="d-none d-sm-inline-flex"
            >
              Загрузить KPI НДС
            </v-btn>

            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="ri-refresh-line"
              @click="refreshData"
              class="d-none d-sm-inline-flex"
            >
              Обновить
            </v-btn>
          </div>

          <!-- Статистика: буфер скрыт на мобильных -->
          <v-divider></v-divider>
          
          <div class="pa-4 d-flex justify-space-between align-center">
            <div class="text-caption text-grey d-none d-sm-block">
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

          <!-- ДЕСКТОП: Таблица рейтинга -->
          <div class="table-responsive">
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
                  <span class="text-h6 font-weight-bold" :class="approvedManagers[`${selectedYear}-${selectedMonth}`]?.[item.id] ? 'text-success' : 'text-error'">
                    {{ formatMoney(item.payment) }}
                  </span>
                </div>
              </template>

              <template v-slot:item.approved="{ item }">
                <v-chip 
                  size="x-small" 
                  :color="approvedManagers[`${selectedYear}-${selectedMonth}`]?.[item.id] ? 'success' : 'error'" 
                  variant="tonal"
                  @click="toggleApproved(item.id)"
                  class="cursor-pointer"
                >
                  {{ approvedManagers[`${selectedYear}-${selectedMonth}`]?.[item.id] ? 'ДА' : 'НЕТ' }}
                </v-chip>
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
          </div>

         
          <!-- Итоги: десктоп -->
          <div class="pa-4 d-none d-sm-flex justify-space-between align-center">
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
              <v-btn icon variant="text" @click="showDetailsDialog = false">
                <v-icon>ri-close-line</v-icon>
              </v-btn>
            </v-card-title>
            <v-divider></v-divider>
            
            <v-card-text class="pa-4">
              <!-- Алерт блокировки -->
              <v-alert v-if="isManagerLocked" type="warning" variant="tonal" class="mb-4">
                ⚠️ Выплата утверждена. Изменения заблокированы.
              </v-alert>
              
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
                    <div class="text-h5 font-weight-bold text-info">{{ formatMoney(manualKpiVat[`${selectedYear}-${selectedMonth}`]?.[selectedManagerDetails.id] || 0) }}</div>
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
                      <v-btn-toggle
                        :model-value="selectedRate[`${selectedYear}-${selectedMonth}`]?.[selectedManagerDetails.id]"
                        @update:model-value="(val: number) => updateSelectedRate(selectedManagerDetails.id, val)"
                        mandatory divided class="flex-wrap" :disabled="isManagerLocked"
                      >
                        <v-btn v-for="rate in store.maintenanceRates" :key="rate.id" :value="rate.value" :color="(selectedRate[`${selectedYear}-${selectedMonth}`]?.[selectedManagerDetails.id]) === rate.value ? 'primary' : undefined" variant="outlined" class="ma-1" :disabled="!isRateAllowed(selectedManagerDetails.originalManager, rate.id)">
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
                      <v-btn-toggle
                        :model-value="selectedKpiRate[`${selectedYear}-${selectedMonth}`]?.[selectedManagerDetails.id]"
                        @update:model-value="(val: number) => updateSelectedKpiRate(selectedManagerDetails.id, val)"
                        mandatory divided class="flex-wrap" :disabled="isManagerLocked"
                      >
                        <v-btn v-for="rate in kpiNoVatRates" :key="rate.id" :value="rate.value" :color="(selectedKpiRate[`${selectedYear}-${selectedMonth}`]?.[selectedManagerDetails.id]) === rate.value ? 'success' : undefined" variant="outlined" class="ma-1">
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
                              <v-btn size="x-small" color="success" variant="tonal" @click="setBonusStatus(item.client, 'ДА')" :disabled="isManagerLocked">
                                <v-icon size="small">ri-check-line</v-icon> ДА
                              </v-btn>
                              <v-btn size="x-small" color="warning" variant="tonal" @click="setBonusStatus(item.client, 'БЫЛ')">
                                <v-icon size="small">ri-arrow-right-line</v-icon> БЫЛ
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

                      <!-- Дата первой заправки -->
                      <v-card variant="tonal" class="pa-4 mb-4" color="orange-light">
                        <v-card-text>
                          <div class="text-subtitle-1 font-weight-medium mb-3">
                            <v-icon start color="orange">ri-calendar-line</v-icon>
                            Дата первой заправки
                          </div>
                          
                          <v-select
                            v-model="selectedClientForFirstDate"
                            :items="currentManagerKpiVatDetails.map(c => c.client_name)"
                            label="Выберите клиента"
                            variant="outlined"
                            density="compact"
                            class="mb-3"
                            clearable
                          ></v-select>
                          
                          <div v-if="selectedClientForFirstDate && manualFirstTransactionDate[selectedClientForFirstDate]" class="text-caption text-success mb-2">
                            ✅ Сохранено: {{ manualFirstTransactionDate[selectedClientForFirstDate] }}
                          </div>
                          <div v-if="selectedClientForFirstDate && !manualFirstTransactionDate[selectedClientForFirstDate]" class="text-caption text-grey mb-2">
                            Дата ещё не указана
                          </div>
                          
                          <v-row v-if="selectedClientForFirstDate" class="mb-2">
                            <v-col cols="8">
                              <v-text-field
                                v-model="manualFirstTransactionDate[selectedClientForFirstDate]"
                                label="Дата первой заправки"
                                variant="outlined"
                                density="compact"
                                placeholder="ДД.ММ.ГГГГ"
                                hint="Формат: ДД.ММ.ГГГГ"
                                persistent-hint
                              ></v-text-field>
                            </v-col>
                            <v-col cols="4" class="d-flex align-center">
                              <v-btn
                                color="success"
                                variant="tonal"
                                @click="saveManualFirstDate"
                                :disabled="!manualFirstTransactionDate[selectedClientForFirstDate]"
                                block
                              >
                                <v-icon start>ri-check-line</v-icon>
                                Сохранить
                              </v-btn>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>

                      <!-- Загрузка Excel/CSV для менеджера -->
                      <v-card variant="tonal" class="pa-4 mb-4" color="info-light">
                        <v-card-text>
                          <div class="text-subtitle-1 font-weight-medium mb-3">
                            <v-icon start color="info">ri-file-excel-2-line</v-icon>
                            Загрузить файл для менеджера
                          </div>
                          
                          <v-file-input
                            v-model="managerKpiVatFile"
                            label="Выберите Excel (.xlsx) или CSV файл"
                            accept=".xlsx,.xls,.csv"
                            prepend-icon="ri-upload-cloud-2-line"
                            variant="outlined"
                            density="compact"
                            :disabled="isManagerLocked || kpiVatUploading"
                            persistent-hint
                            hint="Данные для {{ selectedManagerDetails?.name }}"
                          ></v-file-input>
                          
                          <v-btn
                            v-if="managerKpiVatFile"
                            color="info"
                            variant="tonal"
                            :loading="kpiVatUploading"
                            :disabled="kpiVatUploading"
                            @click="uploadManagerKpiVatFile"
                            block
                            class="mt-2"
                          >
                            Загрузить для {{ selectedManagerDetails?.name }}
                          </v-btn>
                        </v-card-text>
                      </v-card>

                      <!-- Ручной ввод -->
                      <v-card variant="tonal" class="pa-4 mb-4">
                        <v-card-text>
                          <div class="text-subtitle-1 font-weight-medium mb-3">Ручной ввод KPI НДС</div>
                          <v-text-field 
                            :model-value="manualKpiVat[`${selectedYear}-${selectedMonth}`]?.[selectedManagerDetails.id]"
                            @update:model-value="val => updateManualKpiVat(selectedManagerDetails.id, val)"
                            :disabled="isManagerLocked"
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
                            <span class="font-weight-medium text-primary">{{ formatMoney(manualKpiVat[`${selectedYear}-${selectedMonth}`]?.[selectedManagerDetails.id] || 0) }}</span>
                          </div>
                        </v-card-text>
                      </v-card>

                      <!-- Автоматический расчёт -->
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

                            <template v-slot:item.first_date="{ item }">
                              <div class="text-center text-caption">
                                {{ manualFirstTransactionDate[item.client_name] || '—' }}
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
                              :disabled="isManagerLocked"
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
                          Загрузите Excel или CSV через кнопку «Загрузить KPI НДС» на странице рейтинга
                        </p>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- Диалог загрузки KPI VAT -->
        <v-dialog v-model="showKpiVatUploadDialog" max-width="500" persistent>
          <v-card>
            <v-card-title class="d-flex align-center pa-4">
              <v-icon color="info" class="mr-2">ri-file-excel-2-line</v-icon>
              Загрузка KPI НДС из файла
              <v-spacer></v-spacer>
              <v-btn icon variant="text" @click="showKpiVatUploadDialog = false" :disabled="kpiVatUploading">
                <v-icon>ri-close-line</v-icon>
              </v-btn>
            </v-card-title>
            
            <v-card-text class="pa-4">
              <p class="text-body-2 text-grey mb-4">
                Загрузите Excel (.xlsx) или CSV файл с данными за <strong>{{ selectedMonthName }} {{ selectedYear }}</strong>.
                KPI будет рассчитан для всех менеджеров автоматически.
              </p>
              
              <v-file-input
                v-model="kpiVatFile"
                label="Выберите Excel (.xlsx) или CSV файл"
                accept=".xlsx,.xls,.csv"
                prepend-icon="ri-upload-cloud-2-line"
                variant="outlined"
                density="compact"
                :disabled="kpiVatUploading"
                @update:model-value="handleKpiVatFileSelect"
                persistent-hint
                hint="Колонки: Менеджер, Юр.лицо клиента, Сумма для нас, Сумма для клиента"
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
import * as XLSX from 'xlsx';

const store = useKpiStore();
const loading = ref(false);
const activeTab = ref('maintenance');
const initialized = ref(false);

// ========== КОНВЕРТАЦИЯ EXCEL → CSV ==========
const convertExcelToCsv = async (file: File): Promise<File> => {
  if (file.name.endsWith('.csv')) return file;
  
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { 
      type: 'array',
      codepage: 1251
    });
    const firstSheet = workbook.SheetNames[0];
    
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet], { 
      FS: ';',
      strip: true
    });
    
    // Конвертируем из Windows-1251 в UTF-8
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('windows-1251');
    
    // Перекодируем каждый символ
    const bytes = new Uint8Array(csv.length);
    for (let i = 0; i < csv.length; i++) {
      bytes[i] = csv.charCodeAt(i);
    }
    const utf8 = decoder.decode(bytes);
    
    // Добавляем BOM
    const BOM = '\uFEFF';
    
    return new File([BOM + utf8], file.name.replace(/\.xlsx?$/, '.csv'), { 
      type: 'text/csv;charset=utf-8' 
    });
  } catch (error) {
    console.error('Ошибка конвертации Excel → CSV:', error);
    throw new Error('Не удалось прочитать Excel-файл');
  }
};

// ========== СОСТОЯНИЕ ФИЛЬТРОВ ==========
const currentDate = new Date();
const selectedYear = ref(currentDate.getFullYear().toString());
const selectedMonth = ref((currentDate.getMonth() + 1).toString().padStart(2, '0'));

const showDetailsDialog = ref(false);
const selectedManagerDetails = ref<any>(null);

// ========== ДАТА ПЕРВОЙ ЗАПРАВКИ ==========
const selectedClientForFirstDate = ref('');
const manualFirstTransactionDate = ref<Record<string, string>>({});

const saveManualFirstDate = async () => {
  const clientName = selectedClientForFirstDate.value;
  const date = manualFirstTransactionDate.value[clientName];
  if (!clientName || !date) return;
  
  const parts = date.split('.');
  const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : date;
  
  try {
    await fetch('/api/client-first-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, firstTransactionDate: isoDate })
    });
    console.log('✅ Дата сохранена:', clientName, isoDate);
  } catch (e) {
    console.error('Ошибка сохранения:', e);
  }
};

const loadManualFirstDates = async () => {
  try {
    const response = await fetch('/api/proxy/client-first-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.status === 'ok' && result.clients) {
        const dates: Record<string, string> = {};
        result.clients.forEach((c: any) => {
          if (c.clientName && c.firstTransactionDate) {
            // Только убираем кавычки, без toLowerCase
            const cleanName = c.clientName
              .replace(/"/g, '')
              .trim();
            
            dates[cleanName] = c.firstTransactionDate;
          }
        });
        manualFirstTransactionDate.value = dates;
        console.log('✅ Загружены даты из API:', Object.keys(dates).length);
      }
    }
  } catch (e) {
    console.error('Ошибка загрузки дат:', e);
  }
};

// ========== KPI VAT ЗАГРУЗКА ДЛЯ МЕНЕДЖЕРА ==========
const managerKpiVatFile = ref<File | null>(null);

const uploadManagerKpiVatFile = async () => {
  console.log('🚀 Старт загрузки для менеджера');
  
  if (!managerKpiVatFile.value) {
    console.log('❌ Нет файла');
    return;
  }
  
  if (!selectedManagerDetails.value) {
    console.log('❌ Нет менеджера');
    return;
  }
  
  kpiVatUploading.value = true;
  kpiVatError.value = '';
  kpiVatSuccess.value = '';
  
  try {
    const csvFile = await convertExcelToCsv(managerKpiVatFile.value);
    
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('year', selectedYear.value);
    formData.append('month', selectedMonth.value);
    formData.append('manager', selectedManagerDetails.value.name);
    
    console.log('🚀 Отправляю запрос на /api/kpi-vat');
    
    const response = await fetch('/api/kpi-vat', {
      method: 'POST',
      body: formData
    });
    
    console.log('🚀 Ответ сервера:', response.status);
    
    const result = await response.json();
    console.log('🚀 result:', result);
    
    if (!response.ok) throw new Error(result.error || 'Ошибка сервера');
    
    if (result.success) {
      console.log('🚀 Успех! Данных:', result.data?.length);
      allKpiVatData.value = result.data || [];
      kpiVatSuccess.value = `✅ Загружено для ${selectedManagerDetails.value.name}`;
      managerKpiVatFile.value = null;
    } else {
      kpiVatError.value = result.warning || 'Неизвестная ошибка';
    }
  } catch (error: any) {
    console.error('🚀 Ошибка:', error);
    kpiVatError.value = error.message;
  } finally {
    kpiVatUploading.value = false;
    console.log('🚀 Загрузка завершена');
  }
};

// ========== KPI VAT АВТОМАТИЧЕСКИЙ РАСЧЁТ ==========
const showKpiVatUploadDialog = ref(false);
const kpiVatFile = ref<File | null>(null);
const kpiVatUploading = ref(false);
const kpiVatError = ref('');
const kpiVatSuccess = ref('');

interface KpiVatDetail {
  client_name: string;
  total_profit: number;
  transactions_count: number;
  kpi_vat: number;
  rate: number;
  client_age_months: number;
}

const allKpiVatData = ref<any[]>([]);
const kpiVatDetails = ref<KpiVatDetail[]>([]);

const loadAllKpiVatData = async () => {
  try {
    const params = new URLSearchParams({ year: selectedYear.value, month: selectedMonth.value });
    const response = await fetch(`/api/kpi-vat?${params}`);
    console.log('📥 KPI VAT GET статус:', response.status);
    if (response.ok) {
      const result = await response.json();
      console.log('📥 KPI VAT данные:', result.data?.length, 'записей');
      if (result.success) {
        allKpiVatData.value = result.data || [];
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки KPI VAT:', error);
  }
};

const deleteKpiVatData = async () => {
  if (!confirm(`Удалить все данные KPI НДС за ${selectedMonthName.value} ${selectedYear.value}?`)) return;
  kpiVatUploading.value = true;
  try {
    const params = new URLSearchParams({ year: selectedYear.value, month: selectedMonth.value });
    const response = await fetch(`/api/kpi-vat?${params}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Ошибка');
    if (result.success) {
      allKpiVatData.value = [];
      kpiVatDetails.value = [];
      const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
      manualKpiVat.value[monthKey] = {};
      saveStateToServer();
      kpiVatSuccess.value = '✅ Данные и ручные вводы удалены';
      kpiVatFile.value = null;
    }
  } catch (error: any) {
    kpiVatError.value = error.message;
  } finally {
    kpiVatUploading.value = false;
  }
};

const currentManagerKpiVatDetails = computed(() => {
  if (!selectedManagerDetails.value) return [];
  const year = parseInt(selectedYear.value);
  const month = parseInt(selectedMonth.value);
  
  const filtered = allKpiVatData.value
    .filter(item => item && item.manager_name === selectedManagerDetails.value.name);
  
  console.log('📊 filtered KPI VAT:', filtered.length, 'manager:', selectedManagerDetails.value.name);
  
  const result = filtered.map(item => {
    const manualDate = manualFirstTransactionDate.value[item.client_name];
    if (manualDate) {
      const parts = manualDate.split('.');
      if (parts.length === 3) {
        const firstDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const calcDate = new Date(year, month - 1, 1);
        let ageMonths = (calcDate.getFullYear() - firstDate.getFullYear()) * 12;
        ageMonths += calcDate.getMonth() - firstDate.getMonth();
        const age = Math.max(0, ageMonths);
        const rate = age < 3 ? 0.25 : 0.025;
        return { ...item, client_age_months: age, rate: rate, kpi_vat: item.total_profit * rate };
      }
    }
    return item;
  });
  
  console.log('📊 result KPI VAT:', result.length);
  return result;
});

const currentManagerKpiVatTotal = computed(() => {
  return currentManagerKpiVatDetails.value.reduce((sum, item) => sum + Number(item.kpi_vat || 0), 0);
});

const getCurrentManagerKpiVatShare = (item: any) => {
  const total = currentManagerKpiVatTotal.value;
  if (total === 0) return 0;
  return (Number(item.kpi_vat) / total) * 100;
};

const handleKpiVatFileSelect = (file: File | File[]) => {
  kpiVatFile.value = Array.isArray(file) ? file[0] : file;
  kpiVatError.value = '';
  kpiVatSuccess.value = '';
};

const uploadKpiVatFile = async () => {
  if (!kpiVatFile.value) return;
  kpiVatUploading.value = true;
  kpiVatError.value = '';
  kpiVatSuccess.value = '';
  kpiVatProgress.value = 0;
  kpiVatProgressMessage.value = 'Конвертация файла...';
  
  try {
    kpiVatProgress.value = 15;
    kpiVatProgressMessage.value = 'Чтение файла...';
    const csvFile = await convertExcelToCsv(kpiVatFile.value);
    
    const steps = [
      { progress: 30, message: 'Отправка на сервер...' },
      { progress: 50, message: 'Парсинг данных...' },
      { progress: 70, message: 'Расчёт KPI...' },
      { progress: 90, message: 'Сохранение в БД...' },
      { progress: 100, message: 'Готово!' }
    ];
    
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        kpiVatProgress.value = steps[stepIndex].progress;
        kpiVatProgressMessage.value = steps[stepIndex].message;
        stepIndex++;
      }
    }, 800);
    
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('year', selectedYear.value);
    formData.append('month', selectedMonth.value);
    
    const response = await fetch('/api/kpi-vat', { method: 'POST', body: formData });
    clearInterval(progressInterval);
    kpiVatProgress.value = 95;
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Ошибка');
    
    if (result.success) {
      allKpiVatData.value = result.data || [];
      const totalKpi = result.summary?.reduce((s: number, m: any) => s + m.totalKpiVat, 0) || 0;
      const managersCount = result.summary?.length || 0;
      
      kpiVatProgress.value = 100;
      kpiVatProgressMessage.value = '✅ Готово';
      kpiVatSuccess.value = `Рассчитано для ${managersCount} менеджеров, общий KPI: ${formatMoney(totalKpi)}`;
      
      setTimeout(() => {
        showKpiVatUploadDialog.value = false;
        kpiVatFile.value = null;
      }, 1500);
    }
  } catch (error: any) {
    kpiVatProgress.value = 0;
    kpiVatError.value = error.message;
  } finally {
    kpiVatUploading.value = false;
  }
};

const kpiVatTotal = computed(() => kpiVatDetails.value.reduce((sum, item) => sum + (item.kpi_vat || 0), 0));

const kpiVatDetailHeaders = [
  { title: 'Клиент', key: 'client_name', sortable: true },
  { title: 'Прибыль', key: 'total_profit', sortable: true, align: 'end' as const },
  { title: 'KPI НДС', key: 'kpi_vat', sortable: true, align: 'end' as const },
  { title: 'Дата первой заправки', key: 'first_date', sortable: true, align: 'center' as const },
  { title: 'Пополнений', key: 'transactions_count', sortable: true, align: 'center' as const },
  { title: 'Доля', key: 'share', sortable: true, align: 'end' as const }
];

const getKpiVatShare = (item: KpiVatDetail) => {
  const total = kpiVatTotal.value;
  if (total === 0) return 0;
  return (item.kpi_vat / total) * 100;
};

const loadKpiVatDetails = async () => {
  if (!selectedManagerDetails.value) return;
  try {
    const params = new URLSearchParams({ year: selectedYear.value, month: selectedMonth.value, manager: selectedManagerDetails.value.name });
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

const applyKpiVatToManager = () => {
  if (!selectedManagerDetails.value) return;
  const total = Math.round(currentManagerKpiVatTotal.value * 100) / 100;
  updateManualKpiVat(selectedManagerDetails.value.id, total);
  kpiVatSuccess.value = `✅ Применено: ${formatMoney(total)}`;
  saveStateToServer();
};

watch(activeTab, (newTab) => {
  if (newTab === 'kpiVat' && selectedManagerDetails.value) loadKpiVatDetails();
});

watch(selectedManagerDetails, (newManager) => {
  if (newManager && activeTab.value === 'kpiVat') {
    kpiVatDetails.value = [];
    loadKpiVatDetails();
  }
});

const selectedRate = ref<Record<string, Record<string, number>>>({});
const selectedKpiRate = ref<Record<string, Record<string, number>>>({});
const managerKpiValues = ref<Record<string, Record<string, number>>>({});
const manualKpiVat = ref<Record<string, Record<string, number>>>({});

const kpiNoVatRates = ref([
  { id: 'kpi_1', value: 0.015, label: '1.50%' },
  { id: 'kpi_2', value: 0.02, label: '2.00%' },
  { id: 'kpi_3', value: 0.03, label: '3.00%' },
]);

// Вспомогательные функции для обновления вложенных ставок
const updateSelectedRate = (managerId: string, value: number) => {
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  if (!selectedRate.value[monthKey]) {
    selectedRate.value[monthKey] = {};
  }
  // Создаём новый объект, чтобы триггерить реактивность
  selectedRate.value[monthKey] = {
    ...selectedRate.value[monthKey],
    [managerId]: value
  };
  console.log('✅ selectedRate обновлён:', monthKey, managerId, value);
};

const updateSelectedKpiRate = (managerId: string, value: number) => {
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  if (!selectedKpiRate.value[monthKey]) {
    selectedKpiRate.value[monthKey] = {};
  }
  // Создаём новый объект, чтобы триггерить реактивность
  selectedKpiRate.value[monthKey] = {
    ...selectedKpiRate.value[monthKey],
    [managerId]: value
  };
  console.log('✅ selectedKpiRate обновлён:', monthKey, managerId, value);
};

const getSelectedRate = (item: any): number => {
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  if (selectedRate.value[monthKey]?.[item.id]) return selectedRate.value[monthKey][item.id];
  const manager = item.originalManager;
  if (manager.allowedMaintenanceRates?.includes('m015')) return 0.0015;
  if (manager.allowedMaintenanceRates?.includes('m020')) return 0.002;
  if (manager.allowedMaintenanceRates?.includes('m030')) return 0.003;
  return 0.0015;
};

const getSelectedKpiRate = (item: any): number => {
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  return selectedKpiRate.value[monthKey]?.[item.id] || 0.015;
};

const bonushistory = computed(() => store.bonusHistory);
const customBonusStatus = ref<Record<string, any>>({});
const forceUpdate = ref(0);
const showKpiButton = ref(true);

//========== РАБОТА С СЕРВЕРОМ ==========
const loadStateFromServer = async (isFirstLoad = false) => {
  try {
    console.log('📡 Загрузка KPI настроек с сервера...');
    const settings = await store.loadKpiSettings();
    
    if (settings.customBonusStatus) {
      customBonusStatus.value = { ...customBonusStatus.value, ...settings.customBonusStatus };
    }
    
    if (settings.managerKpiValues) {
      for (const [key, value] of Object.entries(settings.managerKpiValues)) {
        if (!managerKpiValues.value[key]) managerKpiValues.value[key] = {};
        Object.assign(managerKpiValues.value[key], value);
      }
    }
    
    if (settings.selectedRate) {
      for (const [key, value] of Object.entries(settings.selectedRate)) {
        if (!selectedRate.value[key]) selectedRate.value[key] = {};
        Object.assign(selectedRate.value[key], value);
      }
    }
    
    if (settings.selectedKpiRate) {
      for (const [key, value] of Object.entries(settings.selectedKpiRate)) {
        if (!selectedKpiRate.value[key]) selectedKpiRate.value[key] = {};
        Object.assign(selectedKpiRate.value[key], value);
      }
    }
    
    if (settings.manualKpiVat) {
      for (const [key, value] of Object.entries(settings.manualKpiVat)) {
        if (!manualKpiVat.value[key]) manualKpiVat.value[key] = {};
        Object.assign(manualKpiVat.value[key], value);
      }
    }
    
    if (settings.approvedManagers) {
      approvedManagers.value = { ...approvedManagers.value, ...settings.approvedManagers };
    }
    
    if (isFirstLoad) {
      if (settings.selectedYear) selectedYear.value = settings.selectedYear;
      if (settings.selectedMonth) selectedMonth.value = settings.selectedMonth;
    }
    
    forceUpdate.value = Date.now();
  } catch (e) {
    console.error('Ошибка загрузки с сервера:', e);
  }
};

const saveStateToServer = async () => {
  try {
    const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
    const dataToSave = {
      customBonusStatus: customBonusStatus.value,
      managerKpiValues: { [monthKey]: managerKpiValues.value[monthKey] || {} },
      selectedRate: { [monthKey]: selectedRate.value[monthKey] || {} },
      selectedKpiRate: { [monthKey]: selectedKpiRate.value[monthKey] || {} },
      manualKpiVat: { [monthKey]: manualKpiVat.value[monthKey] || {} },
      approvedManagers: approvedManagers.value,
      selectedYear: selectedYear.value,
      selectedMonth: selectedMonth.value
    };
    
    console.log('💾 saveStateToServer:', monthKey, dataToSave);
    await store.saveAllKpiSettings(dataToSave);
    console.log('✅ Сохранено успешно');
  } catch (e) {
    console.error('❌ Ошибка сохранения:', e);
  }
};

// watch для автосохранения
watch(
  [customBonusStatus, managerKpiValues, selectedRate, selectedKpiRate, manualKpiVat], 
  (newVals, oldVals) => {
    console.log('🔄 watch сработал, сохраняем...');
    saveStateToServer();
  }, 
  { deep: true }
);

// watch для переключения месяца — загружаем данные с сервера, но НЕ сохраняем
watch([selectedYear, selectedMonth], async () => {
  await loadStateFromServer();
  await refreshData();
});

// ========== УТИЛИТЫ ==========
const parseNumberInput = (value: string): number => {
  const cleaned = value.replace(',', '.').replace(/\s/g, '').replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const updateManualKpiVat = (managerId: string, value: any) => {
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  if (!manualKpiVat.value[monthKey]) manualKpiVat.value[monthKey] = {};
  manualKpiVat.value[monthKey][managerId] = typeof value === 'string' ? parseNumberInput(value) : value;
  saveStateToServer();
};

const formatNumber = (value: number): string => new Intl.NumberFormat('ru-RU').format(value);
const formatMoney = (amount: number): string => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

const years = Array.from({ length: 5 }, (_, i) => (2024 + i).toString());
const months = [
  { title: 'Январь', value: '01' }, { title: 'Февраль', value: '02' }, { title: 'Март', value: '03' },
  { title: 'Апрель', value: '04' }, { title: 'Май', value: '05' }, { title: 'Июнь', value: '06' },
  { title: 'Июль', value: '07' }, { title: 'Август', value: '08' }, { title: 'Сентябрь', value: '09' },
  { title: 'Октябрь', value: '10' }, { title: 'Ноябрь', value: '11' }, { title: 'Декабрь', value: '12' }
];

const ratingHeaders = [
  { title: '#', key: 'rank', sortable: false, width: '60', align: 'center' as const },
  { title: 'Менеджер', key: 'manager', sortable: true },
  { title: 'План пополнений', key: 'plan', sortable: true, align: 'end' as const },
  { title: 'Факт (пополнения)', key: 'fact', sortable: true, align: 'end' as const },
  { title: 'Выполнение', key: 'planPercent', sortable: true },
  { title: 'К выплате', key: 'payment', sortable: true, align: 'end' as const },
  { title: '', key: 'actions', sortable: false, width: '60', align: 'center' as const },
  { title: 'Утв.', key: 'approved', sortable: false, width: '50', align: 'center' as const },
];

const maintenanceClientHeaders = [
  { title: 'Клиент', key: 'client', sortable: true },
  { title: 'Пополнения (NO_VAT)', key: 'totalAmount', sortable: true, align: 'end' as const },
  { title: 'Ведение', key: 'maintenance', sortable: true, align: 'end' as const },
  { title: 'Доля', key: 'share', sortable: true, align: 'end' as const },
  { title: 'Пополнений', key: 'operations', sortable: true, align: 'center' as const }
];

const kpiClientHeaders = [
  { title: 'Клиент', key: 'client', sortable: true },
  { title: 'База KPI Без НДС', key: 'kpiBase', sortable: true, align: 'end' as const },
  { title: 'Сумма KPI', key: 'kpiAmount', sortable: true, align: 'end' as const },
  { title: 'Бонусный месяц', key: 'bonusMonth', sortable: true, align: 'center' as const },
  { title: 'Первая заправка', key: 'firstFillDate', sortable: true, align: 'center' as const },
  { title: 'Пополнений', key: 'operations', sortable: true, align: 'center' as const },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' as const }
];

const wasKpiClientHeaders = [
  { title: 'Клиент', key: 'client', sortable: true },
  { title: 'Пополнения без НДС', key: 'noVatAmount', sortable: true, align: 'end' as const },
  { title: 'Статус в файле', key: 'fileStatus', sortable: true, align: 'center' as const },
  { title: 'Месяц бонуса', key: 'bonusMonth', sortable: true, align: 'center' as const },
  { title: 'Первая заправка', key: 'firstFillDate', sortable: true, align: 'center' as const },
  { title: 'Пополнений', key: 'operations', sortable: true, align: 'center' as const },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' as const }
];

const nonKpiClientHeaders = [
  { title: 'Клиент', key: 'client', sortable: true },
  { title: 'Пополнения без НДС', key: 'noVatAmount', sortable: true, align: 'end' as const },
  { title: 'Макс. за 3 мес.', key: 'displayAmount', sortable: true, align: 'end' as const },
  { title: 'Статус', key: 'fileStatus', sortable: true, align: 'center' as const },
  { title: 'Первая заправка', key: 'firstFillDate', sortable: true, align: 'center' as const },
  { title: 'Пополнений', key: 'operations', sortable: true, align: 'center' as const },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' as const }
];

const allowedRoles = ['Менеджер', 'Старший Менеджер', 'Ведущий Менеджер'];

const filteredManagers = computed(() => store.managers.filter(manager => manager.role && allowedRoles.includes(manager.role)));

const bufferStats = computed(() => {
  const operations = store.bufferData;
  if (!operations.length) return { totalOperations: 0, totalClients: 0, dateRange: { first: null, last: null } };
  const uniqueClients = new Set(operations.map(op => op.client));
  return { totalOperations: operations.length, totalClients: uniqueClients.size };
});

const managersStats = computed(() => {
  const year = parseInt(selectedYear.value);
  const month = parseInt(selectedMonth.value);
  
  let filteredOps = store.bufferData.filter(op => {
    if (!op.date) return false;
    const [day, opMonth, opYear] = op.date.split('-');
    return parseInt(opYear) === year && parseInt(opMonth) === month;
  });

  // Правило перераспределения клиентов Моревой с 01.06.2026
  if (year === 2026 && month >= 6) {
    const redistributionMap: Record<string, { managerId: string; managerName: string }> = {
      'ООО А-РЕНТ': { managerId: '41', managerName: 'Сысоева Кристина Владимировна' },
      'ИП Комарова Светлана Алексеевна': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Поляков Роман Николаевич': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ООО ГАСА': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Липовский Иван Николаевич': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Станкевич Игорь Александрович': { managerId: '41', managerName: 'Сысоева Кристина Владимировна' },
      'ИП Бородай Татьяна Анатольевна': { managerId: '40', managerName: 'Овсянников Артем Геннадиевич' },
      'ИП Давыдов Вячеслав Александрович': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Багомаев Муслим Сергеевич': { managerId: '40', managerName: 'Овсянников Артем Геннадиевич' },
      'ИП Пузыревский Константин Петрович': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Алыев Акиф Микаил Оглы': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Мусин Эмиль Маратович': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Наумов Дмитрий Николаевич': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Файзиев Айнур Фаязович': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Авдонин Алексей Сергеевич': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Пригородов Александр Владимирович': { managerId: '40', managerName: 'Овсянников Артем Геннадиевич' },
      'ИП Гимадеев Айдар Илдарович': { managerId: '40', managerName: 'Овсянников Артем Геннадиевич' },
      'ИП Климова Юлия Александровна': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Утанов Сергей Владимирович': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Ниталиев Азамат Рыскалиевич': { managerId: '40', managerName: 'Овсянников Артем Геннадиевич' },
      'ИП Маркович Владимир Владимирович': { managerId: '41', managerName: 'Сысоева Кристина Владимировна' },
      'ИП Соколов Вячеслав Александрович': { managerId: '37', managerName: 'Самедов Али Мехман оглы' },
      'ИП Чаур Александр Валерьевич': { managerId: '40', managerName: 'Овсянников Артем Геннадиевич' },
    };

   filteredOps = filteredOps.map(op => {
      const mapping = redistributionMap[op.client];
      if (mapping && op.manager === 'Морева Кристина Олеговна') {
        const [day, opMonth, opYear] = op.date.split('-');
        const opDate = new Date(parseInt(opYear), parseInt(opMonth) - 1, parseInt(day));
        const cutoffDate = new Date(2026, 5, 1); // 01.06.2026
        
        if (opDate >= cutoffDate) {
          return {
            ...op,
            manager: mapping.managerName,
            managerId: mapping.managerId
          };
        }
      }
      return op;
    });
    }

  const stats = new Map();
  filteredOps.forEach(op => {
    if (!op.managerId) return;
    if (!stats.has(op.managerId)) {
      stats.set(op.managerId, { manager: op.manager, managerId: op.managerId, totalAmount: 0, noVatAmount: 0, vatAmount: 0, operationsCount: 0, uniqueClients: new Set() });
    }
    const stat = stats.get(op.managerId);
    stat.totalAmount += op.amount;
    stat.operationsCount += 1;
    stat.uniqueClients.add(op.client);
    if (op.clientType === 'NO_VAT') stat.noVatAmount += op.amount;
    else stat.vatAmount += op.amount;
  });
  for (const [, stat] of stats.entries()) stat.uniqueClients = stat.uniqueClients.size;
  return stats;
});

const isRateAllowed = (manager: Manager, rateId: string): boolean => !manager.allowedMaintenanceRates?.length || manager.allowedMaintenanceRates.includes(rateId);

const getAllowedRates = (manager: Manager): string[] => {
  const rates: string[] = [];
  if (manager.allowedMaintenanceRates?.includes('m015')) rates.push('0.15%');
  if (manager.allowedMaintenanceRates?.includes('m020')) rates.push('0.20%');
  if (manager.allowedMaintenanceRates?.includes('m030')) rates.push('0.30%');
  return rates;
};

const calculatePayment = (item: any): number => (item.noVatAmount || 0) * getSelectedRate(item);

const calculateKpiAmount = (item: any): number => kpiClientBaseTotal.value * getSelectedKpiRate(item);

const getClientBonusStatus = (clientName: string, managerName: string, currentYear: number, currentMonth: number, monthlyAmounts: Map<string, number>) => {
  const customKey = `${clientName}_${managerName}`;
  const currentMonthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
  
  const cleanName = clientName.replace(/"/g, '').trim();
  let apiDate = manualFirstTransactionDate.value[clientName];
  if (!apiDate) {
    apiDate = manualFirstTransactionDate.value[cleanName];
  }

  if (apiDate) {
    const parts = apiDate.split('.');
    if (parts.length === 3) {
      const firstDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const calcDate = new Date(currentYear, currentMonth - 1, 1);
    }
  }

  // 1. СНАЧАЛА проверяем ручной статус
  const newFormat = customBonusStatus.value[currentMonthKey]?.[customKey];
  const oldFormat = customBonusStatus.value[customKey];
  const custom = newFormat || oldFormat;
  
  if (custom) {
    if (custom.status === 'НЕТ') {
      return { 
        status: 'НЕТ', 
        firstFillDate: apiDate || null, 
        maxAmount: 0, 
        maxMonth: null, 
        hasActiveBonus: false, 
        allMonthsCompleted: false, 
        fileStatus: 'НЕТ' 
      };
    }
    
    return { 
      status: custom.status, 
      firstFillDate: apiDate || null, 
      maxAmount: 0, 
      maxMonth: custom.bonusMonth, 
      hasActiveBonus: custom.status === 'ДА', 
      allMonthsCompleted: true, 
      fileStatus: custom.status 
    };
  }
  
  // 2. Проверяем был ли KPI в прошлых месяцах
  for (const mk of Object.keys(customBonusStatus.value)) {
    if (mk !== currentMonthKey && customBonusStatus.value[mk]?.[customKey]) {
      const pastData = customBonusStatus.value[mk][customKey];
      if (pastData.status === 'НЕТ') continue;
      
      return { 
        status: 'БЫЛ', 
        firstFillDate: apiDate || null, 
        maxAmount: 0, 
        maxMonth: null, 
        hasActiveBonus: false, 
        allMonthsCompleted: true, 
        fileStatus: 'KPI ранее', 
        bonusMonth: pastData.bonusMonth || null 
      };
    }
  }
  
  // 3. ПОТОМ проверяем автоматический статус по дате
  if (apiDate) {
    const parts = apiDate.split('.');
    if (parts.length === 3) {
      const firstDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const calcDate = new Date(currentYear, currentMonth - 1, 1);
      let ageMonths = (calcDate.getFullYear() - firstDate.getFullYear()) * 12;
      ageMonths += calcDate.getMonth() - firstDate.getMonth();
      
      if (ageMonths >= 3) {
        return { 
          status: 'БЫЛ', 
          firstFillDate: apiDate, 
          maxAmount: 0, 
          maxMonth: null, 
          hasActiveBonus: false, 
          allMonthsCompleted: true, 
          fileStatus: 'Бонус закончился (>3 мес)' 
        };
      }
    }
  }
  
  // 4. Старый API
  if (store.isKpiReceivedForClient(clientName)) {
    return { 
      status: 'БЫЛ', 
      firstFillDate: apiDate || null, 
      maxAmount: 0, 
      maxMonth: null, 
      hasActiveBonus: false, 
      allMonthsCompleted: true, 
      fileStatus: 'KPI уже получен' 
    };
  }
  
  // 5. По умолчанию — НЕТ
  return { 
    status: 'НЕТ', 
    firstFillDate: apiDate || null, 
    maxAmount: 0, 
    maxMonth: null, 
    hasActiveBonus: false, 
    allMonthsCompleted: false, 
    fileStatus: undefined 
  };
};

const updateTrigger = ref(0);

const setBonusStatus = async (clientName: string, status: string) => {
  console.log('🟡 setBonusStatus вызван:', clientName, status);
  if (!selectedManagerDetails.value) {
    console.log('❌ Нет selectedManagerDetails');
    return;
  }
  const manager = selectedManagerDetails.value.originalManager;
  const managerName = manager.displayName;
  const customKey = `${clientName}_${managerName}`;
  const currentMonthKey = `${selectedYear.value}-${selectedMonth.value}`;
  
  if (!customBonusStatus.value[currentMonthKey]) {
    customBonusStatus.value[currentMonthKey] = {};
  }
  
  if (status === 'НЕТ') {
    // Отмена KPI
    customBonusStatus.value[currentMonthKey][customKey] = { status: 'НЕТ', bonusMonth: null };
    // ✅ Удаляем клиента из глобального списка получивших KPI
    await store.removeKpiReceivedClient(clientName);
  } else if (status === 'ДА') {
    // Выдаём KPI
    customBonusStatus.value[currentMonthKey][customKey] = { status: 'ДА', bonusMonth: currentMonthKey };
    // ✅ Добавляем клиента в глобальный список получивших KPI
    await store.markKpiReceived(clientName, managerName, currentMonthKey);
  } else if (status === 'БЫЛ') {
    // Помечаем как "было ранее"
    customBonusStatus.value[currentMonthKey][customKey] = { status: 'БЫЛ', bonusMonth: currentMonthKey };
  }
  
  await saveStateToServer();
  await store.loadKpiReceivedClients();
  
  // Принудительно обновляем интерфейс
  updateTrigger.value++;
  forceUpdate.value = Date.now();
  recalculateAllKpiNoVat();
};

const markSingleClientKpi = async (item: any) => {
  if (!selectedManagerDetails.value) return;
  if (!confirm(`Разрешить получение KPI?\n\nКлиент: ${item.client}\nМенеджер: ${selectedManagerDetails.value.originalManager.displayName}`)) return;
  try {
    await store.removeKpiReceived(item.client);
    await store.loadKpiReceivedClients();
    alert(`✅ KPI разрешён: ${item.client}`);
    updateTrigger.value++;
    forceUpdate.value = Date.now();
  } catch (error) { 
    alert('❌ Ошибка'); 
  }
};

const recalculateAllKpiNoVat = () => {
  const year = parseInt(selectedYear.value);
  const month = parseInt(selectedMonth.value);
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  
  // Инициализируем managerKpiValues для текущего месяца
  if (!managerKpiValues.value[monthKey]) {
    managerKpiValues.value[monthKey] = {};
  }
  
  filteredManagers.value.forEach(manager => {
    const managerName = manager.displayName;
    const allOps = store.bufferData.filter(op => op.manager === managerName);
    const clientMonthlyMap = new Map();
    
    allOps.forEach(op => {
      if (!clientMonthlyMap.has(op.client)) clientMonthlyMap.set(op.client, new Map());
      const [day, opMonth, opYear] = op.date.split('-');
      const monthKeyOps = `${opYear}-${opMonth}`;
      const current = clientMonthlyMap.get(op.client).get(monthKeyOps) || 0;
      clientMonthlyMap.get(op.client).set(monthKeyOps, current + op.amount);
    });
    
    const managerBonuses = store.bonusHistory.filter(b => b.currentManager === managerName);
    const bonusClients = new Set(managerBonuses.filter(b => b.status === 'ДА').map(b => b.client));
    let totalKpi = 0;
    
    clientMonthlyMap.forEach((months, client) => {
      const customKey = `${client}_${managerName}`;
      const currentMonthKey = `${year}-${month.toString().padStart(2, '0')}`;
      let status = 'НЕТ';
      
      const newFormat = customBonusStatus.value[currentMonthKey]?.[customKey];
      const oldFormat = customBonusStatus.value[customKey];
      const custom = newFormat || oldFormat;
      
      if (custom?.status === 'ДА') status = 'ДА';
      else if (custom?.status === 'БЫЛ') status = 'БЫЛ';
      else {
        let wasEarlier = false;
        for (const mk of Object.keys(customBonusStatus.value)) {
          if (mk !== currentMonthKey && customBonusStatus.value[mk]?.[customKey]) { wasEarlier = true; break; }
        }
        if (wasEarlier) status = 'БЫЛ';
        else if (bonusClients.has(client)) status = 'ДА';
        else if (store.isKpiReceivedForClient(client)) status = 'БЫЛ';
      }
      
      if (status === 'ДА') {
        let maxAmount = 0;
        for (let i = 0; i < 3; i++) {
          const d = new Date(year, month - 1 - i, 1);
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          const amount = months.get(key) || 0;
          if (amount > maxAmount) maxAmount = amount;
        }
        const kpiRate = selectedKpiRate.value[monthKey]?.[manager.id] || 0.015;
        totalKpi += maxAmount * kpiRate;
      }
    });
    managerKpiValues.value[monthKey][manager.id] = totalKpi;
  });
  saveStateToServer();
};

const managerRatings = computed(() => {
  const bufferStats = managersStats.value;
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  
  return filteredManagers.value.map((manager) => {
    let totalAmount = 0, noVatAmount = 0, operationsCount = 0, vatAmount = 0, uniqueClients = 0;
    const statData = bufferStats.get(manager.id);
    if (statData) { totalAmount = statData.totalAmount; noVatAmount = statData.noVatAmount; vatAmount = statData.vatAmount; operationsCount = statData.operationsCount; uniqueClients = statData.uniqueClients; }
    const plan = manager.plan || 80000;
    const fact = totalAmount;
    const planPercent = plan > 0 ? (fact / plan) * 100 : 0;
    const rate = getSelectedRate({ id: manager.id, originalManager: manager, noVatAmount });
    const maintenancePayment = noVatAmount * rate;
    const managerKpi = managerKpiValues.value[monthKey]?.[manager.id] || 0;
    const kpiVatAmount = manualKpiVat.value[monthKey]?.[manager.id] || 0;
    const payment = maintenancePayment + managerKpi + kpiVatAmount;
    return { id: manager.id, name: manager.displayName, role: manager.role || 'Менеджер', originalManager: manager, plan, fact, planPercent, payment, maintenancePayment, managerKpi, kpiVatAmount, operationsCount, totalAmount, noVatAmount, vatAmount, uniqueClients };
  }).sort((a, b) => b.planPercent - a.planPercent);
});

const maintenanceClientDetails = computed(() => {
  if (!selectedManagerDetails.value) return [];
  const year = parseInt(selectedYear.value);
  const month = parseInt(selectedMonth.value);
  const manager = selectedManagerDetails.value.originalManager;
  const searchNames = [manager.displayName, ...(manager.aliases || [])].map(n => n?.toLowerCase().trim()).filter(Boolean);
  let allOps: any[] = [];
  searchNames.forEach(name => { allOps = [...allOps, ...bufferService.getOperationsByManager(name, year, month)]; });
  const uniqueOps = Array.from(new Map(allOps.map(op => [`${op.date}-${op.client}-${op.amount}`, op])).values());
  const clientMap = new Map();
  uniqueOps.forEach(op => {
    if (!clientMap.has(op.client)) clientMap.set(op.client, { client: op.client, totalAmount: 0, noVatAmount: 0, operationsCount: 0 });
    const data = clientMap.get(op.client);
    data.totalAmount += op.amount;
    data.operationsCount += 1;
    if (op.clientType === 'NO_VAT') data.noVatAmount += op.amount;
  });
  const rate = getSelectedRate(selectedManagerDetails.value);
  let totalMaintenance = 0;
  const details = Array.from(clientMap.values()).filter(data => data.noVatAmount > 0).map(data => {
    const maintenance = data.noVatAmount * rate;
    totalMaintenance += maintenance;
    return { ...data, maintenance, share: 0 };
  });
  details.forEach(data => { data.share = totalMaintenance > 0 ? (data.maintenance / totalMaintenance) * 100 : 0; });
  return details.sort((a, b) => b.maintenance - a.maintenance);
});

const kpiClientDetails = computed(() => {
  const _ = updateTrigger.value;
  if (!selectedManagerDetails.value) return { active: [], was: [], non: [] };
  const year = parseInt(selectedYear.value);
  const month = parseInt(selectedMonth.value);
  const manager = selectedManagerDetails.value.originalManager;
  const managerName = manager.displayName;
  const clientMonthlyMap = new Map();
  const allOps = store.bufferData.filter(op => op.manager === managerName);
  allOps.forEach(op => {
    if (!clientMonthlyMap.has(op.client)) clientMonthlyMap.set(op.client, new Map());
    const [day, opMonth, opYear] = op.date.split('-');
    clientMonthlyMap.get(op.client).set(`${opYear}-${opMonth}`, (clientMonthlyMap.get(op.client).get(`${opYear}-${opMonth}`) || 0) + op.amount);
  });
  const clientCurrentMap = new Map();
  const managerBonuses = bonushistory.value.filter(b => b.currentManager === managerName);
  managerBonuses.forEach(bonus => {
    if (!clientCurrentMap.has(bonus.client)) clientCurrentMap.set(bonus.client, { client: bonus.client, totalAmount: 0, noVatAmount: 0, vatAmount: 0, operationsCount: 0, firstFillDate: bonus.firstFillDate || null, clientStatus: bonus.status, maxAmount: 0, maxAmountMonth: null, fileStatus: bonus.status, hasOperations: false });
  });
  const threeMonthOps = allOps.filter(op => {
    const [day, opMonth, opYear] = op.date.split('-');
    for (let i = 0; i < 3; i++) {
      const d = new Date(year, month - 1 - i, 1);
      if (parseInt(opYear) === d.getFullYear() && parseInt(opMonth) === (d.getMonth() + 1)) return true;
    }
    return false;
  });
  threeMonthOps.forEach(op => {
    if (op.clientType === 'VAT') return;
    if (!clientCurrentMap.has(op.client)) clientCurrentMap.set(op.client, { client: op.client, totalAmount: 0, noVatAmount: 0, vatAmount: 0, operationsCount: 0, firstFillDate: null, clientStatus: 'НЕТ', maxAmount: 0, maxAmountMonth: null, fileStatus: null, hasOperations: true });
    const data = clientCurrentMap.get(op.client);
    data.totalAmount += op.amount;
    data.operationsCount += 1;
    data.hasOperations = true;
    if (op.clientType === 'NO_VAT') data.noVatAmount += op.amount;
  });
  for (const [client, data] of clientCurrentMap.entries()) {
    const months = clientMonthlyMap.get(client) || new Map();
    let maxAmount = 0, maxMonth = null;
    for (let i = 0; i < 3; i++) {
      const d = new Date(year, month - 1 - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const amount = months.get(key) || 0;
      if (amount > maxAmount) { maxAmount = amount; maxMonth = key; }
    }
    data.maxAmount = maxAmount; data.maxAmountMonth = maxMonth;
  }
  const rate = getSelectedKpiRate(selectedManagerDetails.value);
  const clientsWithStatus = Array.from(clientCurrentMap.values()).map(data => {
    const bonusStatus = getClientBonusStatus(data.client, managerName, year, month, clientMonthlyMap.get(data.client) || new Map());
    return { ...data, ...bonusStatus, maxAmount: data.maxAmount, maxAmountMonth: data.maxAmountMonth };
  });

  clientsWithStatus.forEach(data => {
    if (!data.firstFillDate || data.firstFillDate === '—') {
      data.firstFillDate = manualFirstTransactionDate.value[data.client] || data.firstFillDate;
    }
  });

  const active = clientsWithStatus.filter(data => data.status === 'ДА' && data.maxAmount > 0).map(data => ({ ...data, displayAmount: data.maxAmount, kpiAmount: data.maxAmount * rate, baseInfo: `Макс. за период: ${formatMoney(data.maxAmount)}`, monthInfo: data.maxAmountMonth ? `Макс. месяц: ${data.maxAmountMonth}` : null }));
  const was = clientsWithStatus.filter(data => data.status === 'БЫЛ' && data.maxAmount > 0).map(data => ({ ...data }));
  const non = clientsWithStatus.filter(data => data.status === 'НЕТ' && data.maxAmount > 0).map(data => ({ ...data, displayAmount: data.maxAmount || data.totalAmount, monthInfo: data.maxAmountMonth ? `Месяц: ${data.maxAmountMonth}` : null, baseInfo: data.maxAmount > 0 ? `Макс. сумма: ${formatMoney(data.maxAmount)}` : null }));
  return { active, was, non };
});

const kpiClientBaseTotal = computed(() => kpiClientDetails.value.active.reduce((sum, item) => sum + (item.displayAmount || 0), 0));
const wasKpiClientNoVatTotal = computed(() => kpiClientDetails.value.was.reduce((sum, item) => sum + item.noVatAmount, 0));
const nonKpiClientNoVatTotal = computed(() => kpiClientDetails.value.non.reduce((sum, item) => sum + item.noVatAmount, 0));

const forecast = computed(() => {
  const fact = totalFact.value;
  const now = new Date();
  if (parseInt(selectedYear.value) < now.getFullYear() || (parseInt(selectedYear.value) === now.getFullYear() && parseInt(selectedMonth.value) < now.getMonth() + 1)) return fact;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (fact / Math.max(now.getDate(), 1)) * daysInMonth;
});

const totalFact = computed(() => managerRatings.value.reduce((sum, m) => sum + m.fact, 0));
const totalPayment = computed(() => managerRatings.value.reduce((sum, m) => sum + m.payment, 0));
const averagePlanPercent = computed(() => managerRatings.value.length ? managerRatings.value.reduce((sum, m) => sum + m.planPercent, 0) / managerRatings.value.length : 0);
const selectedMonthName = computed(() => months.find(m => m.value === selectedMonth.value)?.title || '');
const totalPlan = computed(() => filteredManagers.value.reduce((sum, m) => sum + (m.plan || 80000), 0));

const getRoleIcon = (role?: string): string => {
  switch(role) { case 'Старший Менеджер': return 'ri-computer-line'; case 'Руководитель ОП': return 'ri-team-line'; default: return 'ri-user-line'; }
};
const getRoleColor = (role?: string): string => {
  switch(role) { case 'Старший Менеджер': return 'error'; case 'Руководитель ОП': return 'primary'; case 'Менеджер': return 'success'; default: return 'grey'; }
};
const getPercentColor = (percent: number): string => percent >= 100 ? 'success' : percent >= 50 ? 'warning' : 'error';
const getPercentTextColor = (percent: number): string => percent >= 100 ? 'text-success' : percent >= 50 ? 'text-warning' : 'text-error';
const getPaymentColor = (payment: number): string => payment > 0 ? 'text-primary' : 'text-grey';

const saveDialogState = (isOpen: boolean) => { if (!isOpen && selectedManagerDetails.value) saveStateToServer(); };

const openManagerDetails = (item: any) => {
  selectedManagerDetails.value = item;
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  
  // Инициализируем selectedRate для текущего месяца
  if (!selectedRate.value[monthKey]) selectedRate.value[monthKey] = {};
  if (selectedRate.value[monthKey][item.id] === undefined) {
    selectedRate.value[monthKey][item.id] = getSelectedRate(item);
  }
  
  // Инициализируем selectedKpiRate для текущего месяца
  if (!selectedKpiRate.value[monthKey]) selectedKpiRate.value[monthKey] = {};
  if (selectedKpiRate.value[monthKey][item.id] === undefined) {
    selectedKpiRate.value[monthKey][item.id] = 0.015;
  }
  
  if (!manualKpiVat.value[monthKey]) manualKpiVat.value[monthKey] = {};
  if (manualKpiVat.value[monthKey][item.id] === undefined) manualKpiVat.value[monthKey][item.id] = 0;
  
  activeTab.value = localStorage.getItem(`kpi_tab_${item.id}`) || 'maintenance';
  showDetailsDialog.value = true;
};

const approvedManagers = ref<Record<string, Record<string, boolean>>>({});

const toggleApproved = async (managerId: string) => {
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  if (!approvedManagers.value[monthKey]) approvedManagers.value[monthKey] = {};
  approvedManagers.value[monthKey][managerId] = !approvedManagers.value[monthKey][managerId];
  await saveStateToServer();
};

const isManagerLocked = computed(() => {
  if (!selectedManagerDetails.value) return false;
  const monthKey = `${selectedYear.value}-${selectedMonth.value}`;
  return !!approvedManagers.value[monthKey]?.[selectedManagerDetails.value.id];
});

let isRefreshing = false;
const refreshData = async () => {
  if (isRefreshing) return;
  isRefreshing = true;
  loading.value = true;
  try {
    const year = parseInt(selectedYear.value);
    const month = parseInt(selectedMonth.value);
    store.bufferData = [];
    if (store.managers.length === 0) await store.loadManagers();
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

const handleKpiKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'K') { showKpiButton.value = !showKpiButton.value; }
};

const kpiVatProgress = ref(0);
const kpiVatProgressMessage = ref('');

watch(activeTab, (newTab) => { if (selectedManagerDetails.value) localStorage.setItem(`kpi_tab_${selectedManagerDetails.value.id}`, newTab); });
watch([selectedYear, selectedMonth], async () => {
  await loadStateFromServer();
  await refreshData();
});

onMounted(async () => {
  store.bufferData = [];
  await loadManualFirstDates();
  await store.loadKpiReceivedClients();
  await loadStateFromServer(true);
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
  padding: 2.4rem;
  background-color: #F5F5F5;
  min-height: 100vh;
}

.rating-card {
  border-radius: 1.6rem !important;
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
  margin-top: 0.8rem;
  border-radius: 0.8rem !important;
}

.client-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.03) !important;
}

.client-table :deep(.v-data-table__td) {
  padding: 0.8rem 1.2rem !important;
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

.gap-2 { gap: 0.8rem; }
.gap-3 { gap: 1.2rem; }
.gap-4 { gap: 1.6rem; }

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
  border-radius: 0.8rem !important;
  box-shadow: 0 0.8rem 3.2rem rgba(0,0,0,0.3) !important;
}

.orange-light {
  background-color: rgba(255, 152, 0, 0.05) !important;
}

.filter-wrapper {
  min-width: 200px;
}

.table-responsive {
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch;
  display: block;
  width: 100%;
}

.table-responsive :deep(table) {
  min-width: 650px;
  table-layout: auto;
}

.table-responsive :deep(th),
.table-responsive :deep(td) {
  padding: 6px 8px !important;
  font-size: 0.8rem !important;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .filter-wrapper {
    flex: 1;
    min-width: 0;
  }
  
  .page-content {
    padding: 1.2rem;
  }
  
  .rating-card {
    border-radius: 1rem !important;
  }
  
  .table-responsive :deep(th),
  .table-responsive :deep(td) {
    padding: 4px 6px !important;
    font-size: 0.7rem !important;
  }
}
</style>