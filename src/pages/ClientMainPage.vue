<template>
  <div class="client-main-page">
    <main class="main-content">
      <div class="content-container">
        <!-- Верхняя панель с табами и кнопками -->
        <div class="top-bar">
          <div class="tabs">
            <button class="tab active">Договор СЛ-658</button>
          </div>
          <div class="action-buttons-group">
            <button class="btn-primary">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path>
              </svg>
              Выставить счет
            </button>
            <button class="btn-outline">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 4H15V8H19V20H5V4ZM3.9985 2C3.44749 2 3 2.44405 3 2.9918V21.0082C3 21.5447 3.44476 22 3.9934 22H20.0066C20.5551 22 21 21.5489 21 20.9925L20.9997 7L16 2H3.9985ZM10.4999 7.5C10.4999 9.07749 10.0442 10.9373 9.27493 12.6534C8.50287 14.3757 7.46143 15.8502 6.37524 16.7191L7.55464 18.3321C10.4821 16.3804 13.7233 15.0421 16.8585 15.49L17.3162 13.5513C14.6435 12.6604 12.4999 9.98994 12.4999 7.5H10.4999ZM11.0999 13.4716C11.3673 12.8752 11.6042 12.2563 11.8037 11.6285C12.2753 12.3531 12.8553 13.0182 13.5101 13.5953C12.5283 13.7711 11.5665 14.0596 10.6352 14.4276C10.7999 14.1143 10.9551 13.7948 11.0999 13.4716Z" fill="#E60410"></path>
              </svg>
              Скачать договор
            </button>
          </div>
        </div>

        <!-- Карточка компании -->
        <div class="card company-card">
          <h3 class="company-name">ИП Руденко Станислав Владимирович</h3>
        </div>

        <!-- Сводка -->
        <div class="card summary-card">
          <p class="summary-title">Сводка</p>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path d="M2.50423 2.49983H17.5042C17.9645 2.49983 18.3376 2.87292 18.3376 3.33317V16.6665C18.3376 17.1268 17.9645 17.4998 17.5042 17.4998H2.50423C2.044 17.4998 1.6709 17.1268 1.6709 16.6665V3.33317C1.6709 2.87292 2.044 2.49983 2.50423 2.49983ZM16.6709 9.16651H3.33757V15.8332H16.6709V9.16651ZM16.6709 7.49983V4.1665H3.33757V7.49983H16.6709ZM11.6709 12.4998H15.0042V14.1665H11.6709V12.4998Z"></path>
                </svg>
              </div>
              <p class="stat-label">Количество карт</p>
              <h4 class="stat-value">14</h4>
              <p class="stat-unit">карт</p>
            </div>
            <div class="stat-item">
              <div class="stat-icon bg-secondary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14.0049 2.00275C18.4232 2.00275 22.0049 5.58447 22.0049 10.0027C22.0049 13.2474 20.0733 16.0408 17.2973 17.296C16.0422 20.0717 13.249 22.0027 10.0049 22.0027C5.5866 22.0027 2.00488 18.421 2.00488 14.0027C2.00488 10.7586 3.9359 7.96548 6.71122 6.71006C7.96681 3.93431 10.7603 2.00275 14.0049 2.00275ZM10.0049 8.00275C6.69117 8.00275 4.00488 10.689 4.00488 14.0027C4.00488 17.3165 6.69117 20.0027 10.0049 20.0027C13.3186 20.0027 16.0049 17.3165 16.0049 14.0027C16.0049 10.689 13.3186 8.00275 10.0049 8.00275ZM11.0049 9.00275V10.0027H13.0049V12.0027H9.00488C8.72874 12.0027 8.50488 12.2266 8.50488 12.5027C8.50488 12.7482 8.68176 12.9524 8.91501 12.9947L9.00488 13.0027H11.0049C12.3856 13.0027 13.5049 14.122 13.5049 15.5027C13.5049 16.8835 12.3856 18.0027 11.0049 18.0027V19.0027H9.00488V18.0027H7.00488V16.0027H11.0049C11.281 16.0027 11.5049 15.7789 11.5049 15.5027C11.5049 15.2573 11.328 15.0531 11.0948 15.0108L11.0049 15.0027H9.00488C7.62417 15.0027 6.50488 13.8835 6.50488 12.5027C6.50488 11.122 7.62417 10.0027 9.00488 10.0027V9.00275H11.0049ZM14.0049 4.00275C12.2214 4.00275 10.6196 4.78091 9.52064 6.01623C9.68133 6.00758 9.84254 6.00275 10.0049 6.00275C14.4232 6.00275 18.0049 9.58447 18.0049 14.0027C18.0049 14.1654 18 14.327 17.9905 14.4872C19.2265 13.3885 20.0049 11.7865 20.0049 10.0027C20.0049 6.68904 17.3186 4.00275 14.0049 4.00275Z" fill="white"></path>
                </svg>
              </div>
              <p class="stat-label">Баланс</p>
              <h4 class="stat-value">339,07</h4>
              <p class="stat-unit">Рублей</p>
            </div>
            <div class="stat-item">
              <div class="stat-icon bg-dark">
                <svg width="25" height="24" viewBox="0 0 25 24">
                  <path d="M12.5049 22.0027C6.98204 22.0027 2.50488 17.5256 2.50488 12.0027C2.50488 6.4799 6.98204 2.00275 12.5049 2.00275C18.0277 2.00275 22.5049 6.4799 22.5049 12.0027C22.5049 17.5256 18.0277 22.0027 12.5049 22.0027ZM12.5049 20.0027C16.9232 20.0027 20.5049 16.421 20.5049 12.0027C20.5049 7.58447 16.9232 4.00275 12.5049 4.00275C8.0866 4.00275 4.50488 7.58447 4.50488 12.0027C4.50488 16.421 8.0866 20.0027 12.5049 20.0027ZM9.00488 14.0027H14.5049C14.781 14.0027 15.0049 13.7789 15.0049 13.5027C15.0049 13.2266 14.781 13.0027 14.5049 13.0027H10.5049C9.12417 13.0027 8.00488 11.8835 8.00488 10.5027C8.00488 9.12203 9.12417 8.00275 10.5049 8.00275H11.5049V6.00275H13.5049V8.00275H16.0049V10.0027H10.5049C10.2287 10.0027 10.0049 10.2266 10.0049 10.5027C10.0049 10.7789 10.2287 11.0027 10.5049 11.0027H14.5049C15.8856 11.0027 17.0049 12.122 17.0049 13.5027C17.0049 14.8835 15.8856 16.0027 14.5049 16.0027H13.5049V18.0027H11.5049V16.0027H9.00488V14.0027Z"></path>
                </svg>
              </div>
              <p class="stat-label">Расход в этом месяце</p>
              <h4 class="stat-value">64 373,6</h4>
              <p class="stat-unit">Рублей</p>
            </div>
            <div class="stat-item">
              <div class="stat-icon bg-gray">
                <svg width="25" height="24" viewBox="0 0 25 24">
                  <path d="M18.2549 6.99979H21.2549C21.8072 6.99979 22.2549 7.4475 22.2549 7.99979V19.9998C22.2549 20.5521 21.8072 20.9998 21.2549 20.9998H3.25488C2.7026 20.9998 2.25488 20.5521 2.25488 19.9998V3.99979C2.25488 3.4475 2.7026 2.99979 3.25488 2.99979H18.2549V6.99979ZM4.25488 8.99979V18.9998H20.2549V8.99979H4.25488ZM4.25488 4.99979V6.99979H16.2549V4.99979H4.25488ZM15.2549 12.9998H18.2549V14.9998H15.2549V12.9998Z"></path>
                </svg>
              </div>
              <p class="stat-label">Ваша выгода в этом месяце</p>
              <h4 class="stat-value">13 725</h4>
              <p class="stat-unit">Рублей</p>
            </div>
          </div>
        </div>

        <!-- Пороги и последнее пополнение -->
        <div class="thresholds-and-replenishment">
          <div class="thresholds-wrapper">
            <div class="two-columns">
              <!-- Порог отключения -->
              <div class="card threshold-card">
                <div class="threshold-header">
                  <div class="stat-icon bg-secondary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14.0049 2.00275C18.4232 2.00275 22.0049 5.58447 22.0049 10.0027C22.0049 13.2474 20.0733 16.0408 17.2973 17.296C16.0422 20.0717 13.249 22.0027 10.0049 22.0027C5.5866 22.0027 2.00488 18.421 2.00488 14.0027C2.00488 10.7586 3.9359 7.96548 6.71122 6.71006C7.96681 3.93431 10.7603 2.00275 14.0049 2.00275ZM10.0049 8.00275C6.69117 8.00275 4.00488 10.689 4.00488 14.0027C4.00488 17.3165 6.69117 20.0027 10.0049 20.0027C13.3186 20.0027 16.0049 17.3165 16.0049 14.0027C16.0049 10.689 13.3186 8.00275 10.0049 8.00275ZM11.0049 9.00275V10.0027H13.0049V12.0027H9.00488C8.72874 12.0027 8.50488 12.2266 8.50488 12.5027C8.50488 12.7482 8.68176 12.9524 8.91501 12.9947L9.00488 13.0027H11.0049C12.3856 13.0027 13.5049 14.122 13.5049 15.5027C13.5049 16.8835 12.3856 18.0027 11.0049 18.0027V19.0027H9.00488V18.0027H7.00488V16.0027H11.0049C11.281 16.0027 11.5049 15.7789 11.5049 15.5027C11.5049 15.2573 11.328 15.0531 11.0948 15.0108L11.0049 15.0027H9.00488C7.62417 15.0027 6.50488 13.8835 6.50488 12.5027C6.50488 11.122 7.62417 10.0027 9.00488 10.0027V9.00275H11.0049ZM14.0049 4.00275C12.2214 4.00275 10.6196 4.78091 9.52064 6.01623C9.68133 6.00758 9.84254 6.00275 10.0049 6.00275C14.4232 6.00275 18.0049 9.58447 18.0049 14.0027C18.0049 14.1654 18 14.327 17.9905 14.4872C19.2265 13.3885 20.0049 11.7865 20.0049 10.0027C20.0049 6.68904 17.3186 4.00275 14.0049 4.00275Z" fill="white"></path>
                    </svg>
                  </div>
                </div>
                <p class="stat-label">Порог отключения, руб</p>
                <h4 class="stat-value">0</h4>
              </div>

              <!-- Порог уведомления -->
              <div class="card notification-threshold-card">
                <div class="threshold-header">
                  <div class="stat-icon bg-info">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9v4c0 .78.16 1.53.46 2.22L4.2 17.1c-.39.78.05 1.72.9 1.9.19.04.39.05.59.05h12.62c.2 0 .4-.01.59-.05.85-.18 1.29-1.12.9-1.9l-1.26-2.88c.3-.69.46-1.44.46-2.22V9c0-3.87-3.13-7-7-7zM8.5 19.5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5h-7z" fill="white"/>
                    </svg>
                  </div>
                  <button class="test-email-btn" @click="manualSendTest" title="Отправить уведомление">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                <p class="stat-label">Порог уведомления, руб</p>
                <div class="threshold-control">
                  <template v-if="!isEditing">
                    <h4 class="stat-value">{{ notificationThreshold }}</h4>
                    <button class="edit-threshold-btn" @click="startEditing" title="Редактировать порог">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                      </svg>
                    </button>
                  </template>
                  <template v-else>
                    <input 
                      v-model.number="editValue" 
                      type="number" 
                      class="threshold-input"
                      @keyup.enter="saveThreshold"
                      @keyup.esc="cancelEditing"
                      autofocus
                    />
                    <div class="edit-actions">
                      <button class="save-btn" @click="saveThreshold" title="Сохранить">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button class="cancel-btn" @click="cancelEditing" title="Отмена">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </template>
                </div>
                <p class="threshold-note">Уведомление при снижении баланса ниже указанной суммы</p>
              </div>
            </div>
          </div>

          <div class="replenishment-wrapper">
            <div class="card last-replenishment-card">
              <div class="card-header">
                <h5>Последнее пополнение</h5>
                <button class="link-btn">
                  <span>Посмотреть все</span>
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M2.50008 17.5C2.03985 17.5 1.66675 17.1269 1.66675 16.6667V3.33333C1.66675 2.8731 2.03985 2.5 2.50008 2.5H8.67858L10.3452 4.16667H16.6667C17.127 4.16667 17.5001 4.53977 17.5001 5V7.5H15.8334V5.83333H9.65492L7.98824 4.16667H3.33341V14.165L4.58341 9.16667H18.7501L16.8246 16.8687C16.7318 17.2397 16.3985 17.5 16.0161 17.5H2.50008ZM16.6154 10.8333H5.88471L4.63471 15.8333H15.3654L16.6154 10.8333Z"></path>
                  </svg>
                </button>
              </div>
              <div class="replenishment-details">
                <div>
                  <p class="detail-label">Дата</p>
                  <p class="detail-value">24-03-2026</p>
                </div>
                <div>
                  <p class="detail-label">Сумма</p>
                  <p class="detail-value">26 500</p>
                </div>
                <div>
                  <p class="detail-label">Номер документа</p>
                  <p class="detail-value">0ССО-002699</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Динамика расходов и последние счета -->
        <div class="two-columns bottom-sections">
          <div class="card expenses-card">
            <div class="card-header">
              <h5>Динамика расходов</h5>
              <div class="select-wrapper">
                <select class="custom-select">
                  <option value="6">За 6 месяцев</option>
                  <option value="3">За 3 месяца</option>
                  <option value="12">За 12 месяцев</option>
                </select>
                <svg width="16" height="16" viewBox="0 0 16 16" class="select-arrow">
                  <path d="M7.99992 9.33332L5.33325 6.66666H10.6666L7.99992 9.33332Z" fill="#2A2A2A"></path>
                </svg>
              </div>
            </div>
            <div class="chart-placeholder">
              <span class="text-grey">График динамики расходов</span>
            </div>
            <div class="card-footer">
              <button class="link-btn">
                <span>Отчеты и графики</span>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="card invoices-card">
            <div class="card-header">
              <h5>Последние счета</h5>
              <button class="btn-primary small">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path>
                </svg>
                Выставить счет
              </button>
            </div>
            <div class="table-wrapper">
              <table class="invoices-table">
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th class="text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="invoice-number">С260206-110</td>
                    <td>06-02-2026</td>
                    <td>5 000</td>
                    <td class="text-right">
                      <button class="download-btn">
                        <span>Скачать</span>
                        <svg width="20" height="20" viewBox="0 0 20 20">
                          <path d="M10.8333 9.99999H13.3333L10 13.3333L6.66667 9.99999H9.16667V6.66666H10.8333V9.99999ZM12.5 3.33332H4.16667V16.6667H15.8333V6.66666H12.5V3.33332ZM2.5 2.49316C2.5 2.0367 2.87291 1.66666 3.33208 1.66666H13.3333L17.4998 5.83332L17.5 17.4937C17.5 17.9574 17.1293 18.3333 16.6722 18.3333H3.32783C2.87063 18.3333 2.5 17.9539 2.5 17.5068V2.49316Z"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td class="invoice-number">С251219-112</td>
                    <td>19-12-2025</td>
                    <td>1 000</td>
                    <td class="text-right">
                      <button class="download-btn">
                        <span>Скачать</span>
                        <svg width="20" height="20" viewBox="0 0 20 20">
                          <path d="M10.8333 9.99999H13.3333L10 13.3333L6.66667 9.99999H9.16667V6.66666H10.8333V9.99999ZM12.5 3.33332H4.16667V16.6667H15.8333V6.66666H12.5V3.33332ZM2.5 2.49316C2.5 2.0367 2.87291 1.66666 3.33208 1.66666H13.3333L17.4998 5.83332L17.5 17.4937C17.5 17.9574 17.1293 18.3333 16.6722 18.3333H3.32783C2.87063 18.3333 2.5 17.9539 2.5 17.5068V2.49316Z"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-footer">
              <button class="link-btn primary">
                <span>Все счета</span>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const API_BASE_URL = 'https://kpi-project.vercel.app'

const notificationThreshold = ref(500)
const isEditing = ref(false)
const editValue = ref(500)
const userEmail = ref('egorov.ivan.w@gmail.com')
const userName = ref('ИП Руденко Станислав Владимирович')
const userId = ref('user-123')

const loadThreshold = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save-threshold?userId=${userId.value}`)
    const data = await response.json()
    notificationThreshold.value = data.threshold
    if (data.email) userEmail.value = data.email
  } catch (error) {
    console.error('Ошибка загрузки порога:', error)
  }
}

const saveThreshold = async () => {
  if (!isNaN(editValue.value) && editValue.value >= 0) {
    notificationThreshold.value = editValue.value
    
    try {
      await fetch(`${API_BASE_URL}/api/save-threshold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.value,
          threshold: editValue.value,
          email: userEmail.value
        })
      })
      console.log('Порог сохранен на сервере')
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    }
    
    const currentBalance = 339.07
    if (currentBalance <= editValue.value) {
      sendNotification(currentBalance, editValue.value)
    } else {
      alert(`Порог сохранен: ${editValue.value} руб.`)
    }
  }
  isEditing.value = false
}

const sendNotification = async (balance: number, threshold: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail.value,
        balance: balance,
        threshold: threshold,
        userName: userName.value
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert(`Уведомление отправлено на ${userEmail.value}`)
    } else {
      alert(`Ошибка: ${result.error}`)
    }
  } catch (error) {
    console.error('Ошибка отправки:', error)
    alert('Не удалось отправить уведомление')
  }
}

const manualSendTest = () => {
  const currentBalance = 339.07
  if (currentBalance <= notificationThreshold.value) {
    sendNotification(currentBalance, notificationThreshold.value)
  } else {
    alert(`Текущий баланс (${currentBalance} руб.) выше порога (${notificationThreshold.value} руб.)`)
  }
}

onMounted(() => {
  loadThreshold()
})

const startEditing = () => {
  editValue.value = notificationThreshold.value
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
}
</script>

<style scoped>
.client-main-page {
  min-height: 100vh;
  background-color: #F8F9FC;
}

.main-content {
  padding: 24px;
}

.content-container {
  max-width: 1600px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tab {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: white;
  color: #666;
}

.tab.active {
  background: #E60410;
  color: white;
}

.action-buttons-group {
  display: flex;
  gap: 12px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #E60410;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary.small {
  padding: 6px 16px;
  font-size: 13px;
}

.btn-outline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: transparent;
  border: 1px solid #E60410;
  color: #E60410;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  border: 1px solid #E8E9ED;
}

.company-name {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
}

.summary-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.bg-primary {
  background: #E60410;
}

.bg-secondary {
  background: #FF9800;
}

.bg-dark {
  background: #2A2A2A;
}

.bg-gray {
  background: #8F9197;
}

.bg-info {
  background: #2196F3;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.stat-unit {
  font-size: 11px;
  color: #999;
  margin: 0;
}

.thresholds-and-replenishment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.thresholds-wrapper .two-columns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 0;
}

.notification-threshold-card {
  position: relative;
}

.threshold-control {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  min-height: 48px;
}

.edit-threshold-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8F9197;
}

.threshold-input {
  width: 120px;
  padding: 8px 12px;
  font-size: 24px;
  font-weight: 600;
  border: 2px solid #E60410;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  text-align: center;
}

.edit-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.save-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: #4CAF50;
}

.cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: #f44336;
}

.threshold-note {
  font-size: 11px;
  color: #999;
  margin-top: 12px;
  line-height: 1.4;
}

.last-replenishment-card {
  height: 100%;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.card-header h5 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.link-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #E60410;
  cursor: pointer;
  font-size: 13px;
}

.replenishment-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
}

.detail-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.two-columns.bottom-sections {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 0;
}

.select-wrapper {
  position: relative;
}

.custom-select {
  padding: 6px 28px 6px 12px;
  border: 1px solid #E8E9ED;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  appearance: none;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.chart-placeholder {
  height: 300px;
  background: #FAFAFA;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin: 16px 0;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.table-wrapper {
  overflow-x: auto;
}

.invoices-table {
  width: 100%;
  border-collapse: collapse;
}

.invoices-table th {
  text-align: left;
  padding: 12px 0;
  font-size: 11px;
  font-weight: 500;
  color: #999;
  border-bottom: 1px solid #E8E9ED;
}

.invoices-table td {
  padding: 12px 0;
  font-size: 13px;
  border-bottom: 1px solid #E8E9ED;
}

.text-right {
  text-align: right;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #2A2A2A;
  cursor: pointer;
  font-size: 12px;
}

.test-email-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8F9197;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .thresholds-and-replenishment {
    grid-template-columns: 1fr;
  }
  
  .thresholds-wrapper .two-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .two-columns.bottom-sections {
    grid-template-columns: 1fr;
  }
  
  .thresholds-wrapper .two-columns {
    grid-template-columns: 1fr;
  }
  
  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .replenishment-details {
    flex-direction: column;
    gap: 12px;
  }
}
</style>