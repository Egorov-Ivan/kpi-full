<template>
  <v-card class="pa-4">
    <v-card-title>Статистика буфера данных</v-card-title>
    
    <v-list>
      <v-list-item>
        <v-list-item-title>Всего операций</v-list-item-title>
        <v-list-item-subtitle class="text-right">{{ stats.totalOperations }}</v-list-item-subtitle>
      </v-list-item>
      
      <v-list-item>
        <v-list-item-title>Менеджеров</v-list-item-title>
        <v-list-item-subtitle class="text-right">{{ stats.totalManagers }}</v-list-item-subtitle>
      </v-list-item>
      
      <v-list-item>
        <v-list-item-title>Клиентов</v-list-item-title>
        <v-list-item-subtitle class="text-right">{{ stats.totalClients }}</v-list-item-subtitle>
      </v-list-item>
      
      <v-list-item>
        <v-list-item-title>Общая сумма</v-list-item-title>
        <v-list-item-subtitle class="text-right">{{ formatMoney(stats.totalAmount) }}</v-list-item-subtitle>
      </v-list-item>
      
      <v-list-item>
        <v-list-item-title>VAT операции</v-list-item-title>
        <v-list-item-subtitle class="text-right">{{ formatMoney(stats.vatAmount) }}</v-list-item-subtitle>
      </v-list-item>
      
      <v-list-item>
        <v-list-item-title>NO_VAT операции</v-list-item-title>
        <v-list-item-subtitle class="text-right">{{ formatMoney(stats.noVatAmount) }}</v-list-item-subtitle>
      </v-list-item>
      
      <v-list-item>
        <v-list-item-title>Период</v-list-item-title>
        <v-list-item-subtitle class="text-right">{{ stats.dateRange.first }} — {{ stats.dateRange.last }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <v-card-actions>
      <v-btn color="primary" @click="showManagers = !showManagers">
        {{ showManagers ? 'Скрыть' : 'Показать' }} менеджеров
      </v-btn>
    </v-card-actions>

    <v-expand-transition>
      <v-list v-if="showManagers">
        <v-list-item v-for="manager in managerList" :key="manager">
          <v-list-item-title>{{ manager }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { bufferService } from '@/services/bufferService';

const showManagers = ref(false);

const stats = bufferService.getBufferStats();
const managerList = bufferService.getManagerList();

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
</script>