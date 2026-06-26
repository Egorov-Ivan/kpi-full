const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// API
app.get('/api/kpi-settings', (req, res) => require('./api/kpi-settings').default(req, res));
app.all('/api/kpi-vat', (req, res) => require('./api/kpi-vat').default(req, res));
app.all('/api/client-first-dates', (req, res) => require('./api/client-first-dates').default(req, res));
app.get('/api/proxy/rn-card-balance', (req, res) => require('./api/proxy/rn-card-balance').default(req, res));
app.post('/api/telegram-webhook', (req, res) => require('./api/telegram-webhook').default(req, res));

// Статика
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(3001, () => console.log('Server on port 3001'));