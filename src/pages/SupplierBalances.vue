<template>
  <v-container fluid class="page-content">
    <div class="header-filters mb-4">
      <div class="d-flex align-center ga-3 flex-wrap">
        <v-select v-model="selectedClients" :items="clients" label="Юр. лица" multiple chips density="compact" variant="outlined" hide-details style="width: 20rem;">
          <template v-slot:prepend-item>
            <v-list-item @click="toggleAllClients">
              <v-list-item-title>{{ allClientsSelected ? 'Снять всё' : 'Выбрать всё' }}</v-list-item-title>
            </v-list-item>
            <v-divider></v-divider>
          </template>
        </v-select>
        <v-select v-model="selectedPeriod" :items="periods" label="Период" density="compact" variant="outlined" hide-details style="width: 14rem;"></v-select>
        <template v-if="selectedPeriod === 'custom'">
          <v-text-field v-model="customDateStart" type="date" label="С" density="compact" variant="outlined" hide-details style="width: 16rem;"></v-text-field>
          <v-text-field v-model="customDateEnd" type="date" label="По" density="compact" variant="outlined" hide-details style="width: 16rem;"></v-text-field>
        </template>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="tonal" density="compact" prepend-icon="ri-refresh-line" @click="refreshAll" :loading="loading">Обновить</v-btn>
      </div>
    </div>
    <v-row>
      <v-expand-transition>
        <v-col v-if="showForecast" cols="12" :md="showExpenses ? 6 : 12" class="order-first">
          <v-card elevation="0" class="widget-card">
            <div class="widget-header d-flex align-center pa-3">
              <v-icon color="warning" class="mr-2">ri-timer-line</v-icon>
              <span class="text-subtitle-1 font-weight-medium">Прогноз остатка</span>
              <v-spacer></v-spacer>
              <v-btn icon="ri-file-excel-line" color="success" variant="text" size="small" @click="exportToExcel"></v-btn>
              <v-btn icon="ri-close-line" variant="text" size="small" @click="showForecast = false"></v-btn>
            </div>
            <v-divider></v-divider>
            <div class="pa-4 table-responsive">
              <v-table density="compact" v-if="forecastData.length > 0" class="forecast-table">
                <thead>
                  <tr>
                    <th>Поставщик</th>
                    <th class="text-right">Баланс</th>
                    <th class="text-center">Осталось</th>
                    <th class="text-right">Средний<br>Расход (3 дн.)</th>
                    <th class="text-right">Средний<br>Расход (7 дн.)</th>
                    <th class="text-right">Пополнение</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in forecastData" :key="item.name">
                    <td class="font-weight-bold">
                      {{ item.name }}
                      <template v-if="item.receivedAt">
                        <br><small class="text-grey">{{ formatTime(item.receivedAt) }}</small>
                      </template>
                    </td>
                    <td class="text-right font-weight-bold">
                      <span :class="item.balance >= 0 ? 'text-success' : 'text-error'">{{ formatMoney(item.balance) }}</span>
                    </td>
                    <td class="text-center">
                      <v-chip color="grey-darken-1" size="small" variant="flat" class="text-white font-weight-bold">
                        ~{{ item.daysLeftWithReplenishment }} дн.
                      </v-chip>
                    </td>
                    <td class="text-right text-error font-weight-bold">{{ formatMoney(item.expense3) }}</td>
                    <td class="text-right text-error font-weight-bold">{{ formatMoney(item.expense7) }}</td>
                    <td class="text-right">
                      <template v-if="editingReplenishment === item.name">
                        <v-text-field
                          v-model="replenishments[item.name]"
                          type="number"
                          density="compact"
                          variant="outlined"
                          hide-details
                          autofocus
                          style="max-width: 120px; width: 100%;"
                          @blur="saveReplenishment(item.name)"
                          @keyup.enter="saveReplenishment(item.name)"
                        ></v-text-field>
                      </template>
                      <template v-else>
                        <span class="replenishment-value" @click="startEditReplenishment(item.name)">
                          {{ formatMoney(replenishments[item.name] || 0) }}
                          <v-icon size="14" class="ml-1 edit-icon">ri-pencil-line</v-icon>
                        </span>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <div v-else class="text-center py-4 text-grey">Загрузка...</div>
            </div>
          </v-card>
        </v-col>
      </v-expand-transition>
      <v-expand-transition>
        <v-col v-if="showExpenses" cols="12" :md="showForecast ? 6 : 12">
          <v-card elevation="0" class="widget-card">
            <div class="widget-header d-flex align-center pa-3">
              <v-icon color="primary" class="mr-2">ri-bar-chart-line</v-icon>
              <span class="text-subtitle-1 font-weight-medium">Расходы по поставщикам</span>
              <v-spacer></v-spacer>
              <v-btn icon="ri-close-line" variant="text" size="small" @click="showExpenses = false"></v-btn>
            </div>
            <v-divider></v-divider>
            <div class="pa-4"><div ref="expensesChart" class="expenses-chart"></div></div>
          </v-card>
        </v-col>
      </v-expand-transition>
    </v-row>
    <v-row v-if="!showExpenses || !showForecast" class="mt-2">
      <v-col cols="12">
        <div class="d-flex ga-2">
          <v-chip v-if="!showForecast" color="warning" variant="tonal" @click="showForecast = true; loadForecast();"><v-icon size="16" class="mr-1">ri-timer-line</v-icon> Прогноз</v-chip>
          <v-chip v-if="!showExpenses" color="primary" variant="tonal" @click="showExpenses = true; initExpensesChart();"><v-icon size="16" class="mr-1">ri-bar-chart-line</v-icon> Расходы</v-chip>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import Highcharts from 'highcharts';
import * as XLSX from 'xlsx';

const props = defineProps<{ theme?: string; primaryColor?: string; }>();
const isDark = computed(() => props.theme === 'dark');
const chartColor = computed(() => isDark.value ? '#FF5252' : '#F44336');
const chartBgColor = computed(() => isDark.value ? '#1E1E2D' : 'transparent');
const chartTextColor = computed(() => isDark.value ? '#FFFFFF' : '#333333');
const loading = ref(false);

const savedWidgets = localStorage.getItem('widgets_visible');
let ie = true, iF = true;
if (savedWidgets) { try { const s = JSON.parse(savedWidgets); ie = s.expenses ?? true; iF = s.forecast ?? true; } catch {} }
const showExpenses = ref(ie), showForecast = ref(iF);
watch([showExpenses, showForecast], () => localStorage.setItem('widgets_visible', JSON.stringify({ expenses: showExpenses.value, forecast: showForecast.value })));

const expensesChart = ref(null); let expensesInstance: any = null;
const forecastData = ref<any[]>([]);
const replenishments = ref<Record<string, number>>({});
const editingReplenishment = ref<string | null>(null);
const clients = ['Монблан', 'Фаэтон']; const selectedClients = ref(['Монблан', 'Фаэтон']);
const allClientsSelected = computed(() => selectedClients.value.length === clients.length);
const toggleAllClients = () => selectedClients.value = allClientsSelected.value ? [] : [...clients];
const periods = [{ title: 'Сегодня', value: 'day' },{ title: '3 дня', value: '3days' },{ title: '7 дней', value: '7days' },{ title: '30 дней', value: '30days' },{ title: 'Период', value: 'custom' }];
const selectedPeriod = ref('day'), customDateStart = ref(''), customDateEnd = ref('');
const suppliers = [{ key: '1', label: 'Natcar' },{ key: 'РН', label: 'Роснефть' },{ key: 'Лукойл', label: 'Ликард' },{ key: 'Мультикарта', label: 'ППР' },{ key: 'ТН', label: 'Татнефть' }];

const getDates = (d: number) => { const n = new Date(), y = new Date(n.getTime()-86400000), s = new Date(n.getTime()-(d+1)*86400000); return { dateStart: formatDate(s), dateEnd: formatDate(y) }; };
const formatDate = (d: Date) => `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
const formatMoney = (a: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2 }).format(a);
const formatTime = (iso: string) => '↻ ' + new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

const exportToExcel = () => {
  const today = new Date();
  const daysUntilTuesday = (2 - today.getDay() + 7) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 - today.getDay() + 7) % 7 || 7));
  const mondayStr = nextMonday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  
  const headers = ['Поставщик', 'Пополнение', 'Баланс', 'Ср. расход 3 дн', 'Ср. расход 7 дн', `Остаток на ${mondayStr} + 1 день`, 'Осталось (дн)'];
  const rows = [headers];
  
  for (const item of forecastData.value) {
    const balanceOnTuesday = item.balance + (replenishments.value[item.name] || 0) - (item.expense7 * daysUntilTuesday);
    
    rows.push([
      item.name,
      (replenishments.value[item.name] || 0),
      item.balance,
      item.expense3,
      item.expense7,
      balanceOnTuesday,
      item.daysLeftWithReplenishment
    ]);
  }
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  ws['!cols'] = headers.map((h, c) => {
    let maxLen = h.length;
    for (let r = 1; r < rows.length; r++) {
      maxLen = Math.max(maxLen, (rows[r][c] || '').toString().length);
    }
    return { wch: maxLen + 4 };
  });
  
  for (let r = 1; r < rows.length; r++) {
    for (let c = 1; c <= 5; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (ws[cellRef]) {
        ws[cellRef].z = '#,##0.00';
      }
    }
  }
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Прогноз остатков');
  XLSX.writeFile(wb, `Прогноз_остатков_${new Date().toISOString().slice(0,10)}.xlsx`);
};

const startEditReplenishment = (name: string) => {
  editingReplenishment.value = name;
  if (!replenishments.value[name]) replenishments.value[name] = 0;
  replenishments.value[name] = parseFloat(replenishments.value[name] as any) || 0;
};

const saveReplenishment = (name: string) => {
  editingReplenishment.value = null;
  const extra = parseFloat(replenishments.value[name] as any) || 0;
  replenishments.value[name] = extra;
  
  forecastData.value = [...forecastData.value.map(item => {
    if (item.name === name) {
      const totalBalance = item.balance + extra;
      const daysLeft = item.expense7 > 0 ? Math.floor(totalBalance / item.expense7) : (totalBalance > 0 ? 99 : 0);
      return { ...item, daysLeftWithReplenishment: daysLeft };
    }
    return item;
  })];
};

const initExpensesChart = () => { nextTick(() => { if (!expensesChart.value) return; if (expensesInstance) expensesInstance.destroy(); expensesInstance = Highcharts.chart(expensesChart.value, { chart: { type: 'bar', backgroundColor: chartBgColor.value, style: { fontFamily: 'Roboto, sans-serif' } }, accessibility: { enabled: false }, title: { text: '' }, xAxis: { type: 'category', labels: { style: { fontSize: '1.2rem', color: chartTextColor.value } } }, yAxis: { title: { text: 'Расход (₽)', style: { color: chartTextColor.value } }, min: 0, tickAmount: 6, gridLineColor: isDark.value ? '#333' : '#E0E0E0', labels: { style: { color: chartTextColor.value }, formatter: function(this:any) { return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(this.value); } } }, tooltip: { pointFormat: 'Расход: <b>{point.y:,.2f} ₽</b>' }, plotOptions: { bar: { borderRadius: 4, pointPadding: 0.1, groupPadding: 0.1 } }, legend: { enabled: false }, credits: { enabled: false }, series: [{ name: 'Расход', data: [], color: chartColor.value }] }); loadExpenses(); }); };

const fetchDailyExpenses = async (days: number) => {
  const dates = getDates(days), queries: { name: string; query: string }[] = [];
  if (selectedClients.value.includes('Монблан')) suppliers.forEach(s => queries.push({ name: s.label, query: s.key }));
  if (selectedClients.value.includes('Фаэтон')) suppliers.forEach(s => queries.push({ name: s.label + ' (Фаэтон)', query: s.key + ' ( Фаэтон )' }));
  const allDates: string[] = [], endDate = new Date(dates.dateEnd.split('-').reverse().join('-'));
  for (let i = days-1; i >= 0; i--) { const d = new Date(endDate.getTime()-i*86400000); allDates.push(d.toISOString().slice(0,10)); }
  return Promise.all(queries.map(async q => {
    const p = new URLSearchParams(); p.set('supplier', q.query); p.set('dateStart', dates.dateStart); p.set('dateEnd', dates.dateEnd); p.set('field', 'sumPos');
    const r = await fetch(`/api/proxy/expenses.php?${p.toString()}`), data = await r.json(), dateMap: Record<string,number> = {};
    if (data.chartData && Array.isArray(data.chartData)) data.chartData.forEach(([d,a]:[string,number]) => { dateMap[d] = a; });
    return { name: q.name, dailyTotals: allDates.map(d => dateMap[d] || 0) };
  }));
};

const loadExpenses = async () => {
  if (!expensesInstance) return;
  const days = selectedPeriod.value === 'day' ? 1 : selectedPeriod.value === '3days' ? 3 : selectedPeriod.value === '7days' ? 7 : 30;
  const results = await fetchDailyExpenses(days), totalValues = results.map(r => ({ name: r.name, totalValue: r.dailyTotals.reduce((a,b) => a+b, 0) }));
  expensesInstance.series[0].remove(false);
  expensesInstance.addSeries({ name: 'Расход', data: totalValues.map(r => [r.name, r.totalValue]), color: chartColor.value, animation: { duration: 1000, easing: 'easeOutBounce' } }, false);
  expensesInstance.redraw(true);
};

const loadForecast = async () => {
  try {
    const [respBalances, tnResp] = await Promise.all([fetch('/api/proxy/balances.php'), fetch('/api/proxy/tatneft-balance.php')]);
    const balancesResponse = await respBalances.json();
    const balancesData = balancesResponse.balances ?? balancesResponse;
    const apiReceivedAt = balancesResponse.updated_at ?? null;
    const tnCache = await tnResp.json();
    const daily7 = await fetchDailyExpenses(7);
    const result: any[] = [];

    for (const supplier of suppliers) {
      for (const client of selectedClients.value) {
        const suffix = client === 'Фаэтон' ? ' (Фаэтон)' : '';
        const displayName = supplier.label + suffix;
        let balance: number; let receivedAt: string | null = null;

        if (supplier.key === 'ТН') {
          const tnKey = client === 'Фаэтон' ? 'faeton' : 'montblanc';
          balance = tnCache[tnKey]?.current?.balance ?? 0;
          receivedAt = tnCache[tnKey]?.current?.received_at ?? null;
        } else {
          const balanceKey = client === 'Фаэтон' ? supplier.key + ' ( Фаэтон )' : supplier.key;
          const balanceItem = balancesData.find((b: any) => b.agregator === balanceKey);
          balance = balanceItem ? parseFloat(balanceItem.balance) || 0 : 0;
          receivedAt = apiReceivedAt;
        }

        const expData = daily7.find(e => e.name === displayName);
        const dailyTotals = expData ? expData.dailyTotals : [];
        const last3 = dailyTotals.slice(-3), sum3 = last3.reduce((a,b) => a+b, 0), avg3 = last3.length > 0 ? sum3 / last3.length : 0;
        const sum7 = dailyTotals.reduce((a,b) => a+b, 0), avg7 = dailyTotals.length > 0 ? sum7 / dailyTotals.length : 0;
        const daysLeft = avg7 > 0 ? Math.floor(balance / avg7) : (balance > 0 ? 99 : 0);
        const extra = parseFloat(replenishments.value[displayName] as any) || 0;
        const daysLeftWithReplenishment = avg7 > 0 ? Math.floor((balance + extra) / avg7) : ((balance + extra) > 0 ? 99 : 0);

        result.push({ name: displayName, balance, expense3: avg3, expense7: avg7, daysLeft, daysLeftWithReplenishment, receivedAt });
      }
    }

    forecastData.value = result;
  } catch (e) { console.error(e); }
};

const refreshAll = async () => { loading.value = true; await loadExpenses(); await loadForecast(); loading.value = false; };

let tatneftInterval: ReturnType<typeof setInterval> | null = null;

watch([selectedPeriod, selectedClients], () => { if (selectedPeriod.value !== 'custom') refreshAll(); }, { deep: true });
watch(() => props.theme, () => { if (expensesInstance) initExpensesChart(); });

onMounted(() => {
  if (showExpenses.value) initExpensesChart();
  if (showForecast.value) {
    loadForecast();
    tatneftInterval = setInterval(() => { refreshAll(); }, 25 * 60 * 1000);
  }
});

onBeforeUnmount(() => {
  if (expensesInstance) expensesInstance.destroy();
  if (tatneftInterval) clearInterval(tatneftInterval);
});
</script>

<style scoped>
.page-content { padding: 2.4rem; background-color: #F5F5F5; min-height: 100vh; }
.header-filters { background: #fff; border-radius: 1.2rem; padding: 1.2rem 1.6rem; border: 1px solid rgba(0,0,0,0.05); }
.widget-card { border-radius: 1.6rem !important; overflow: hidden; border: 1px solid rgba(0,0,0,0.05) !important; height: 100%; }
.widget-header { background-color: #FAFAFA; }
.table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.expenses-chart { width: 100%; height: clamp(30rem, 50vh, 50rem); }
.replenishment-value { cursor: pointer; white-space: nowrap; }
.replenishment-value:hover { color: #1976d2; }
.replenishment-value:hover .edit-icon { opacity: 1; }
.edit-icon { opacity: 0.4; transition: opacity 0.2s; }
</style>