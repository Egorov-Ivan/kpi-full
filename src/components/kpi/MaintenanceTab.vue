<!-- src/components/kpi/MaintenanceTab.vue -->
<template>
  <div>
    <!-- Информация о выбранном менеджере -->
    <div class="manager-info mb-4">
      <v-sheet class="pa-3 rounded bg-primary-light">
        <div class="d-flex align-center">
          <v-avatar :color="`rgb(${primaryColor})`" size="32" class="mr-2">
            <v-icon size="18" color="white">ri-user-line</v-icon>
          </v-avatar>
          <div>
            <span class="text-subtitle-2 text-grey">Выбран менеджер:</span>
            <span class="text-h6 ml-2">{{ props.manager?.displayName || 'Не выбран' }}</span>
            <v-chip size="x-small" class="ml-2" variant="tonal">
              ID: {{ props.manager?.id || '---' }}
            </v-chip>
          </div>
        </div>
      </v-sheet>
    </div>

    <!-- Выбор месяца -->
    <div class="form-group">
      <label class="text-subtitle-2 font-weight-medium mb-2">
        📅 Месяц
      </label>
      <v-text-field
        v-model="month"
        type="month"
        variant="outlined"
        density="compact"
        :min="minDate"
        :max="maxDate"
        :disabled="!props.manager"
      ></v-text-field>
      <div class="text-caption text-grey mt-1">
        Выберите месяц для расчета
      </div>
    </div>

    <!-- Выбор ставки -->
    <div class="form-group">
      <label class="text-subtitle-2 font-weight-medium mb-2">
        💰 Ставка ведения
      </label>
      <div class="rate-buttons">
        <v-btn
          v-for="rate in store.maintenanceRates"
          :key="rate.id"
          :color="selectedRate === rate.value ? 'primary' : undefined"
          :variant="selectedRate === rate.value ? 'elevated' : 'outlined'"
          @click="selectedRate = rate.value"
          class="rate-btn"
          size="large"
          :disabled="!props.manager"
        >
          {{ rate.label }}
        </v-btn>
      </div>
      <div class="text-caption text-grey mt-1">
        Выберите процент от суммы пополнений
      </div>
    </div>

    <!-- Кнопка расчета -->
    <v-btn
      color="primary"
      size="large"
      block
      class="mt-4"
      :loading="store.loading"
      :disabled="!canCalculate"
      @click="calculate"
    >
      <v-icon start>ri-calculator-line</v-icon>
      Рассчитать ведение
    </v-btn>

    <!-- Сообщение об ошибке -->
    <v-alert
      v-if="store.error"
      type="error"
      variant="tonal"
      class="mt-4"
      closable
      @click:close="store.error = null"
    >
      {{ store.error }}
    </v-alert>

    <!-- Результат расчета -->
    <v-expand-transition>
      <v-card v-if="store.maintenanceResult" variant="tonal" class="result-card mt-4">
        <v-card-item>
          <v-card-title class="text-success">
            ✅ Результат расчета
          </v-card-title>
        </v-card-item>
        
        <v-card-text>
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">ri-user-line</v-icon>
              </template>
              <v-list-item-title>Менеджер</v-list-item-title>
              <v-list-item-subtitle class="text-right">
                {{ store.maintenanceResult.manager }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">ri-calendar-line</v-icon>
              </template>
              <v-list-item-title>Месяц</v-list-item-title>
              <v-list-item-subtitle class="text-right">
                {{ formatMonth(store.maintenanceResult.month) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">ri-file-copy-line</v-icon>
              </template>
              <v-list-item-title>Операций без VAT</v-list-item-title>
              <v-list-item-subtitle class="text-right">
                {{ store.maintenanceResult.operations }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">ri-money-dollar-circle-line</v-icon>
              </template>
              <v-list-item-title>Сумма пополнений</v-list-item-title>
              <v-list-item-subtitle class="text-right font-weight-bold">
                {{ formatMoney(store.maintenanceResult.totalAmount) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">ri-percent-line</v-icon>
              </template>
              <v-list-item-title>Ставка</v-list-item-title>
              <v-list-item-subtitle class="text-right">
                {{ (store.maintenanceResult.ratePercent * 100).toFixed(1) }}%
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item class="bg-success-light">
              <template v-slot:prepend>
                <v-icon color="success" size="large">ri-checkbox-circle-line</v-icon>
              </template>
              <v-list-item-title class="text-h6">Итоговое ведение</v-list-item-title>
              <v-list-item-subtitle class="text-right text-h5 text-success font-weight-bold">
                {{ formatMoney(store.maintenanceResult.maintenance) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            color="primary"
            @click="copyResult"
          >
            <v-icon start>ri-file-copy-line</v-icon>
            Копировать
          </v-btn>
          <v-btn
            variant="text"
            color="success"
            @click="$emit('save-result', store.maintenanceResult)"
          >
            <v-icon start>ri-save-line</v-icon>
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useKpiStore } from '@/stores/kpiStore';
import type { Manager } from '@/types/kpi.types';

// Пропсы компонента
const props = defineProps<{
  manager?: Manager | null;
}>();

// События
const emit = defineEmits<{
  (e: 'save-result', result: any): void;
}>();

// Используем стор
const store = useKpiStore();

// Основной цвет из localStorage
const primaryColor = ref('230,4,16');

// Локальное состояние
const selectedManager = ref<Manager | null>(props.manager || null);
const month = ref(new Date().toISOString().slice(0, 7));
const selectedRate = ref(0.015);

// Минимальная и максимальная дата для выбора
const minDate = '2024-01';
const maxDate = new Date().toISOString().slice(0, 7);

// Можно ли производить расчет
const canCalculate = computed(() => {
  return selectedManager.value && month.value && selectedRate.value;
});

// Следим за изменениями пропса manager
watch(() => props.manager, (newManager) => {
  selectedManager.value = newManager || null;
}, { immediate: true });

// Форматирование месяца
const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

// Форматирование денег
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Копирование результата в буфер обмена
const copyResult = () => {
  if (!store.maintenanceResult) return;
  
  const text = `
Менеджер: ${store.maintenanceResult.manager}
Месяц: ${formatMonth(store.maintenanceResult.month)}
Операций: ${store.maintenanceResult.operations}
Сумма: ${formatMoney(store.maintenanceResult.totalAmount)}
Ставка: ${(store.maintenanceResult.ratePercent * 100).toFixed(1)}%
Ведение: ${formatMoney(store.maintenanceResult.maintenance)}
  `.trim();
  
  navigator.clipboard.writeText(text);
};

// Расчет
const calculate = async () => {
  if (!selectedManager.value) {
    alert('Выберите менеджера');
    return;
  }
  
  try {
    await store.calculateMaintenance(
      selectedManager.value.displayName,
      month.value,
      selectedRate.value
    );
  } catch (err: any) {
    console.error('Ошибка расчета:', err);
  }
};

// Загрузка данных при монтировании
onMounted(() => {
  // Загружаем цвет из localStorage
  const savedColor = localStorage.getItem('primary-color');
  if (savedColor) {
    primaryColor.value = savedColor;
  }
  
  // Слушаем изменения цвета
  const handleColorChange = (e: StorageEvent) => {
    if (e.key === 'primary-color') {
      primaryColor.value = e.newValue || '230,4,16';
    }
  };
  
  window.addEventListener('storage', handleColorChange);
  
  // Устанавливаем первую ставку как выбранную
  if (store.maintenanceRates.length > 0) {
    selectedRate.value = store.maintenanceRates[0].value;
  }
});

// Следим за изменением ставок
watch(() => store.maintenanceRates, (newRates) => {
  if (newRates.length > 0 && !selectedRate.value) {
    selectedRate.value = newRates[0].value;
  }
}, { immediate: true });
</script>

<style scoped>
.form-group {
  margin-bottom: 24px;
}

.rate-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.rate-btn {
  flex: 1;
  min-width: 100px;
}

.result-card {
  border-left: 4px solid var(--v-theme-success);
  transition: all 0.3s ease;
}

.bg-success-light {
  background-color: rgba(var(--v-theme-success), 0.1);
}

.bg-primary-light {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

:deep(.v-list-item) {
  min-height: 48px;
}

:deep(.v-list-item__subtitle) {
  font-size: 1rem;
}

.text-h5 {
  font-size: 1.5rem !important;
  line-height: 2rem !important;
}

.manager-info {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>