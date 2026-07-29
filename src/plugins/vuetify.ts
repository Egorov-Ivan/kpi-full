// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

// Цвета из Benzigo CRM
const benzigoColors = {
  primary: '#E60410',
  secondary: '#8F9197',
  accent: '#2A2A2A',
  error: '#FF4C51',
  info: '#16B1FF',
  success: '#56CA00',
  warning: '#FFB400',
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: benzigoColors,
      },
    },
  },
})