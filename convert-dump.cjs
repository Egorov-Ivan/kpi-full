const fs = require('fs');

let dump = fs.readFileSync('C:\\Users\\2\\Desktop\\dump.sql', 'utf-8');

// Убираем PostgreSQL-специфику
dump = dump.replace(/CREATE SEQUENCE.*?;/gs, '');
dump = dump.replace(/ALTER SEQUENCE.*?;/gs, '');
dump = dump.replace(/SELECT pg_catalog.setval.*?;/g, '');
dump = dump.replace(/::jsonb/g, '');
dump = dump.replace(/::integer/g, '');
dump = dump.replace(/TIMESTAMP WITH TIME ZONE/g, 'TIMESTAMP');
dump = dump.replace(/TIMESTAMP WITHOUT TIME ZONE/g, 'TIMESTAMP');
dump = dump.replace(/character varying/g, 'VARCHAR');
dump = dump.replace(/SERIAL/g, 'INT AUTO_INCREMENT');
dump = dump.replace(/public\./g, '');
dump = dump.replace(/ALTER TABLE ONLY.*?ADD CONSTRAINT.*?PRIMARY KEY.*?;/g, '');
dump = dump.replace(/ALTER TABLE ONLY.*?ADD CONSTRAINT.*?UNIQUE.*?;/g, '');
dump = dump.replace(/\\\./g, ';');
dump = dump.replace(/\\restrict.*?\n/g, '');
dump = dump.replace(/\\unrestrict.*?\n/g, '');
dump = dump.replace(/SET .*?;/g, '');
dump = dump.replace(/SELECT .*?;/g, '');

fs.writeFileSync('C:\\Users\\2\\Desktop\\mysql_dump.sql', dump, 'utf-8');
console.log('✅ Готово: mysql_dump.sql на рабочем столе');