<template>
  <v-container fluid class="page-content">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-avatar color="primary" size="48" class="mr-4">
            <v-icon size="28" color="white">ri-bank-line</v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-medium mb-1">Балансы поставщиков</h1>
            <p class="text-subtitle-1 text-grey">Текущие остатки по эмитентам</p>
          </div>
        </div>

        <v-card elevation="0" class="rating-card">
          <div class="pa-4 d-flex align-center">
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="tonal" prepend-icon="ri-refresh-line" @click="loadBalances" :loading="loading">
              Обновить
            </v-btn>
          </div>

          <v-data-table
            :headers="headers"
            :items="balances"
            :loading="loading"
            class="rating-table"
            hover
            items-per-page="-1"
          >
            <template v-slot:item.balance="{ item }">
              <div class="text-right">
                <span class="font-weight-medium" :class="item.balance >= 0 ? 'text-success' : 'text-error'">
                  {{ formatMoney(item.balance) }}
                </span>
              </div>
            </template>
            <template v-slot:no-data>
              <div class="text-center pa-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">ri-inbox-line</v-icon>
                <h3 class="text-h6 text-grey">Нет данных</h3>
                <p class="text-body-2 text-grey">Нажмите «Обновить» для загрузки</p>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const loading = ref(false);
const balances = ref<any[]>([]);

const headers = [
  { title: 'Поставщик', key: 'supplier', sortable: true },
  { title: 'Баланс', key: 'balance', sortable: true, align: 'end' as const },
  { title: 'Обновлён', key: 'updatedAt', sortable: true, align: 'center' as const }
];

const loadBalances = async () => {
  loading.value = true;
  try {
    // Заглушка — замените на реальный API
    const response = await fetch('/api/proxy/supplier-balances');
    if (response.ok) {
      const data = await response.json();
      balances.value = data.balances || [];
    }
  } catch (e) {
    console.error('Ошибка загрузки балансов:', e);
  } finally {
    loading.value = false;
  }
};

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
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
</style>