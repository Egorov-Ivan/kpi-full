// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/pages/MainPage.vue'
import KpiCalculator from '@/pages/KPICalculator.vue'
import ManagerPage from '@/pages/ManagerPage.vue'
import ClientMainPage from '@/pages/ClientMainPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
  path: '/',
  redirect: '/kpi-calculator'
    },
    {
      path: '/',
      name: 'home',
      component: MainPage
    },
    {
      path: '/manager',
      name: 'manager',
      component: ManagerPage
    },
    {
      path: '/kpi-calculator',
      name: 'kpi-calculator',
      component: KpiCalculator
    },
    {
      path: '/client-main-page',
      name: 'client-main-page',
      component: ClientMainPage
    }
  ] // Закрываем массив routes
}) // Закрываем createRouter

export default router