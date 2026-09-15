<!-- src/components/Board.vue -->
<template>
  <div class="kanban-board pa-4">
    <!-- Заголовок и управление -->
    <div class="d-flex align-center flex-wrap gap-3 mb-4">
      <h2 class="text-h5 font-weight-medium mb-0">Доска задач</h2>
      <v-spacer></v-spacer>
      
      <v-text-field
        v-model="search"
        label="Поиск задач..."
        prepend-inner-icon="ri-search-line"
        variant="outlined"
        density="compact"
        hide-details
        class="search-field"
        clearable
      ></v-text-field>
      
      <v-btn color="primary" size="small" @click="openCreateDialog" class="ml-2">
        <v-icon start>ri-add-line</v-icon>
        Новая задача
      </v-btn>
    </div>

    <!-- Доска -->
    <div class="board-container">
      <div 
        v-for="column in columns" 
        :key="column.id"
        class="board-column"
        :class="`column-${column.id}`"
        @dragover.prevent
        @drop="handleDrop($event, column.id)"
      >
        <div class="column-header d-flex align-center pa-3">
          <div class="d-flex align-center">
            <v-icon :color="column.color" size="20" class="mr-2">{{ column.icon }}</v-icon>
            <span class="font-weight-medium">{{ column.title }}</span>
          </div>
          <v-spacer></v-spacer>
          <span class="text-caption text-medium-emphasis">{{ getTasksByStatus(column.id).length }}</span>
        </div>
        
        <div class="column-body pa-2">
          <div
            v-for="task in getFilteredTasks(column.id)"
            :key="task.id"
            class="task-card pa-3 mb-2"
            draggable="true"
            @dragstart="handleDragStart($event, task.id)"
            @click="openEditDialog(task)"
          >
            <div class="d-flex align-start mb-2">
              <v-chip
                :color="getPriorityColor(task.priority)"
                size="x-small"
                class="mr-2"
                label
              >
                {{ task.priority }}
              </v-chip>
              <span class="text-subtitle-2 font-weight-medium flex-grow-1">{{ task.title }}</span>
            </div>
            
            <p class="text-body-2 text-medium-emphasis mb-3">{{ task.description }}</p>
            
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-2">
                <v-avatar size="24" :color="getAvatarColor(task.assignee)">
                  <span class="text-caption white--text">{{ getInitials(task.assignee) }}</span>
                </v-avatar>
                <span class="text-caption text-medium-emphasis">{{ task.assignee }}</span>
              </div>
              
              <div class="d-flex align-center gap-2">
                <v-icon size="16" color="medium-emphasis">ri-attachment-2</v-icon>
                <span class="text-caption">{{ task.attachments.length }}</span>
                <v-icon size="16" color="medium-emphasis">ri-chat-3-line</v-icon>
                <span class="text-caption">{{ task.comments.length }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="getFilteredTasks(column.id).length === 0" class="empty-column text-center pa-4">
            <v-icon size="32" color="grey-lighten-1">ri-inbox-line</v-icon>
            <p class="text-caption text-grey mt-2">Нет задач</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог создания/редактирования задачи -->
    <v-dialog v-model="showTaskDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          {{ editingTask ? 'Редактировать задачу' : 'Новая задача' }}
          <v-spacer></v-spacer>
          <v-btn icon variant="text" size="small" @click="showTaskDialog = false">
            <v-icon>ri-close-line</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form @submit.prevent="saveTask">
            <v-text-field
              v-model="taskForm.title"
              label="Название задачи"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="taskForm.description"
              label="Описание"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mb-3"
              auto-grow
            ></v-textarea>
            
            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="taskForm.status"
                  label="Статус"
                  :items="statusOptions"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                ></v-select>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="taskForm.priority"
                  label="Приоритет"
                  :items="priorityOptions"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                ></v-select>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="taskForm.assignee"
                  label="Исполнитель"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="taskForm.dueDate"
                  label="Срок выполнения"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-text-field
              v-model="taskForm.tags"
              label="Теги (через запятую)"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hint="Например: frontend, backend, bug"
              persistent-hint
            ></v-text-field>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showTaskDialog = false">Отмена</v-btn>
          <v-btn color="primary" @click="saveTask">
            {{ editingTask ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Comment {
  id: number
  text: string
  author: string
  date: string
}

interface Task {
  id: number
  title: string
  description: string
  status: string
  priority: string
  assignee: string
  dueDate: string
  tags: string[]
  attachments: any[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

const columns = [
  { id: 'todo', title: 'К выполнению', icon: 'ri-checkbox-blank-circle-line', color: '#6B7280' },
  { id: 'in_progress', title: 'В работе', icon: 'ri-loader-4-line', color: '#3B82F6' },
  { id: 'review', title: 'На проверке', icon: 'ri-eye-line', color: '#F59E0B' },
  { id: 'done', title: 'Готово', icon: 'ri-checkbox-circle-line', color: '#10B981' }
]

const statusOptions = [
  { title: 'К выполнению', value: 'todo' },
  { title: 'В работе', value: 'in_progress' },
  { title: 'На проверке', value: 'review' },
  { title: 'Готово', value: 'done' }
]

const priorityOptions = ['Высокий', 'Средний', 'Низкий']

const tasks = ref<Task[]>([])
const search = ref('')
const showTaskDialog = ref(false)
const editingTask = ref<Task | null>(null)
const draggedTaskId = ref<number | null>(null)

const taskForm = ref({
  title: '',
  description: '',
  status: 'todo',
  priority: 'Средний',
  assignee: '',
  dueDate: '',
  tags: ''
})

// Загрузка задач из localStorage
onMounted(() => {
  const savedTasks = localStorage.getItem('kanban_tasks')
  if (savedTasks) {
    tasks.value = JSON.parse(savedTasks)
  } else {
    // Демо-данные
    tasks.value = [
      {
        id: 1,
        title: 'Разработать дизайн страницы',
        description: 'Создать макет главной страницы',
        status: 'todo',
        priority: 'Высокий',
        assignee: 'Иван Петров',
        dueDate: '2024-01-20',
        tags: ['design'],
        attachments: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Интеграция с API',
        description: 'Подключить REST API для данных',
        status: 'in_progress',
        priority: 'Высокий',
        assignee: 'Мария Иванова',
        dueDate: '2024-01-25',
        tags: ['backend'],
        attachments: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Тестирование функционала',
        description: 'Проверить работу основных функций',
        status: 'review',
        priority: 'Средний',
        assignee: 'Алексей Сидоров',
        dueDate: '2024-01-30',
        tags: ['testing'],
        attachments: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    saveTasks()
  }
})

// Сохранение задач
const saveTasks = () => {
  localStorage.setItem('kanban_tasks', JSON.stringify(tasks.value))
}

// Получение задач по статусу
const getTasksByStatus = (status: string) => {
  return tasks.value.filter(task => task.status === status)
}

// Получение отфильтрованных задач
const getFilteredTasks = (status: string) => {
  let filtered = getTasksByStatus(status)
  
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower) ||
      task.assignee.toLowerCase().includes(searchLower) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }
  
  return filtered
}

// Drag & Drop
const handleDragStart = (event: DragEvent, taskId: number) => {
  draggedTaskId.value = taskId
  event.dataTransfer?.setData('text/plain', taskId.toString())
}

const handleDrop = (event: DragEvent, status: string) => {
  const taskId = parseInt(event.dataTransfer?.getData('text/plain') || '')
  if (taskId) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = status
      task.updatedAt = new Date().toISOString()
      saveTasks()
    }
  }
  draggedTaskId.value = null
}

// Открытие диалога создания
const openCreateDialog = () => {
  editingTask.value = null
  taskForm.value = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'Средний',
    assignee: '',
    dueDate: '',
    tags: ''
  }
  showTaskDialog.value = true
}

// Открытие диалога редактирования
const openEditDialog = (task: Task) => {
  editingTask.value = task
  taskForm.value = {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee,
    dueDate: task.dueDate,
    tags: task.tags.join(', ')
  }
  showTaskDialog.value = true
}

// Сохранение задачи
const saveTask = () => {
  if (!taskForm.value.title) return
  
  const tags = taskForm.value.tags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag)
  
  if (editingTask.value) {
    // Обновление существующей задачи
    const index = tasks.value.findIndex(t => t.id === editingTask.value!.id)
    if (index !== -1) {
      tasks.value[index] = {
        ...tasks.value[index],
        ...taskForm.value,
        tags,
        updatedAt: new Date().toISOString()
      }
    }
  } else {
    // Создание новой задачи
    const newTask: Task = {
      id: Date.now(),
      ...taskForm.value,
      tags,
      attachments: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    tasks.value.push(newTask)
  }
  
  saveTasks()
  showTaskDialog.value = false
}

// Вспомогательные функции
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Высокий': return 'error'
    case 'Средний': return 'warning'
    case 'Низкий': return 'info'
    default: return 'grey'
  }
}

const getAvatarColor = (name: string) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<style scoped>
.kanban-board {
  min-height: calc(100vh - 64px);
}

.search-field {
  max-width: 300px;
}

.board-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
  min-height: calc(100vh - 180px);
}

.board-column {
  flex: 1;
  min-width: 280px;
  max-width: 350px;
  background: #f5f5f5;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 180px);
}

.column-header {
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 12px 12px 0 0;
}

.column-body {
  flex: 1;
  overflow-y: auto;
  min-height: 100px;
}

.task-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  cursor: grab;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.task-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
  border-color: #1976D2;
}

.task-card:active {
  cursor: grabbing;
}

.empty-column {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
}

/* Тёмная тема */
:deep(.dark-theme) .board-column {
  background: #2A2A2A;
  border-color: #3A3A3A;
}

:deep(.dark-theme) .column-header {
  background: #1E1E1E;
  border-color: #3A3A3A;
}

:deep(.dark-theme) .task-card {
  background: #1E1E1E;
  border-color: #3A3A3A;
  color: rgba(255,255,255,0.9);
}

:deep(.dark-theme) .task-card:hover {
  border-color: #1976D2;
}

/* Адаптивность */
@media (max-width: 768px) {
  .board-container {
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .board-column {
    max-width: 100%;
    min-width: 100%;
    max-height: none;
    margin-bottom: 16px;
  }
  
  .column-body {
    max-height: 300px;
  }
}
</style>