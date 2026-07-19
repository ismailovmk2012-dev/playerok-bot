import { execSync } from 'child_process';
import http from 'http';
const url = 'https://githubusercontent.com';
console.log('⏳ Загрузка финальной версии бота...');
execSync(`curl -s -L -o bot_main.js "${url}"`);
http.createServer((req, res) => { res.writeHead(200); res.end('OK'); }).listen(process.env.PORT || 10000);
import('./bot_main.js').then(() => console.log('🚀 УСПЕШНЫЙ ЗАПУСК!')).catch(e => console.error(e));
