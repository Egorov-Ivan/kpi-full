<template>
  <v-container fluid class="page-content">
    <div class="header-filters mb-4">
      <div class="d-flex align-center ga-3 flex-wrap">
        <v-select
          v-model="selectedClients"
          :items="clients"
          label="Юр. лица"
          multiple
          chips
          density="compact"
          variant="outlined"
          hide-details
          style="width: 20rem;"
        >
          <template v-slot:prepend-item>
            <v-list-item @click="toggleAllClients">
              <v-list-item-title>
                {{ allClientsSelected ? 'Снять всё' : 'Выбрать всё' }}
              </v-list-item-title>
            </v-list-item>

            <v-divider></v-divider>
          </template>
        </v-select>

        <v-spacer></v-spacer>

        <v-btn
          color="primary"
          variant="tonal"
          density="compact"
          prepend-icon="ri-refresh-line"
          @click="refreshAll"
          :loading="loading"
        >
          Обновить
        </v-btn>
      </div>
    </div>

    <v-row>
      <v-expand-transition>
        <v-col
          v-if="showForecast"
          cols="12"
          :md="showExpenses ? 6 : 12"
          class="order-first"
        >
          <v-card
            elevation="0"
            class="widget-card"
          >
            <div class="widget-header d-flex align-center pa-3">
              <v-icon
                color="warning"
                class="mr-2"
              >
                ri-timer-line
              </v-icon>

              <span class="text-subtitle-1 font-weight-medium">
                Прогноз остатка
              </span>

              <v-spacer></v-spacer>

              <v-btn
                icon="ri-file-excel-line"
                color="success"
                variant="text"
                size="small"
                :loading="exporting"
                @click="exportToExcel"
              ></v-btn>

              <v-btn
                icon="ri-close-line"
                variant="text"
                size="small"
                @click="showForecast = false"
              ></v-btn>
            </div>

            <v-divider></v-divider>

            <div class="pa-4 table-responsive">
              <v-table
                density="compact"
                v-if="forecastData.length > 0"
                class="forecast-table"
              >
                <thead>
                  <tr>
                    <th>Поставщик</th>
                    <th class="text-right">Баланс</th>
                    <th class="text-center">Осталось</th>
                    <th class="text-right">
                      Средний<br>
                      Расход (3 дн.)
                    </th>
                    <th class="text-right">
                      Средний<br>
                      Расход (7 дн.)
                    </th>
                    <th class="text-right">
                      Пополнение
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="item in forecastData"
                    :key="item.key"
                  >
                    <td class="font-weight-bold">
                      {{ item.name }}

                      <template v-if="item.receivedAt">
                        <br>
                        <small class="text-grey">
                          {{ formatTime(item.receivedAt) }}
                        </small>
                      </template>
                    </td>

                    <td class="text-right font-weight-bold">
                      <span
                        v-if="typeof item.balance === 'string'"
                        class="text-error"
                      >
                        {{ item.balance }}
                      </span>
                      <span
                        v-else
                        :class="
                          item.balance >= 0
                            ? 'text-success'
                            : 'text-error'
                        "
                      >
                        {{ formatMoney(item.balance) }}
                      </span>
                    </td>

                    <td class="text-center">
                      <v-chip
                        color="grey-darken-1"
                        size="small"
                        variant="flat"
                        class="text-white font-weight-bold"
                      >
                        ~{{ item.daysLeftWithReplenishment }} дн.
                      </v-chip>
                    </td>

                    <td class="text-right text-error font-weight-bold">
                      {{ formatMoney(item.expense3) }}
                    </td>

                    <td class="text-right text-error font-weight-bold">
                      {{ formatMoney(item.expense7) }}
                    </td>

                    <td class="text-right">
                      <template
                        v-if="editingReplenishment === item.key"
                      >
                        <v-text-field
                          v-model="replenishments[item.key]"
                          type="number"
                          density="compact"
                          variant="outlined"
                          hide-details
                          autofocus
                          style="max-width: 120px; width: 100%;"
                          @blur="saveReplenishment(item.key)"
                          @keyup.enter="saveReplenishment(item.key)"
                        ></v-text-field>
                      </template>

                      <template v-else>
                        <span
                          class="replenishment-value"
                          @click="startEditReplenishment(item.key)"
                        >
                          {{ formatMoney(replenishments[item.key] || 0) }}

                          <v-icon
                            size="14"
                            class="ml-1 edit-icon"
                          >
                            ri-pencil-line
                          </v-icon>
                        </span>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <div
                v-else
                class="text-center py-4 text-grey"
              >
                Загрузка...
              </div>
            </div>
          </v-card>
        </v-col>
      </v-expand-transition>

      <v-expand-transition>
        <v-col
          v-if="showExpenses"
          cols="12"
          :md="showForecast ? 6 : 12"
        >
          <v-card
            elevation="0"
            class="widget-card"
          >
            <div class="widget-header d-flex align-center pa-3">
              <v-icon
                color="primary"
                class="mr-2"
              >
                ri-bar-chart-line
              </v-icon>

              <span class="text-subtitle-1 font-weight-medium">
                Расходы по поставщикам
              </span>

              <v-spacer></v-spacer>

              <v-select
                v-model="expensePeriod"
                :items="periodOptions"
                label="Период"
                density="compact"
                variant="outlined"
                hide-details
                style="width: 12rem; margin-right: 0.5rem;"
              ></v-select>

              <template v-if="expensePeriod === 'custom'">
                <v-menu
                  v-model="dateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      color="primary"
                      variant="outlined"
                      density="compact"
                      size="small"
                      style="margin-right: 0.5rem;"
                    >
                      {{ dateRangeText || 'Выбрать даты' }}
                    </v-btn>
                  </template>
                  <v-card>
                    <v-card-text class="pa-4">
                      <v-date-picker
                        v-model="dateRange"
                        range
                        hide-header
                        color="primary"
                      ></v-date-picker>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                        color="primary"
                        variant="text"
                        @click="dateMenu = false"
                      >
                        Применить
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </template>

              <v-btn
                icon="ri-close-line"
                variant="text"
                size="small"
                @click="showExpenses = false"
              ></v-btn>
            </div>

            <v-divider></v-divider>

            <div class="pa-4">
              <div
                ref="expensesChart"
                class="expenses-chart"
              ></div>
            </div>
          </v-card>
        </v-col>
      </v-expand-transition>
    </v-row>

    <v-row
      v-if="!showExpenses || !showForecast"
      class="mt-2"
    >
      <v-col cols="12">
        <div class="d-flex ga-2">
          <v-chip
            v-if="!showForecast"
            color="warning"
            variant="tonal"
            @click="
              showForecast = true;
              loadForecast();
            "
          >
            <v-icon
              size="16"
              class="mr-1"
            >
              ri-timer-line
            </v-icon>

            Прогноз
          </v-chip>

          <v-chip
            v-if="!showExpenses"
            color="primary"
            variant="tonal"
            @click="
              showExpenses = true;
              initExpensesChart();
            "
          >
            <v-icon
              size="16"
              class="mr-1"
            >
              ri-bar-chart-line
            </v-icon>

            Расходы
          </v-chip>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from 'vue';

import Highcharts from 'highcharts';
import ExcelJS from 'exceljs';

const props = defineProps<{
  theme?: string;
  primaryColor?: string;
}>();

const isDark = computed(
  () => props.theme === 'dark'
);

const chartColor = computed(
  () =>
    isDark.value
      ? '#FF5252'
      : '#F44336'
);

const chartBgColor = computed(
  () =>
    isDark.value
      ? '#1E1E2D'
      : 'transparent'
);

const chartTextColor = computed(
  () =>
    isDark.value
      ? '#FFFFFF'
      : '#333333'
);

const loading = ref(false);
const exporting = ref(false);

/* =========================================================
   РЕЕСТР ЮР. ЛИЦ
   ---------------------------------------------------------
   Чтобы добавить новое юрлицо:
     1. Добавить запись сюда.
     2. У каждого поставщика (см. suppliers) добавить label
        для этого client.id.
   Всё остальное подтянется автоматически.
   ========================================================= */

interface ClientDef {
  id: string;
  name: string;
  suffix: string;
  isPrimary?: boolean;
}

const CLIENTS: ClientDef[] = [
  {
    id: 'montblanc',
    name: 'Монблан',
    suffix: '',
    isPrimary: true,
  },
  {
    id: 'faeton',
    name: 'Фаэтон',
    suffix: ' ( Фаэтон )',
  },
  {
    id: 'as',
    name: 'АС',
    suffix: ' ( АС )',
  },
];

const CLIENT_BY_ID = new Map(CLIENTS.map(c => [c.id, c]));

/* =========================================================
   ПОСТАВЩИКИ
   ---------------------------------------------------------
   labels: { clientId: 'Отображаемое имя' }
     - Если для client.id нет ключа в labels —
       пара (supplier, client) НЕ существует и не выводится.
     - Именно так реализовано «у АС нет Татнефти»:
       у поставщика ТН нет ключа as.

   tnKeys (опционально): { clientId: 'ключ в tatneft-balance' }
     - Только для поставщиков с отдельным источником.
   ========================================================= */

interface SupplierDef {
  key: string;
  label: string;
  labels: Record<string, string>;
  tnKeys?: Record<string, string>;
}

const suppliers: SupplierDef[] = [
  {
    key: 'Мультикарта',
    label: 'ППР',
    labels: {
      montblanc: 'ППР Монблан',
      faeton: 'ППР Фаэтон',
      as: 'ППР АС',
    },
  },
  {
    key: 'Лукойл',
    label: 'Лукойл',
    labels: {
      montblanc: 'Лукойл Монблан',
      faeton: 'Лукойл Фаэтон',
      as: 'Лукойл АС',
    },
  },
  {
    key: 'РН',
    label: 'Роснефть',
    labels: {
      montblanc: 'Роснефть Монблан',
      faeton: 'Роснефть Фаэтон',
      as: 'Роснефть АС',
    },
  },
  {
    key: 'ТН',
    label: 'Татнефть',
    labels: {
      montblanc: 'Татнефть Монблан',
      faeton: 'Татнефть Фаэтон',
      // as: 'Татнефть АС',   ← нет, потому что у АС нет карт Татнефти
    },
    tnKeys: {
      montblanc: 'montblanc',
      faeton: 'faeton',
      // as: 'as',            ← нет, потому что у АС нет карт Татнефти
    },
  },
  {
    key: '1',
    label: 'Natcar',
    labels: {
      montblanc: 'Natcar Монблан',
      faeton: 'Natcar Фаэтон',
      as: 'Natcar АС',
    },
  },
];

/* =========================================================
   ХЕЛПЕРЫ ДЛЯ ПАР (supplier × client)
   ========================================================= */

const getClientName = (id: string) =>
  CLIENT_BY_ID.get(id)?.name ?? id;

/**
 * Возвращает отображаемое имя пары, либо null,
 * если пара не существует (нет ключа в labels).
 */
const getSupplierLabel = (
  supplier: SupplierDef,
  clientId: string
): string | null =>
  supplier.labels[clientId] ?? null;

/**
 * Возвращает ключ для balances.php / expenses.php,
 * например: "1", "1 ( Фаэтон )", "1 ( АС )".
 */
const buildApiKey = (supplier: SupplierDef, clientId: string) => {
  const client = CLIENT_BY_ID.get(clientId);
  return supplier.key + (client?.suffix ?? '');
};

/* =========================================================
   WIDGETS
   ========================================================= */

const savedWidgets = localStorage.getItem('widgets_visible');

let ie = true;
let iF = true;

if (savedWidgets) {
  try {
    const s = JSON.parse(savedWidgets);
    ie = s.expenses ?? true;
    iF = s.forecast ?? true;
  } catch {}
}

const showExpenses = ref(ie);
const showForecast = ref(iF);

watch([showExpenses, showForecast], () => {
  localStorage.setItem(
    'widgets_visible',
    JSON.stringify({
      expenses: showExpenses.value,
      forecast: showForecast.value,
    })
  );
});

/* =========================================================
   ПЕРИОД РАСХОДОВ
   ========================================================= */

const periodOptions = [
  { title: 'Сегодня', value: 'today' },
  { title: '3 дня', value: '3days' },
  { title: '7 дней', value: '7days' },
  { title: 'Выбор периода', value: 'custom' },
];

const expensePeriod = ref('7days');
const dateMenu = ref(false);
const dateRange = ref<[string, string] | null>(null);

const dateRangeText = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) return '';
  const [start, end] = dateRange.value;
  return `${formatDateForDisplay(start)} - ${formatDateForDisplay(end)}`;
});

const formatDateForDisplay = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
};

/* =========================================================
   CHART
   ========================================================= */

const expensesChart = ref<HTMLElement | null>(null);
let expensesInstance: any = null;

/* =========================================================
   FORECAST
   ========================================================= */

const forecastData = ref<any[]>([]);

const dailyExpenseTable = ref<{
  dates: string[];
  series: {
    name: string;
    dailyTotals: number[];
  }[];
}>({
  dates: [],
  series: [],
});

/* Пополнения — это ВРЕМЕННЫЙ ввод пользователя, никуда не сохраняется.
   Ключ — pairKey вида "1::montblanc", чтобы не зависеть от отображаемого имени. */
const replenishments = ref<Record<string, number>>({});
const editingReplenishment = ref<string | null>(null);

/* =========================================================
   SELECTED CLIENTS
   ========================================================= */

const clients = CLIENTS.map(c => c.id);

const selectedClients = ref<string[]>([...clients]);

const allClientsSelected = computed(
  () => selectedClients.value.length === clients.length
);

const toggleAllClients = () => {
  selectedClients.value = allClientsSelected.value
    ? []
    : [...clients];
};

/* =========================================================
   МОСКОВСКАЯ ДАТА
   ========================================================= */

const getMoscowCalendarDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find(p => p.type === type)?.value || '';

  return {
    year: Number(getPart('year')),
    month: Number(getPart('month')),
    day: Number(getPart('day')),
  };
};

const createCalendarDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day));

const formatDate = (d: Date) =>
  [
    String(d.getUTCDate()).padStart(2, '0'),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    d.getUTCFullYear(),
  ].join('-');

const formatDateISO = (d: Date) =>
  [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-');

const getExpensesDateRange = () => {
  const moscow = getMoscowCalendarDate();
  const today = createCalendarDate(moscow.year, moscow.month, moscow.day);

  let dateStart: Date;
  let dateEnd: Date;

  switch (expensePeriod.value) {
    case 'today':
      dateStart = new Date(today);
      dateEnd = new Date(today);
      break;

    case '3days':
      dateEnd = new Date(today);
      dateEnd.setUTCDate(dateEnd.getUTCDate() - 1);
      dateStart = new Date(dateEnd);
      dateStart.setUTCDate(dateStart.getUTCDate() - 2);
      break;

    case '7days':
      dateEnd = new Date(today);
      dateEnd.setUTCDate(dateEnd.getUTCDate() - 1);
      dateStart = new Date(dateEnd);
      dateStart.setUTCDate(dateStart.getUTCDate() - 6);
      break;

    case 'custom':
      if (dateRange.value && dateRange.value.length === 2) {
        const [startStr, endStr] = dateRange.value;
        const [sy, sm, sd] = startStr.split('-').map(Number);
        const [ey, em, ed] = endStr.split('-').map(Number);
        dateStart = createCalendarDate(sy, sm, sd);
        dateEnd = createCalendarDate(ey, em, ed);
      } else {
        dateEnd = new Date(today);
        dateEnd.setUTCDate(dateEnd.getUTCDate() - 1);
        dateStart = new Date(dateEnd);
        dateStart.setUTCDate(dateStart.getUTCDate() - 6);
      }
      break;

    default:
      dateEnd = new Date(today);
      dateEnd.setUTCDate(dateEnd.getUTCDate() - 1);
      dateStart = new Date(dateEnd);
      dateStart.setUTCDate(dateStart.getUTCDate() - 6);
  }

  return {
    dateStart,
    dateEnd,
    dateStartString: formatDate(dateStart),
    dateEndString: formatDate(dateEnd),
  };
};

const getExpensesDateList = () => {
  const { dateStart, dateEnd } = getExpensesDateRange();
  const result: string[] = [];
  const current = new Date(dateStart);

  while (current <= dateEnd) {
    result.push(formatDateISO(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
};

const getForecastDateRange = () => {
  const moscow = getMoscowCalendarDate();
  const yesterday = createCalendarDate(moscow.year, moscow.month, moscow.day);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const dateStart = new Date(yesterday);
  dateStart.setUTCDate(dateStart.getUTCDate() - 6);

  const dateEnd = new Date(yesterday);

  return {
    dateStart,
    dateEnd,
    dateStartString: formatDate(dateStart),
    dateEndString: formatDate(dateEnd),
  };
};

const getForecastDateList = () => {
  const { dateStart, dateEnd } = getForecastDateRange();
  const result: string[] = [];
  const current = new Date(dateStart);

  while (current <= dateEnd) {
    result.push(formatDateISO(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
};

/* =========================================================
   ФОРМАТИРОВАНИЕ
   ========================================================= */

const formatMoney = (a: number | string) => {
  if (typeof a === 'string') return a;

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  }).format(a);
};

const formatTime = (iso: string) =>
  '↻ ' +
  new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

/* =========================================================
   EXCEL HELPERS
   ========================================================= */

const colLetter = (n: number) => {
  let s = '';
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
};

const RUB_FMT =
  '_-* #,##0.00\\ "₽"_-;\\-* #,##0.00\\ "₽"_-;_-* "-"??\\ "₽"_-;_-@_-';

const BALANCE_FMT = '#,##0\\ "₽";[Red]\\-#,##0\\ "₽"';

const applyFill = (
  cell: ExcelJS.Cell,
  argb: string,
  bold = false,
  color = 'FF000000'
) => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb },
  };
  cell.font = {
    name: 'Calibri',
    size: 11,
    bold,
    color: { argb: color },
  };
};

const applyBorder = (cell: ExcelJS.Cell) => {
  const thin = {
    style: 'thin' as const,
    color: { argb: 'FFB0B0B0' },
  };
  cell.border = {
    top: thin,
    left: thin,
    bottom: thin,
    right: thin,
  };
};

/* =========================================================
   ПОСТРОЕНИЕ QUERIES ДЛЯ РАСХОДОВ
   ---------------------------------------------------------
   Единая функция для графика и прогноза.
   Пропускает пары, для которых нет label (нет данных).
   ========================================================= */

interface ExpenseQuery {
  pairKey: string;
  name: string;
  query: string;
}

const buildExpenseQueries = (): ExpenseQuery[] => {
  const queries: ExpenseQuery[] = [];

  for (const clientId of selectedClients.value) {
    for (const supplier of suppliers) {
      const label = getSupplierLabel(supplier, clientId);
      if (!label) continue;

      queries.push({
        pairKey: `${supplier.key}::${clientId}`,
        name: label,
        query: buildApiKey(supplier, clientId),
      });
    }
  }

  return queries;
};

/* =========================================================
   ЗАГРУЗКА РАСХОДОВ (общая для графика и прогноза)
   ========================================================= */

const fetchExpensesForRange = async (
  range: {
    dateStart: Date;
    dateEnd: Date;
    dateStartString: string;
    dateEndString: string;
  },
  allDates: string[],
  scope: string
) => {
  const queries = buildExpenseQueries();

  console.log(
    `Диапазон расходов (${scope}):`,
    range.dateStartString,
    '→',
    range.dateEndString
  );

  const series = await Promise.all(
    queries.map(async q => {
      const params = new URLSearchParams();
      params.set('supplier', q.query);
      params.set('dateStart', range.dateStartString);
      params.set('dateEnd', range.dateEndString);
      params.set('field', 'sumPos');

      const requestUrl = `/api/proxy/expenses.php?${params.toString()}`;

      console.log(`Запрос расходов (${scope}):`, requestUrl);

      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`Ошибка API расходов: ${response.status}`);
      }

      const data = await response.json();
      const dateMap: Record<string, number> = {};

      if (data.chartData && Array.isArray(data.chartData)) {
        data.chartData.forEach((item: [string, number]) => {
          const [date, amount] = item;
          dateMap[date] = Number(amount) || 0;
        });
      }

      return {
        pairKey: q.pairKey,
        name: q.name,
        dailyTotals: allDates.map(date => dateMap[date] || 0),
      };
    })
  );

  return {
    dates: allDates,
    series,
    ...range,
  };
};

const fetchExpensesForChart = () => {
  const range = getExpensesDateRange();
  const allDates = getExpensesDateList();
  return fetchExpensesForRange(range, allDates, 'график');
};

const fetchExpensesForForecast = () => {
  const range = getForecastDateRange();
  const allDates = getForecastDateList();
  return fetchExpensesForRange(range, allDates, 'прогноз');
};

/* =========================================================
   ГРАФИК РАСХОДОВ
   ========================================================= */

const initExpensesChart = () => {
  nextTick(() => {
    if (!expensesChart.value) return;

    if (expensesInstance) {
      expensesInstance.destroy();
    }

    expensesInstance = Highcharts.chart(expensesChart.value, {
      chart: {
        type: 'bar',
        backgroundColor: chartBgColor.value,
        style: { fontFamily: 'Roboto, sans-serif' },
      },
      accessibility: { enabled: false },
      title: { text: '' },
      xAxis: {
        type: 'category',
        labels: {
          style: {
            fontSize: '1.2rem',
            color: chartTextColor.value,
          },
        },
      },
      yAxis: {
        title: {
          text: 'Расход (₽)',
          style: { color: chartTextColor.value },
        },
        min: 0,
        tickAmount: 6,
        gridLineColor: isDark.value ? '#333' : '#E0E0E0',
        labels: {
          style: { color: chartTextColor.value },
          formatter: function (this: any) {
            return new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              minimumFractionDigits: 0,
            }).format(this.value);
          },
        },
      },
      tooltip: {
        pointFormat: 'Расход: <b>{point.y:,.2f} ₽</b>',
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          pointPadding: 0.1,
          groupPadding: 0.1,
        },
      },
      legend: { enabled: false },
      credits: { enabled: false },
      series: [
        {
          name: 'Расход',
          data: [],
          color: chartColor.value,
        },
      ],
    });

    loadExpensesForChart();
  });
};

const loadExpensesForChart = async () => {
  if (!expensesInstance) return;

  try {
    const table = await fetchExpensesForChart();

    const totalValues = table.series.map(series => ({
      name: series.name,
      totalValue: series.dailyTotals.reduce((a, b) => a + b, 0),
    }));

    expensesInstance.series[0].remove(false);

    expensesInstance.addSeries(
      {
        name: 'Расход',
        data: totalValues.map(item => [item.name, item.totalValue]),
        color: chartColor.value,
        animation: { duration: 1000, easing: 'easeOutBounce' },
      },
      false
    );

    expensesInstance.redraw(true);
  } catch (error) {
    console.error('Ошибка загрузки расходов:', error);
  }
};

/* =========================================================
   ПРОГНОЗ
   ========================================================= */

const loadForecast = async () => {
  try {
    const [respBalances, tnResp] = await Promise.all([
      fetch('/api/proxy/balances.php'),
      fetch('/api/proxy/tatneft-balance.php'),
    ]);

    const balancesResponse = await respBalances.json();
    const balancesData = balancesResponse.balances ?? balancesResponse;
    const apiReceivedAt = balancesResponse.updated_at ?? null;
    const tnCache = await tnResp.json();

    const { dates, series: daily7 } = await fetchExpensesForForecast();

    dailyExpenseTable.value = { dates, series: daily7 };

    const result: any[] = [];

    for (const supplier of suppliers) {
      for (const clientId of selectedClients.value) {
        // Если у пары нет label — она не существует (например, ТН + АС).
        const displayName = getSupplierLabel(supplier, clientId);
        if (!displayName) continue;

        const pairKey = `${supplier.key}::${clientId}`;

        let balance: number | string;
        let receivedAt: string | null = null;

        /* ТАТНЕФТЬ — отдельный источник */
        if (supplier.tnKeys) {
          const tnKey = supplier.tnKeys[clientId];

          if (!tnKey) {
            // Нет ключа в tatneft-balance — пара не должна была сюда попасть,
            // но на всякий случай пропускаем.
            continue;
          }

          const tnBalance = tnCache[tnKey]?.current?.balance;
          balance =
            tnBalance !== undefined && tnBalance !== null
              ? tnBalance
              : 'Ошибка';
          receivedAt = tnCache[tnKey]?.current?.received_at ?? null;
        }
        /* ОСТАЛЬНЫЕ — общий источник balances.php */
        else {
          const apiKey = buildApiKey(supplier, clientId);
          const balanceItem = balancesData.find(
            (b: any) => b.agregator === apiKey
          );

          if (
            balanceItem &&
            balanceItem.balance !== undefined &&
            balanceItem.balance !== null
          ) {
            const parsedBalance = parseFloat(balanceItem.balance);
            balance = !isNaN(parsedBalance) ? parsedBalance : 'Ошибка';
          } else {
            balance = 'Ошибка';
          }

          receivedAt = apiReceivedAt;
        }

        /* РАСХОД */
        const expData = daily7.find(e => e.pairKey === pairKey);
        const dailyTotals = expData ? expData.dailyTotals : [];

        const last3 = dailyTotals.slice(-3);
        const sum3 = last3.reduce((a, b) => a + b, 0);
        const avg3 = last3.length > 0 ? sum3 / last3.length : 0;

        const sum7 = dailyTotals.reduce((a, b) => a + b, 0);
        const avg7 = dailyTotals.length > 0 ? sum7 / dailyTotals.length : 0;

        const daysLeft =
          typeof balance === 'string'
            ? 0
            : avg7 > 0
              ? Math.floor(balance / avg7)
              : balance > 0
                ? 99
                : 0;

        const extra =
          parseFloat(replenishments.value[pairKey] as any) || 0;

        const daysLeftWithReplenishment =
          typeof balance === 'string'
            ? 0
            : avg7 > 0
              ? Math.floor((balance + extra) / avg7)
              : balance + extra > 0
                ? 99
                : 0;

        result.push({
          key: pairKey,
          name: displayName,
          balance,
          expense3: avg3,
          expense7: avg7,
          daysLeft,
          daysLeftWithReplenishment,
          receivedAt,
        });
      }
    }

    forecastData.value = result;
  } catch (e) {
    console.error('Ошибка загрузки прогноза:', e);
  }
};

/* =========================================================
   РЕДАКТИРОВАНИЕ ПОПОЛНЕНИЯ (временный UI-ввод)
   ========================================================= */

const startEditReplenishment = (key: string) => {
  editingReplenishment.value = key;

  if (!replenishments.value[key]) {
    replenishments.value[key] = 0;
  }

  replenishments.value[key] =
    parseFloat(replenishments.value[key] as any) || 0;
};

const saveReplenishment = (key: string) => {
  editingReplenishment.value = null;

  const extra = parseFloat(replenishments.value[key] as any) || 0;
  replenishments.value[key] = extra;

  forecastData.value = forecastData.value.map(item => {
    if (item.key === key) {
      const totalBalance =
        typeof item.balance === 'string' ? 0 : item.balance + extra;

      const daysLeft =
        item.expense7 > 0
          ? Math.floor(totalBalance / item.expense7)
          : totalBalance > 0
            ? 99
            : 0;

      return {
        ...item,
        daysLeftWithReplenishment: daysLeft,
      };
    }

    return item;
  });
};

/* =========================================================
   EXCEL
   ========================================================= */

const exportToExcel = async () => {
  if (!forecastData.value.length) return;

  exporting.value = true;

  try {
    const table = await fetchExpensesForForecast();
    dailyExpenseTable.value = table;

    console.log('Excel диапазон:', table.dateStartString, '→', table.dateEndString);
    console.log('Excel даты:', table.dates);

    const moscow = getMoscowCalendarDate();
    const today = createCalendarDate(moscow.year, moscow.month, moscow.day);
    const todayDay = today.getUTCDay();

    let daysUntilMonday = (1 - todayDay + 7) % 7;
    if (daysUntilMonday === 0) daysUntilMonday = 7;

    const nextMonday = new Date(today);
    nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);

    const dayMultiplier = (() => {
      switch (todayDay) {
        case 1: return 8;
        case 2: return 7;
        case 3: return 6;
        case 4: return 5;
        case 5: return 4;
        case 6: return 3;
        case 0: return 2;
        default: return 7;
      }
    })();

    const formatPlanDate = (date: Date) =>
      date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'UTC',
      });

    const planMondayStr = formatPlanDate(nextMonday);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'KPI';

    const ws = wb.addWorksheet('Лист1', {
      views: [{ showGridLines: true }],
    });

    // Сортировка: сначала «главное» юрлицо (Монблан), затем остальные.
    // Признак isPrimary берём из реестра, а не из строки имени.
    const exportItems = forecastData.value
      .map(item => ({
        ...item,
        planReplenishment:
          parseFloat(replenishments.value[item.key] as any) || 0,
      }))
      .sort((a, b) => {
        const aClientId = a.key.split('::')[1];
        const bClientId = b.key.split('::')[1];

        const aClient = CLIENT_BY_ID.get(aClientId);
        const bClient = CLIENT_BY_ID.get(bClientId);

        const aPrimary = aClient?.isPrimary ? 0 : 1;
        const bPrimary = bClient?.isPrimary ? 0 : 1;

        if (aPrimary !== bPrimary) return aPrimary - bPrimary;

        const clientCmp = (aClient?.name ?? '').localeCompare(
          bClient?.name ?? '',
          'ru'
        );
        if (clientCmp !== 0) return clientCmp;

        return a.name.localeCompare(b.name, 'ru');
      });

    const planHeaderRow = 1;
    const planStartRow = 2;
    const planEndRow = planStartRow + exportItems.length - 1;

    ws.getRow(planHeaderRow).values = [
      'Винк',
      'Баланс',
      'План Поступлений',
      'Средняя сумма трат в сут. за предыдущие 3 дня',
      'Средняя сумма трат в сут. за предыдущие 7 дней',
      'Средняя сумма трат в сут. за предыдущие 7 дней +20%',
      `Планируемый остаток на ${planMondayStr} + 1 день`,
    ];

    ws.getRow(planHeaderRow).height = 48;
    ws.getRow(planHeaderRow).alignment = {
      wrapText: true,
      vertical: 'middle',
      horizontal: 'center',
    };

    for (let c = 1; c <= 7; c++) {
      const cell = ws.getRow(planHeaderRow).getCell(c);
      applyFill(cell, 'FFD6DCE4', true);
      applyBorder(cell);
    }

    const seriesByPairKey = new Map(
      table.series.map(s => [s.pairKey, s])
    );

    const dailyHeaderRow = planEndRow + 2;
    const dailyStartRow = dailyHeaderRow + 1;
    const dailyEndRow = dailyStartRow + Math.max(table.dates.length, 1) - 1;
    const avg3Row = dailyEndRow + 1;
    const avg7Row = dailyEndRow + 2;
    const sumRow = dailyEndRow + 3;

    exportItems.forEach((item, index) => {
      const rowNumber = planStartRow + index;
      const row = ws.getRow(rowNumber);

      row.getCell(1).value = item.name;
      row.getCell(2).value =
        typeof item.balance === 'string'
          ? item.balance
          : Number(item.balance) || 0;
      row.getCell(2).numFmt =
        typeof item.balance === 'string' ? '@' : BALANCE_FMT;
      row.getCell(3).value = item.planReplenishment;
      row.getCell(3).numFmt = RUB_FMT;

      const dailyColumn = colLetter(index + 2);
      const avg3StartRow = Math.max(dailyEndRow - 2, dailyStartRow);
      const avg3Formula = `AVERAGE(${dailyColumn}${avg3StartRow}:${dailyColumn}${dailyEndRow})`;
      const avg7Formula = `AVERAGE(${dailyColumn}${dailyStartRow}:${dailyColumn}${dailyEndRow})`;

      const series = seriesByPairKey.get(item.key);
      const dailyTotals = series?.dailyTotals || [];

      const last3 = dailyTotals.slice(-3);
      const avg3Value =
        last3.length > 0
          ? last3.reduce((a, b) => a + b, 0) / last3.length
          : 0;

      const avg7Value =
        dailyTotals.length > 0
          ? dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length
          : 0;

      const avg7Plus20Value = avg7Value * 1.2;

      const forecastValue =
        typeof item.balance === 'string'
          ? 0
          : item.balance +
            item.planReplenishment -
            avg7Plus20Value * dayMultiplier;

      row.getCell(4).value = { formula: avg3Formula, result: avg3Value };
      row.getCell(4).numFmt = RUB_FMT;

      row.getCell(5).value = { formula: avg7Formula, result: avg7Value };
      row.getCell(5).numFmt = RUB_FMT;

      row.getCell(6).value = {
        formula: `E${rowNumber}*1.2`,
        result: avg7Plus20Value,
      };
      row.getCell(6).numFmt = RUB_FMT;

      row.getCell(7).value = {
        formula: `B${rowNumber}+C${rowNumber}-(F${rowNumber}*${dayMultiplier})`,
        result: forecastValue,
      };
      row.getCell(7).numFmt = RUB_FMT;

      for (let c = 1; c <= 7; c++) {
        const cell = row.getCell(c);
        applyBorder(cell);
        cell.alignment = { vertical: 'middle' };
      }
    });

    const dailyHeader = ws.getRow(dailyHeaderRow);
    dailyHeader.getCell(1).value = 'Дата';

    exportItems.forEach((item, index) => {
      dailyHeader.getCell(index + 2).value = item.name;
    });

    dailyHeader.font = { bold: true };

    for (let c = 1; c <= exportItems.length + 1; c++) {
      const cell = dailyHeader.getCell(c);
      applyFill(cell, 'FF5B9BD5', true, 'FFFFFFFF');
      applyBorder(cell);
      cell.alignment = {
        wrapText: true,
        vertical: 'middle',
        horizontal: 'center',
      };
    }

    table.dates.forEach((iso, dateIndex) => {
      const rowNumber = dailyStartRow + dateIndex;
      const row = ws.getRow(rowNumber);

      const [year, month, day] = iso.split('-').map(Number);
      const excelDate = createCalendarDate(year, month, day);

      row.getCell(1).value = excelDate;
      row.getCell(1).numFmt = 'DD.MM.YYYY';

      exportItems.forEach((item, itemIndex) => {
        const cell = row.getCell(itemIndex + 2);
        const series = seriesByPairKey.get(item.key);
        const amount = series?.dailyTotals?.[dateIndex] ?? 0;

        cell.value = Number(amount) || 0;
        cell.numFmt = RUB_FMT;
      });

      for (let c = 1; c <= exportItems.length + 1; c++) {
        applyBorder(row.getCell(c));
      }
    });

    const footerSpecs = [
      {
        row: avg3Row,
        label: 'Среднее за 3 дня',
        fill: 'FFF4B183',
        formula: (column: string) =>
          `AVERAGE(${column}${Math.max(dailyEndRow - 2, dailyStartRow)}:${column}${dailyEndRow})`,
      },
      {
        row: avg7Row,
        label: 'Среднее за 7 дней',
        fill: 'FF9DC3E6',
        formula: (column: string) =>
          `AVERAGE(${column}${dailyStartRow}:${column}${dailyEndRow})`,
      },
      {
        row: sumRow,
        label: 'Общий итог',
        fill: 'FF9DC3E6',
        formula: (column: string) =>
          `SUM(${column}${dailyStartRow}:${column}${dailyEndRow})`,
      },
    ];

    for (const spec of footerSpecs) {
      const row = ws.getRow(spec.row);
      row.getCell(1).value = spec.label;

      exportItems.forEach((item, index) => {
        const column = colLetter(index + 2);
        const cell = row.getCell(index + 2);
        const series = seriesByPairKey.get(item.key);
        const dailyTotals = series?.dailyTotals || [];

        let resultValue = 0;

        if (spec.label === 'Среднее за 3 дня') {
          const last3 = dailyTotals.slice(-3);
          resultValue =
            last3.length > 0
              ? last3.reduce((a, b) => a + b, 0) / last3.length
              : 0;
        } else if (spec.label === 'Среднее за 7 дней') {
          resultValue =
            dailyTotals.length > 0
              ? dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length
              : 0;
        } else if (spec.label === 'Общий итог') {
          resultValue = dailyTotals.reduce((a, b) => a + b, 0);
        }

        cell.value = { formula: spec.formula(column), result: resultValue };
        cell.numFmt = RUB_FMT;
      });

      for (let c = 1; c <= exportItems.length + 1; c++) {
        const cell = row.getCell(c);
        applyFill(cell, spec.fill, true);
        applyBorder(cell);
        cell.alignment = { vertical: 'middle' };
      }
    }

    const totalColumns = exportItems.length + 1;

    ws.columns = Array.from({ length: totalColumns }, (_, index) => ({
      width: index === 0 ? 24 : 24,
    }));

    ws.views = [
      {
        showGridLines: true,
        state: 'frozen',
        ySplit: 1,
      },
    ];

    const buffer = await wb.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dd = String(moscow.day).padStart(2, '0');
    const mm = String(moscow.month).padStart(2, '0');
    const filename = `План_от_${dd}_${mm}_+_Средние_значения_за_7_завершённых_дней.xlsx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Ошибка формирования Excel:', error);
  } finally {
    exporting.value = false;
  }
};

/* =========================================================
   REFRESH
   ========================================================= */

const refreshAll = async () => {
  loading.value = true;

  try {
    if (showExpenses.value) {
      await loadExpensesForChart();
    }
    if (showForecast.value) {
      await loadForecast();
    }
  } finally {
    loading.value = false;
  }
};

/* =========================================================
   WATCHERS
   ========================================================= */

watch(selectedClients, () => {
  refreshAll();
}, { deep: true });

watch(expensePeriod, () => {
  if (showExpenses.value) {
    loadExpensesForChart();
  }
});

watch(dateRange, () => {
  if (expensePeriod.value === 'custom' && dateRange.value && showExpenses.value) {
    loadExpensesForChart();
  }
}, { deep: true });

watch(() => props.theme, () => {
  if (expensesInstance) {
    initExpensesChart();
  }
});

/* =========================================================
   INTERVAL
   ========================================================= */

let refreshInterval: ReturnType<typeof setInterval> | null = null;

/* =========================================================
   MOUNT / UNMOUNT
   ========================================================= */

onMounted(() => {
  if (showExpenses.value) {
    initExpensesChart();
  }

  if (showForecast.value) {
    loadForecast();

    refreshInterval = setInterval(() => {
      refreshAll();
    }, 25 * 60 * 1000);
  }
});

onBeforeUnmount(() => {
  if (expensesInstance) {
    expensesInstance.destroy();
  }

  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.page-content {
  padding: 2.4rem;
  background-color: #F5F5F5;
  min-height: 100vh;
}

.header-filters {
  background: #fff;
  border-radius: 1.2rem;
  padding: 1.2rem 1.6rem;
  border: 1px solid rgba(0,0,0,0.05);
}

.widget-card {
  border-radius: 1.6rem !important;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.05) !important;
  height: 100%;
}

.widget-header {
  background-color: #FAFAFA;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.expenses-chart {
  width: 100%;
  height: clamp(30rem, 50vh, 50rem);
}

.replenishment-value {
  cursor: pointer;
  white-space: nowrap;
}

.replenishment-value:hover {
  color: #1976d2;
}

.replenishment-value:hover .edit-icon {
  opacity: 1;
}

.edit-icon {
  opacity: 0.4;
  transition: opacity 0.2s;
}
</style>