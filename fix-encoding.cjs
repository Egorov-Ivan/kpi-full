const fs = require('fs');

const files = ['client_first_dates', 'kpi_received_clients', 'kpi_vat_details'];

files.forEach(name => {
  let data = fs.readFileSync(name + '.csv', 'binary');
  let buffer = Buffer.from(data, 'binary');
  let utf8 = buffer.toString('utf8');
  fs.writeFileSync(name + '.csv', utf8);
  console.log(`✅ ${name}.csv`);
});